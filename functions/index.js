const { onRequest } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

initializeApp()
const db = getFirestore()

// YYYY-MM-DD, matching how the client derives "today" (new Date().toISOString()).
const todayStr = () => new Date().toISOString().slice(0, 10)

// Look up the owning user by their API token. Admin SDK queries bypass
// security rules, so this is safe to run for unauthenticated external callers.
async function uidFromToken(token) {
  if (!token || typeof token !== 'string') return null
  const snap = await db.collection('users').where('apiToken', '==', token).limit(1).get()
  return snap.empty ? null : snap.docs[0].id
}

// Resolve a category by its title (as sent in the request) to its document id.
// Returns null when no name is given or no matching category exists.
async function resolveCategoryId(uid, name) {
  if (!name || typeof name !== 'string') return null
  const snap = await db
    .collection('users').doc(uid).collection('categories')
    .where('title', '==', name).limit(1).get()
  return snap.empty ? null : snap.docs[0].id
}

async function createTasks(req, res) {
  const { token, date, category, task, tasks } = req.body || {}
  const uid = await uidFromToken(token)
  if (!uid) return res.status(401).json({ error: 'Invalid or missing token' })

  const raw = Array.isArray(tasks) ? tasks : (task != null ? [task] : [])
  const titles = raw.map((t) => String(t).trim()).filter(Boolean)
  if (!titles.length) return res.status(400).json({ error: 'task or tasks is required' })

  // Missing date => "No date" (null). Missing/unknown category => "No category" (null).
  const taskDate = date ? String(date) : null
  const categoryId = await resolveCategoryId(uid, category)

  const col = db.collection('users').doc(uid).collection('todos')
  const batch = db.batch()
  const created = []
  for (const title of titles) {
    const ref = col.doc()
    batch.set(ref, {
      title,
      order: 0,
      date: taskDate,
      done: false,
      categoryId,
      createdAt: FieldValue.serverTimestamp()
    })
    created.push({ id: ref.id, title })
  }
  await batch.commit()

  return res.status(201).json({ ok: true, date: taskDate, categoryId, created })
}

async function getTasks(req, res) {
  const { token, date, category } = req.body || {}
  const uid = await uidFromToken(token)
  if (!uid) return res.status(401).json({ error: 'Invalid or missing token' })

  // Missing date => today.
  const taskDate = date ? String(date) : todayStr()
  let q = db.collection('users').doc(uid).collection('todos').where('date', '==', taskDate)

  if (category) {
    const categoryId = await resolveCategoryId(uid, category)
    if (!categoryId) return res.json({ date: taskDate, tasks: [] })
    q = q.where('categoryId', '==', categoryId)
  }

  const snap = await q.get()
  const result = snap.docs
    .map((d) => {
      const x = d.data()
      return {
        id: d.id,
        title: x.title,
        date: x.date ?? null,
        done: !!x.done,
        categoryId: x.categoryId ?? null,
        order: x.order ?? 0
      }
    })
    .sort((a, b) => a.order - b.order)

  return res.json({ date: taskDate, tasks: result })
}

function taskIdsFromBody(body) {
  const raw = Array.isArray(body?.ids) ? body.ids : (body?.id != null ? [body.id] : [])
  const ids = [...new Set(raw.map((id) => String(id).trim()).filter(Boolean))]

  if (!ids.length) return { error: 'id or ids is required' }
  if (ids.length > 500) return { error: 'A maximum of 500 task IDs is allowed' }
  if (ids.some((id) => id.includes('/'))) return { error: 'Invalid task ID' }

  return { ids }
}

async function ownedTaskRefs(uid, ids) {
  const col = db.collection('users').doc(uid).collection('todos')
  const refs = ids.map((id) => col.doc(id))
  const snapshots = await db.getAll(...refs)
  const missing = snapshots.filter((snap) => !snap.exists).map((snap) => snap.id)
  return { refs, missing }
}

async function deleteTasks(req, res) {
  const { token } = req.body || {}
  const uid = await uidFromToken(token)
  if (!uid) return res.status(401).json({ error: 'Invalid or missing token' })

  const parsed = taskIdsFromBody(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const { refs, missing } = await ownedTaskRefs(uid, parsed.ids)
  if (missing.length) return res.status(404).json({ error: 'Task not found', missing })

  const batch = db.batch()
  refs.forEach((ref) => batch.delete(ref))
  await batch.commit()

  return res.json({ ok: true, deleted: parsed.ids })
}

async function completeTasks(req, res) {
  const { token } = req.body || {}
  const uid = await uidFromToken(token)
  if (!uid) return res.status(401).json({ error: 'Invalid or missing token' })

  const parsed = taskIdsFromBody(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const { refs, missing } = await ownedTaskRefs(uid, parsed.ids)
  if (missing.length) return res.status(404).json({ error: 'Task not found', missing })

  const batch = db.batch()
  refs.forEach((ref) => batch.update(ref, { done: true }))
  await batch.commit()

  return res.json({ ok: true, completed: parsed.ids })
}

// Single HTTPS entry point. Firebase Hosting rewrites /api/** to this function,
// so req.path may arrive as "/api/tasks" or "/tasks" depending on the caller.
exports.api = onRequest({ cors: true }, async (req, res) => {
  try {
    const route = (req.path || '/').replace(/^\/api/, '') || '/'

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (route === '/tasks' || route === '/tasks/create') return await createTasks(req, res)
    if (route === '/tasks/get') return await getTasks(req, res)
    if (route === '/tasks/delete') return await deleteTasks(req, res)
    if (route === '/tasks/complete') return await completeTasks(req, res)

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('API error', err)
    return res.status(500).json({ error: 'Internal error' })
  }
})
