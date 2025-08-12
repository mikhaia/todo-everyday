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
      @click="openModal"
      class="mt-2 bg-brand text-white px-3 py-1 rounded w-full"
    >
      Add category
    </button>
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white p-4 rounded shadow w-80">
        <h4 class="text-lg font-semibold mb-2">New category</h4>
        <div class="space-y-2">
          <input
            v-model="newCategory.title"
            placeholder="Title"
            class="border rounded w-full px-2 py-1"
          />
          <input
            v-model="newCategory.icon"
            placeholder="Icon"
            class="border rounded w-full px-2 py-1"
          />
          <div>
            <span class="block text-sm mb-1">Background</span>
            <input
              v-model="newCategory.background"
              type="color"
              class="w-full h-10 border rounded"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button @click="closeModal" class="px-3 py-1 bg-gray-200 rounded">
            Cancel
          </button>
          <button @click="saveCategory" class="px-3 py-1 bg-brand text-white rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onUnmounted, ref, reactive } from 'vue'
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

const showModal = ref(false)
const newCategory = reactive({
  title: '',
  icon: '',
  background: '#000000'
})

const openModal = () => {
  if (!user.value) return
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveCategory = async () => {
  if (!user.value) return
  const title = newCategory.title.trim()
  if (!title) return
  await addDoc(collection(db, 'users', user.value.uid, 'categories'), {
    title,
    icon: newCategory.icon.trim(),
    background: newCategory.background
  })
  newCategory.title = ''
  newCategory.icon = ''
  newCategory.background = '#000000'
  showModal.value = false
}
</script>
