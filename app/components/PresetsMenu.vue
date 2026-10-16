<template>
  <div ref="root" class="relative flex text-sm font-normal">
    <button
      class="material-symbols-outlined rounded p-1 text-black shadow"
      :class="open ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white'"
      aria-label="Presets"
      title="Presets"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >playlist_add</button>

    <div v-if="open" class="absolute right-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white py-1 text-black shadow-lg">
      <p class="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Add to {{ day }}</p>
      <p v-if="error" class="px-3 py-2 text-red-700">{{ error }}</p>
      <p v-else-if="!loaded" class="px-3 py-2 text-gray-500">Loading…</p>
      <p v-else-if="!presets.length" class="px-3 py-2 text-gray-500">No presets yet.</p>
      <ul v-else class="max-h-72 overflow-y-auto">
        <li v-for="preset in presets" :key="preset.id">
          <button class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus-visible:bg-gray-100" @click="apply(preset)">
            <span class="min-w-0 flex-1 truncate">{{ preset.title }}</span>
            <span class="shrink-0 text-xs text-gray-500">{{ countLabel(preset.tasks.length) }}</span>
          </button>
        </li>
      </ul>
      <NuxtLink to="/presets" class="mt-1 flex items-center gap-2 border-t px-3 py-2 text-blue-700 hover:bg-gray-100" @click="open = false">
        <span class="material-symbols-outlined text-base">edit</span> Edit presets
      </NuxtLink>
    </div>

    <p v-if="message && !open" aria-hidden="true" class="absolute right-0 top-full z-30 mt-2 w-64 rounded bg-gray-800 px-3 py-2 text-xs text-white shadow-lg">{{ message }}</p>
    <span class="sr-only" role="status" aria-live="polite">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { usePresets } from '../composables/usePresets'
import { presetTodos, type Preset } from '../utils/presets'

const user = useState<{ uid: string } | null>('user', () => null)
const day = useState('day', () => new Date().toISOString().slice(0, 10))
const tasks = useState<{ title: string, date: string | null, categoryId: string | null, order?: number }[]>('tasks', () => [])
const categories = useState<{ id: string }[]>('categories', () => [])
const activeCategoryId = useState<string>('activeCategoryId', () => '')
const { presets, loaded, error, db } = usePresets()

const open = ref(false)
const root = ref<HTMLElement>()
onClickOutside(root, () => { open.value = false })
onKeyStroke('Escape', () => { open.value = false })

const message = ref('')
let messageTimer: ReturnType<typeof setTimeout> | undefined
function notify(text: string) {
  message.value = text
  clearTimeout(messageTimer)
  messageTimer = setTimeout(() => { message.value = '' }, 4000)
}
onBeforeUnmount(() => clearTimeout(messageTimer))
const countLabel = (count: number) => `${count} ${count === 1 ? 'task' : 'tasks'}`

function apply(preset: Preset) {
  open.value = false
  const uid = user.value?.uid
  if (!uid) return
  const date = day.value
  const { todos, skipped } = presetTodos(preset, tasks.value.filter(task => task.date === date), categories.value.map(c => c.id))
  if (!todos.length) {
    notify(`Everything from "${preset.title}" is already in ${date}.`)
    return
  }
  const batch = writeBatch(db)
  for (const todo of todos) {
    batch.set(doc(collection(db, 'users', uid, 'todos')), {
      title: todo.title,
      order: todo.order,
      date,
      done: false,
      categoryId: todo.categoryId,
      createdAt: serverTimestamp(),
    })
  }
  // Not awaited: Firestore shows the new tasks immediately, the commit only confirms them.
  batch.commit().catch(() => notify(`Could not add tasks from "${preset.title}". Please try again.`))
  const hidden = activeCategoryId.value ? todos.filter(todo => todo.categoryId !== activeCategoryId.value).length : 0
  notify([
    `Added ${countLabel(todos.length)} from "${preset.title}".`,
    skipped ? `${skipped} already in this day.` : '',
    hidden ? `${hidden} hidden by the category filter.` : '',
  ].filter(Boolean).join(' '))
}
</script>
