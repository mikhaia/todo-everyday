<template>
  <div class="max-w-3xl text-black">
    <section class="rounded-xl border border-white/60 bg-white/75 p-3 shadow-lg backdrop-blur-md sm:p-4" aria-labelledby="presets-title">
      <div class="mb-4 ml-14 flex flex-wrap items-center gap-2 md:ml-0">
        <NuxtLink :to="`/date/${day}`" class="material-symbols-outlined rounded bg-white p-1 shadow" aria-label="Back to day view" title="Back to day view">arrow_back</NuxtLink>
        <h2 id="presets-title" class="flex items-center gap-2 text-xl font-bold">
          <span class="material-symbols-outlined">playlist_add</span> Presets
        </h2>
        <button class="btn btn-primary btn-sm ml-auto" :disabled="editingId === NEW" @click="edit(NEW)">+ New preset</button>
      </div>
      <p v-if="error || loadError" role="alert" class="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{{ error || loadError }}</p>

      <div v-if="editingId === NEW" class="mb-3 rounded-lg border-2 border-blue-200 bg-white p-3 shadow-sm">
        <PresetEditor @save="save(null, $event)" @cancel="editingId = null" />
      </div>

      <p v-if="!loaded" class="text-sm text-gray-500">Loading…</p>
      <p v-else-if="!presets.length && editingId !== NEW" class="rounded-lg bg-white/80 p-3 text-sm text-gray-500">
        No presets yet. Create one for a routine you repeat, for example "Morning" or "Weekly review".
      </p>

      <ul class="space-y-3">
        <li v-for="preset in presets" :key="preset.id" class="rounded-lg border bg-white p-3 shadow-sm" :class="{ 'border-2 border-blue-200': editingId === preset.id }">
          <PresetEditor v-if="editingId === preset.id" :preset="preset" @save="save(preset.id!, $event)" @cancel="editingId = null" />
          <template v-else>
            <div class="flex items-center gap-1">
              <h3 class="min-w-0 flex-1 truncate font-semibold">{{ preset.title }}</h3>
              <span class="mr-1 shrink-0 text-xs text-gray-500">{{ preset.tasks.length }} {{ preset.tasks.length === 1 ? 'task' : 'tasks' }}</span>
              <button class="btn btn-secondary p-0" :aria-label="`Edit preset ${preset.title}`" title="Edit preset" @click="edit(preset.id!)">
                <span class="material-symbols-outlined p-1.5 text-sm">edit</span>
              </button>
              <button class="btn btn-danger p-0" :aria-label="`Delete preset ${preset.title}`" title="Delete preset" @click="remove(preset)">
                <span class="material-symbols-outlined p-1.5 text-sm">delete</span>
              </button>
            </div>
            <ul class="mt-2 flex flex-wrap gap-1.5">
              <li
                v-for="(task, index) in preset.tasks" :key="index"
                class="flex max-w-full items-center gap-1 rounded px-2 py-0.5 text-sm shadow-inner"
                :style="chipStyle(task.categoryId)"
              >
                <span v-if="task.categoryId && categoryMap[task.categoryId]?.icon" class="material-symbols-outlined text-base">{{ categoryMap[task.categoryId]?.icon }}</span>
                <span class="truncate">{{ task.title }}</span>
              </li>
            </ul>
          </template>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { presetError, usePresets } from '../composables/usePresets'
import { textColor } from '../utils/color'
import { cleanPresetTasks, type Preset, type PresetTask } from '../utils/presets'

useHead({ title: 'Presets - Todo Everyday' })

const NEW = 'new'
const day = useState('day', () => new Date().toISOString().slice(0, 10))
const user = useState<{ uid: string } | null>('user', () => null)
const categories = useState<{ id: string, icon?: string, background: string }[]>('categories', () => [])
const categoryMap = computed(() => Object.fromEntries(categories.value.map(c => [c.id, c])))
const chipStyle = (id: string | null) => {
  const background = id ? categoryMap.value[id]?.background : undefined
  return background ? { background, color: textColor(background) } : { background: '#f3f4f6' }
}

const { presets, loaded, error: loadError, db } = usePresets()
const editingId = ref<string | null>(null)
const error = ref('')

function edit(id: string) {
  editingId.value = id
  error.value = ''
}

// Writes are not awaited: Firestore shows them in the list right away and the
// server only confirms them, so the page never waits on the network.
function save(id: string | null, value: { title: string, tasks: PresetTask[] }) {
  const uid = user.value?.uid
  if (!uid) return
  const data = { title: value.title.trim(), tasks: cleanPresetTasks(value.tasks) }
  const write = id
    ? updateDoc(doc(db, 'users', uid, 'presets', id), data)
    : addDoc(collection(db, 'users', uid, 'presets'), { ...data, createdAt: serverTimestamp() })
  editingId.value = null
  error.value = ''
  write.catch(cause => { error.value = presetError(cause, `Could not save "${data.title}".`) })
}

function remove(preset: Preset) {
  const uid = user.value?.uid
  if (!uid || !preset.id || !confirm(`Delete preset "${preset.title}"? Tasks already added to days stay.`)) return
  if (editingId.value === preset.id) editingId.value = null
  deleteDoc(doc(db, 'users', uid, 'presets', preset.id))
    .catch(cause => { error.value = presetError(cause, `Could not delete "${preset.title}".`) })
}
</script>
