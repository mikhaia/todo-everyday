<template>
  <div>
    <h3 class="font-bold mt-2 flex items-center gap-1">
      <span class="material-symbols-outlined">label</span>Categories
    </h3>
    <ul class="mt-2 space-y-1">
      <li v-for="c in categories" :key="c.id" class="flex items-center gap-1">
        <span
          class="px-2 py-1 rounded text-sm flex items-center gap-1 cursor-pointer flex-1"
          :class="{ 'ring-2 ring-brand': activeCategoryId === c.id }"
          :style="{ background: c.background, color: textColor(c.background) }"
          @click="toggleFilter(c.id)"
        >
          <span v-if="c.icon" class="material-symbols-outlined">{{ c.icon }}</span>
          {{ c.title }}
        </span>
        <button @click="openModal(c)" class="text-gray-500" aria-label="Edit category">
          <span class="material-symbols-outlined text-sm">edit</span>
        </button>
        <button @click="confirmDelete(c)" class="text-red-500" aria-label="Delete category">
          <span class="material-symbols-outlined text-sm">delete</span>
        </button>
      </li>
    </ul>
    <button
      @click="openModal()"
      class="mt-2 bg-brand text-white px-3 py-1 rounded w-full"
    >
      + Add category
    </button>
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]"
    >
      <div class="bg-white p-4 rounded shadow w-80">
        <h4 class="text-lg font-semibold mb-2">
          {{ editingId ? 'Edit category' : 'New category' }}
        </h4>
        <div class="space-y-2">
          <input
            v-model="newCategory.title"
            placeholder="Title"
            class="border rounded w-full px-2 py-1"
          />
          <div>
            <span class="block text-sm mb-1">Icon</span>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="icon in iconOptions"
                :key="icon"
                type="button"
                @click="newCategory.icon = icon"
                :class="[
                  'p-2 border rounded flex items-center justify-center',
                  newCategory.icon === icon ? 'bg-brand text-white' : 'bg-gray-100'
                ]"
              >
                <span class="material-symbols-outlined">{{ icon }}</span>
              </button>
            </div>
          </div>
          <div>
            <span class="block text-sm mb-1">Background</span>
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="color in colorOptions"
                :key="color"
                type="button"
                @click="newCategory.background = color"
                :style="{ background: color }"
                :class="[
                  'w-8 h-8 rounded',
                  newCategory.background === color ? 'ring-2 ring-offset-2 ring-brand' : ''
                ]"
              ></button>
            </div>
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
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]"
    >
      <div class="bg-white p-4 rounded shadow w-80">
        <h4 class="text-lg font-semibold mb-2">Delete category?</h4>
        <p class="mb-4">This will also delete all tasks in this category.</p>
        <div class="flex justify-end gap-2">
          <button @click="cancelDelete" class="px-3 py-1 bg-gray-200 rounded">Cancel</button>
          <button @click="deleteCategory" class="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onUnmounted, ref, reactive } from 'vue'
import { useFirebaseApp } from 'vuefire'
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore'

interface Category {
  id?: string
  title: string
  icon: string
  background: string
}

const user = useState<{ uid: string } | null>('user', () => null)
const categories = useState<Category[]>('categories', () => [])
const activeCategoryId = useState<string>('activeCategoryId', () => '')

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
const showDeleteModal = ref(false)
const categoryToDelete = ref<Category | null>(null)
const editingId = ref<string | null>(null)
const iconOptions = [
  'home',
  'stadia_controller',
  'work',
  'key',
  'person',
  'person_book',
  'shopping_basket',
  'shopping_cart',
  'movie',
  'exercise'
]

const colorOptions = [
  '#F9FAFB',
  '#87CEFA',
  '#90EE90',
  '#800000',
  '#FFA500',
  '#808080',
  '#F9DF1D',
  '#D0D0D0',
  '#3F51B5',
  '#607D8B',
  '#009688',
  '#A52A2A'
]

const newCategory = reactive({
  title: '',
  icon: iconOptions[0],
  background: colorOptions[0]
})

const openModal = (c?: Category) => {
  if (!user.value) return
  if (c) {
    editingId.value = c.id || null
    newCategory.title = c.title
    newCategory.icon = c.icon
    newCategory.background = c.background
  } else {
    editingId.value = null
    newCategory.title = ''
    newCategory.icon = iconOptions[0]
    newCategory.background = colorOptions[0]
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveCategory = async () => {
  if (!user.value) return
  const title = newCategory.title.trim()
  if (!title) return
  if (editingId.value) {
    await updateDoc(
      doc(db, 'users', user.value.uid, 'categories', editingId.value),
      {
        title,
        icon: newCategory.icon?.trim(),
        background: newCategory.background
      }
    )
  } else {
    await addDoc(collection(db, 'users', user.value.uid, 'categories'), {
      title,
      icon: newCategory.icon?.trim(),
      background: newCategory.background
    })
  }
  newCategory.title = ''
  newCategory.icon = iconOptions[0]
  newCategory.background = colorOptions[0]
  editingId.value = null
  showModal.value = false
}

const confirmDelete = (c: Category) => {
  categoryToDelete.value = c
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  categoryToDelete.value = null
}

const deleteCategory = async () => {
  if (!user.value || !categoryToDelete.value?.id) return
  const id = categoryToDelete.value.id
  await deleteDoc(doc(db, 'users', user.value.uid, 'categories', id))
  const q = query(
    collection(db, 'users', user.value.uid, 'todos'),
    where('categoryId', '==', id)
  )
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  if (activeCategoryId.value === id) activeCategoryId.value = ''
  cancelDelete()
}

const toggleFilter = (id?: string) => {
  if (!id) return
  activeCategoryId.value = activeCategoryId.value === id ? '' : id
}

function textColor(bg: string) {
  const { r, g, b } = toRGB(bg);
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return L > 0.6 ? '#111827' : '#ffffff';
}

function toRGB(color: string) {
  if (!color) return { r: 0, g: 0, b: 0 };
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (m && m.length >= 4) {
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  }
  return { r: 0, g: 0, b: 0 };
}
</script>
