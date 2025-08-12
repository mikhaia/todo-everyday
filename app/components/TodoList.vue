<template>
  <div class="max-w-3xl">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-1">
      <span class="material-symbols-outlined">checklist</span>ToDo
    </h2>
    <div class="space-y-2">
      <div class="flex gap-2">
        <input v-model="title" @keyup.enter="add" placeholder="New task…" class="border rounded px-3 py-2 flex-1" />
        <button @click="add" class="bg-brand text-white px-4 rounded">Add</button>
      </div>

      <draggable
        v-model="list"
        item-key="id"
        tag="ul"
        class="space-y-2 animate__animated animate__fadeIn"
        @end="persistOrder"
      >
        <template #item="{ element, index }">
          <li class="bg-white border rounded p-2 flex items-center justify-between">
            <label class="flex items-center gap-2 flex-1">
              <input type="checkbox" :checked="element.done" @change="toggle(index)" />
              <span :class="{ 'line-through text-gray-400': element.done }">{{ element.title }}</span>
            </label>
            <button class="text-red-500" @click="deleteTask(index)" aria-label="Remove task">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </li>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useFirebaseApp } from 'vuefire'
import draggable from 'vuedraggable'
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

interface Todo { id?: string; title: string; date: string; done: boolean; order: number }

const day = useState('day', () => new Date().toISOString().slice(0, 10))
const user = useState<{ uid: string } | null>('user', () => null)

const app = useFirebaseApp()
const db = getFirestore(app)

const tasks = ref<Todo[]>([])
const month = computed(() => day.value.slice(0, 7))
let off: (() => void) | null = null

const loadMonth = (m: string) => {
  if (!user.value) return
  const start = format(startOfMonth(new Date(m + '-01')), 'yyyy-MM-dd')
  const end = format(endOfMonth(new Date(m + '-01')), 'yyyy-MM-dd')
  if (off) off()
  const q = query(
    collection(db, 'users', user.value.uid, 'todos'),
    orderBy('date'),
    orderBy('order'),
    where('date', '>=', start),
    where('date', '<=', end)
  )
  off = onSnapshot(q, (snap) => {
    tasks.value = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Todo, 'id'>) }))
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

const list = computed({
  get: () => tasks.value.filter((t) => t.date === day.value),
  set: (val: Todo[]) => {
    const others = tasks.value.filter((t) => t.date !== day.value)
    tasks.value = [...others, ...val]
  }
})

const title = ref('')

const add = async () => {
  const s = title.value.trim()
  if (!s || !user.value) return
  const newOrder = list.value.length
    ? Math.max(...list.value.map((t) => t.order ?? 0)) + 1
    : 0
  await addDoc(collection(db, 'users', user.value.uid, 'todos'), {
    title: s,
    date: day.value,
    done: false,
    order: newOrder
  })
  title.value = ''
}

const deleteTask = async (i: number) => {
  if (!user.value) return
  const t = list.value[i]
  if (t?.id) await deleteDoc(doc(db, 'users', user.value.uid, 'todos', t.id))
  await persistOrder()
}

const toggle = async (i: number) => {
  if (!user.value) return
  const t = list.value[i]
  if (t?.id) await updateDoc(doc(db, 'users', user.value.uid, 'todos', t.id), {
    done: !t.done
  })
}

const persistOrder = async () => {
  if (!user.value) return
  await Promise.all(
    list.value.map((t, idx) => {
      t.order = idx
      if (t.id) {
        return updateDoc(doc(db, 'users', user.value.uid, 'todos', t.id), {
          order: idx
        })
      }
    })
  )
}
</script>
