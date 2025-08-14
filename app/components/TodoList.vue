<template>
  <LoadingOverlay v-if="loading" />
  <div class="max-w-3xl text-black">
    <h2 class="text-2xl font-bold flex items-center gap-1 pb-2"
      :style="{
        color: activeCategory?.image
          ? '#fff'
          : (activeCategory?.background ? textColor(activeCategory.background) : undefined)
      }">
      <span
        class="material-symbols-outlined text-4xl ml-auto md:ml-0"
        v-if="activeCategory?.icon"
        >
        {{ activeCategory.icon }}
      </span>
      <span v-else class="material-symbols-outlined ml-auto md:ml-0">checklist</span>
      {{ activeCategory?.title || 'ToDo' }} :: {{ day }}
      <div v-if="user" class="ml-auto flex items-center gap-2">
        <button
          v-if="!shareId"
          @click="shareList"
          class="material-symbols-outlined"
          aria-label="Share list"
        >share</button>
        <button v-else
          @click="unshareList"
          class="material-symbols-outlined"
          aria-label="Make list private"
        >link_off</button>
      </div>
    </h2>
    <input
      v-if="shareId"
      type="text"
      readonly
      :value="shareUrl"
      class="border rounded p-2 w-full bg-white/70 mb-2"
      @focus="(e) => (e.target as HTMLInputElement).select()"
    />
    <div class="space-y-2">
      <div class="flex flex-col md:flex-row gap-2">
        <input
          v-model="title"
          @keyup.enter="add"
          placeholder="New task…"
          class="border rounded px-3 py-2 flex-1 w-full"
        />
        <div class="flex flex-row gap-2 h-10">
          <select v-model="categoryId" class="border rounded px-2 w-full md:w-auto">
            <option value="">No category</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">
              {{ c.title }}
            </option>
          </select>
          <button @click="add" class="bg-primary text-white px-4 rounded w-full md:w-auto shadow-[0_0_2px_white]">Add</button>
        </div>
      </div>
      <draggable
        :modelValue="list"
        item-key="id"
        tag="ul"
        class="space-y-2 animate__animated animate__fadeIn"
        handle=".drag-handle"
        :animation="200"
        chosen-class="is-chosen"
        ghost-class="is-ghost"
        @update:modelValue="onReorder"
      >
        <template #item="{ element: t, index: i }">
          <li>
            <div class="bg-white border rounded p-2 flex items-center gap-2">
              <span class="material-symbols-outlined drag-handle cursor-grab select-none">drag_indicator</span>

              <label class="flex items-center gap-2 flex-1">
                <input class="w-5 h-5 accent-green-600" type="checkbox" :checked="t.done" @change="toggle(i)" />
                <span :class="{ 'line-through text-gray-400': t.done }">{{ t.title }}</span>
              </label>

              <span
                v-if="t.categoryId && categoryMap[t.categoryId]"
                class="text-xs px-2 py-1 rounded flex items-center gap-1"
                :style="{ background: categoryMap[t.categoryId]?.background, color: textColor(categoryMap[t.categoryId]?.background || '') }"
              >
              <span v-if="categoryMap[t.categoryId]?.icon" class="material-symbols-outlined">
                  {{ categoryMap[t.categoryId]?.icon }}
                </span>
                {{ categoryMap[t.categoryId]?.title }}
              </span>

              <button @click="openEdit(i)" aria-label="Edit task">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="text-red-500" @click="deleteTask(i)" aria-label="Remove task">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </li>
        </template>
      </draggable>
    </div>
    <div
      v-if="editIndex !== null"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000]"
    >
      <div class="bg-white p-6 rounded shadow max-w-sm w-full">
        <h3 class="text-lg font-bold mb-4">Edit task</h3>
        <input
          v-model="editTitle"
          class="border rounded px-3 py-2 w-full mb-2"
        />
        <select
          v-model="editCategoryId"
          class="border rounded px-3 py-2 w-full mb-2"
        >
          <option value="">No category</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.title }}
          </option>
        </select>
        <input
          type="date"
          v-model="editDate"
          class="border rounded px-3 py-2 w-full mb-4"
        />
        <div class="flex justify-end gap-2">
          <button @click="closeEdit" class="px-4 py-2 rounded border">
            Cancel
          </button>
          <button @click="saveEdit" class="bg-primary text-white px-4 py-2 rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useFirebaseApp } from 'vuefire'
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  getDocs,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import draggable from 'vuedraggable'
import { textColor } from '../utils/color'

interface Todo {
  id?: string
  title: string
  order: number
  date: string
  done: boolean
  categoryId: string | null
  createdAt?: Timestamp | null
}

interface Category {
  id: string
  title: string
  icon: string
  background: string
  image?: string
}

const day = useState('day', () => new Date().toISOString().slice(0, 10))
const user = useState<{ uid: string } | null>('user', () => null)
const categories = useState<Category[]>('categories', () => [])
const activeCategoryId = useState<string>('activeCategoryId', () => '')

const activeCategory = computed(() =>
  categories.value.find((c) => c.id === activeCategoryId.value)
)

const pageTitle = computed(
  () => `${activeCategory.value?.title ?? 'Todo'} :: ${day.value} - Todo Everyday`
)
useHead({ title: pageTitle })

const app = useFirebaseApp()
const db = getFirestore(app)

const tasks = useState<Todo[]>('tasks', () => [])
const loading = ref(true)
const month = computed(() => day.value.slice(0, 7))
let off: (() => void) | null = null

const shareId = ref<string | null>(null)
const shareUrl = computed(() =>
  shareId.value
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareId.value}`
    : ''
)

const categoryId = ref('')
const categoryMap = computed<Record<string, Category>>(() => {
  const map: Record<string, Category> = {}
  for (const c of categories.value) {
    if (c.id) map[c.id] = c
  }
  return map
})

watch(activeCategoryId, id => {
  categoryId.value = id
}, { immediate: true })

const loadShare = async () => {
  if (!user.value) { shareId.value = null; return }
  const q = query(
    collection(db, 'share'),
    where('uid', '==', user.value.uid),
    where('date', '==', day.value),
    where('categoryId', '==', activeCategoryId.value || '')
  )
  const snap = await getDocs(q)
  shareId.value = snap.empty ? null : snap.docs[0].id
}

watch([user, day, activeCategoryId], loadShare, { immediate: true })


const loadMonth = (m: string) => {
  if (!user.value) return
  const start = format(startOfMonth(new Date(m + '-01')), 'yyyy-MM-dd')
  const end = format(endOfMonth(new Date(m + '-01')), 'yyyy-MM-dd')
  if (off) off()
  loading.value = true
  const q = query(
    collection(db, 'users', user.value.uid, 'todos'),
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date'),
    orderBy('order'),
    orderBy('createdAt', 'desc'),
  )
  off = onSnapshot(q, (snap) => {
    tasks.value = snap.docs.map((d) => {
      const data = d.data() as Omit<Todo, 'id'>
      return {
        id: d.id,
        ...data,
        categoryId: data.categoryId ?? null,
        createdAt: data.createdAt ?? null
      }
    })
    loading.value = false
  })
}

watch([user, month], ([u, m]) => {
  if (u) loadMonth(m)
  else {
    tasks.value = []
    if (off) {
      off()
      off = null
    }
    loading.value = false
  }
}, { immediate: true })

onUnmounted(() => {
  if (off) off()
})

const list = computed(() =>
  tasks.value.filter(
    (t) =>
      t.date === day.value && (!activeCategoryId.value || t.categoryId === activeCategoryId.value)
  )
)

const title = ref('')

const editIndex = ref<number | null>(null)
const editTitle = ref('')
const editCategoryId = ref('')
const editDate = ref('')

const openEdit = (i: number) => {
  const t = list.value[i]
  if (!t) return
  editIndex.value = i
  editTitle.value = t.title
  editCategoryId.value = t.categoryId || ''
  editDate.value = t.date
}

const closeEdit = () => {
  editIndex.value = null
  editTitle.value = ''
  editCategoryId.value = ''
  editDate.value = ''
}

const saveEdit = async () => {
  if (editIndex.value === null || !user.value) return
  const t = list.value[editIndex.value]
  const title = editTitle.value.trim()
  const categoryId = editCategoryId.value || null
  const date = editDate.value
  closeEdit()
  if (t?.id)
    await updateDoc(doc(db, 'users', user.value.uid, 'todos', t.id), {
      title,
      categoryId,
      date,
    })
}

const add = async () => {
  const s = title.value.trim()
  if (!s || !user.value) return
  title.value = ''
  await addDoc(collection(db, 'users', user.value.uid, 'todos'), {
    title: s,
    order: 0,
    date: day.value,
    done: false,
    categoryId: categoryId.value || null,
    createdAt: serverTimestamp()
  })
}

const deleteTask = async (i: number) => {
  if (!user.value) return
  const t = list.value[i]
  if (t?.id) await deleteDoc(doc(db, 'users', user.value.uid, 'todos', t.id))
}

const toggle = async (i: number) => {
  if (!user.value) return
  const t = list.value[i]
  if (t?.id) await updateDoc(doc(db, 'users', user.value.uid, 'todos', t.id), {
    done: !t.done
  })
}


const onReorder = async (newList: Todo[]) => {
  if (!user.value) return
  const batch = writeBatch(db)
  newList.forEach((t, idx) => {
    batch.update(doc(db, 'users', user.value!.uid, 'todos', t.id!), {
      order: (idx + 1) * 1000,
    })
  })
  await batch.commit()
}

const shareList = async () => {
  if (!user.value || shareId.value) return
  const docRef = await addDoc(collection(db, 'share'), {
    uid: user.value.uid,
    date: day.value,
    categoryId: activeCategoryId.value || '',
  })
  shareId.value = docRef.id
  const url = shareUrl.value
  try {
    await navigator.clipboard.writeText(url)
    alert('Link copied to clipboard')
  } catch (e) {
    window.prompt('Share this link', url)
  }
}

const unshareList = async () => {
  if (!shareId.value) return
  await deleteDoc(doc(db, 'share', shareId.value))
  shareId.value = null
}
</script>
