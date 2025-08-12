<template>
  <div class="max-w-3xl">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-1">
      <span
        class="material-symbols-outlined"
        v-if="activeCategory?.icon"
        >{{ activeCategory.icon }}</span
      >
      <span v-else class="material-symbols-outlined">checklist</span>
      {{ activeCategory?.title || 'ToDo' }}
    </h2>
    <div class="space-y-2">
      <div class="flex gap-2">
        <input
          v-model="title"
          @keyup.enter="add"
          placeholder="New task…"
          class="border rounded px-3 py-2 flex-1"
        />
        <select v-model="categoryId" class="border rounded px-2">
          <option value="">No category</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.title }}
          </option>
        </select>
        <button @click="add" class="bg-brand text-white px-4 rounded">Add</button>
      </div>

      <ul class="space-y-2 animate__animated animate__fadeIn">
        <li
          v-for="(t,i) in list"
          :key="t.id"
          class="bg-white border rounded p-2 flex items-center gap-2"
        >
          <label class="flex items-center gap-2 flex-1">
            <input type="checkbox" :checked="t.done" @change="toggle(i)" />
            <span :class="{ 'line-through text-gray-400': t.done }">{{ t.title }}</span>
          </label>
          <span
            v-if="categoryMap[t.categoryId || '']"
            class="text-xs px-2 py-1 rounded text-white flex items-center gap-1"
            :style="{ background: categoryMap[t.categoryId || '']?.background }"
          >
            <span
              v-if="categoryMap[t.categoryId || '']?.icon"
              class="material-symbols-outlined"
            >
              {{ categoryMap[t.categoryId || '']?.icon }}
            </span>
            {{ categoryMap[t.categoryId || '']?.title }}
          </span>
          <button class="text-red-500" @click="deleteTask(i)" aria-label="Remove task">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </li>
      </ul>
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
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface Todo {
  id?: string
  title: string
  date: string
  done: boolean
  categoryId: string | null
}

interface Category {
  id: string
  title: string
  icon: string
  background: string
}

const day = useState('day', () => new Date().toISOString().slice(0, 10))
const user = useState<{ uid: string } | null>('user', () => null)
const categories = useState<Category[]>('categories', () => [])
const activeCategoryId = useState<string>('activeCategoryId', () => '')

const activeCategory = computed(() =>
  categories.value.find((c) => c.id === activeCategoryId.value)
)

const app = useFirebaseApp()
const db = getFirestore(app)

const tasks = useState<Todo[]>('tasks', () => [])
const month = computed(() => day.value.slice(0, 7))
let off: (() => void) | null = null

const categoryId = ref('')
const categoryMap = computed<Record<string, Category>>(() => {
  const map: Record<string, Category> = {}
  for (const c of categories.value) {
    if (c.id) map[c.id] = c
  }
  return map
})

const loadMonth = (m: string) => {
  if (!user.value) return
  const start = format(startOfMonth(new Date(m + '-01')), 'yyyy-MM-dd')
  const end = format(endOfMonth(new Date(m + '-01')), 'yyyy-MM-dd')
  if (off) off()
  const q = query(
    collection(db, 'users', user.value.uid, 'todos'),
    orderBy('date'),
    where('date', '>=', start),
    where('date', '<=', end)
  )
  off = onSnapshot(q, (snap) => {
    tasks.value = snap.docs.map((d) => {
      const data = d.data() as Omit<Todo, 'id'>
      return {
        id: d.id,
        ...data,
        categoryId: data.categoryId ?? null
      }
    })
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

const add = async () => {
  const s = title.value.trim()
  if (!s || !user.value) return
  await addDoc(collection(db, 'users', user.value.uid, 'todos'), {
    title: s,
    date: day.value,
    done: false,
    categoryId: categoryId.value || null
  })
  title.value = ''
  categoryId.value = ''
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
</script>
