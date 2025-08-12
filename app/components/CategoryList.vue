<template>
  <div>
    <h3 class="text-lg font-bold mt-4 flex items-center gap-1">
      <span class="material-symbols-outlined">label</span>Categories
    </h3>
    <ul class="mt-2 space-y-1">
      <li v-for="c in categories" :key="c.id">
        <span
          class="px-2 py-1 rounded text-sm flex items-center gap-1 text-white"
          :style="{ background: c.background }"
        >
          <span v-if="c.icon" class="material-symbols-outlined">{{ c.icon }}</span>
          {{ c.title }}
        </span>
      </li>
    </ul>
    <button
      @click="addCategory"
      class="mt-2 bg-brand text-white px-3 py-1 rounded w-full"
    >
      Add category
    </button>
  </div>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { useFirebaseApp } from 'vuefire'
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore'

interface Category {
  id?: string
  title: string
  icon: string
  background: string
}

const user = useState<{ uid: string } | null>('user', () => null)
const categories = useState<Category[]>('categories', () => [])

const app = useFirebaseApp()
const db = getFirestore(app)

let off: (() => void) | null = null

watch(user, (u) => {
  if (off) {
    off()
    off = null
  }
  if (u) {
    const q = collection(db, 'users', u.uid, 'categories')
    off = onSnapshot(q, (snap) => {
      categories.value = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Category, 'id'>)
      }))
    })
  } else {
    categories.value = []
  }
}, { immediate: true })

onUnmounted(() => {
  if (off) off()
})

const addCategory = async () => {
  if (!user.value) return
  const title = prompt('Category name?')?.trim()
  if (!title) return
  const icon = prompt('Icon (material icon)?')?.trim() || ''
  const background =
    prompt('Background color (e.g., #ff0000)?')?.trim() || '#000000'
  await addDoc(collection(db, 'users', user.value.uid, 'categories'), {
    title,
    icon,
    background
  })
}
</script>
