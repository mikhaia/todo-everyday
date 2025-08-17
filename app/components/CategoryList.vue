<template>
  <div>
    <h3 class="mt-2 flex items-center gap-1">
      <span class="material-symbols-outlined">label</span>Categories
    </h3>
    <ul class="mt-2 space-y-1">
      <li v-for="c in categories" :key="c.id" class="flex items-center gap-1">
        <span class="material-symbols-outlined" :class="{'invisible': activeCategoryId !== c.id}">check</span>
        <span
          class="px-2 py-1 rounded text-sm flex items-center gap-1 cursor-pointer flex-1"
          :style="{ background: c.background, color: textColor(c.background) }"
          @click="toggleFilter(c.id)"
        >
          <span v-if="c.icon" class="material-symbols-outlined">{{ c.icon }}</span>
          {{ c.title }}
        </span>
        <button @click="openModal(c)" class="bg-gray-50 rounded text-black" aria-label="Edit category" title="Edit category">
          <span class="material-symbols-outlined text-sm p-1.5 border rounded">edit</span>
        </button>
        <button @click="confirmDelete(c)" class="bg-red-500 rounded text-white" aria-label="Delete category" title="Delete category">
          <span class="material-symbols-outlined text-sm p-1.5 border rounded">delete</span>
        </button>
      </li>
    </ul>
    <button
      @click="openModal()"
      class="mt-2 bg-primary text-white p-2 rounded w-full shadow-[0_0_2px_white]"
    >
      + Add category
    </button>
  </div>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { useFirebaseApp } from 'vuefire'
import {
  getFirestore,
  collection,
  onSnapshot
} from 'firebase/firestore'
import { textColor } from '../utils/color'

interface Category {
  id?: string
  title: string
  icon: string
  background: string
  image?: string
}

const user = useState<{ uid: string } | null>('user', () => null)
const categories = useState<Category[]>('categories', () => [])
const activeCategoryId = useState<string>('activeCategoryId', () => '')
const categoryToEdit = useState<Category | null>('categoryToEdit', () => null)
const showCategoryModal = useState<boolean>('showCategoryModal', () => false)

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

const categoryToDelete = useState<Category | null>('categoryToDelete', () => null)
const showDeleteCategoryModal = useState<boolean>('showDeleteCategoryModal', () => false)

const openModal = (c?: Category) => {
  if (!user.value) return
  categoryToEdit.value = c ? { ...c } : null
  showCategoryModal.value = true
}

const confirmDelete = (c: Category) => {
  categoryToDelete.value = c
  showDeleteCategoryModal.value = true
}

const toggleFilter = (id?: string) => {
  if (!id) return
  activeCategoryId.value = activeCategoryId.value === id ? '' : id
}
</script>
