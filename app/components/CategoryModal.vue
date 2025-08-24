<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]"
  >
    <div class="bg-white p-4 rounded shadow w-80 text-black">
      <h4 class="text-lg font-semibold mb-2">
        {{ editingId ? 'Edit category' : 'New category' }}
      </h4>
      <div class="space-y-2">
        <input
          v-model="newCategory.title"
          placeholder="Title"
          class="shadow-sm border rounded w-full px-2 py-1"
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
                newCategory.icon === icon ? 'bg-primary text-white' : 'bg-gray-100'
              ]"
            >
              <span class="material-symbols-outlined">{{ icon }}</span>
            </button>
          </div>
        </div>
        <div>
          <span class="block text-sm mb-1">Background</span>
          <div class="grid grid-cols-7 gap-2">
            <button
              v-for="color in colorOptions"
              :key="color"
              type="button"
              @click="newCategory.background = color"
              :style="{ background: color }"
              :class="[
                'w-8 h-8 rounded',
                newCategory.background === color ? 'ring-2 ring-offset-2 ring-primary' : ''
              ]"
            ></button>
          </div>
        </div>
        <div>
          <span class="block mb-1">Image</span>
          <div v-if="newCategory.image" class="flex items-center gap-2">
            <button type="button" @click="removeImage" class="btn btn-danger text-sm ">
              Remove image
            </button>
          </div>
          <input v-else type="file" accept="image/*" @change="onFileChange" class="file-input" />
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button @click="closeModal" class="btn btn-secondary text-sm">
          Cancel
        </button>
        <button @click="saveCategory" class="btn btn-primary text-sm">
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useFirebaseApp } from 'vuefire'
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteField
} from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, deleteObject } from 'firebase/storage'

interface Category {
  id?: string
  title: string
  icon: string
  background: string
  image?: string
}

const user = useState<{ uid: string } | null>('user', () => null)
const categoryToEdit = useState<Category | null>('categoryToEdit', () => null)
const showModal = useState<boolean>('showCategoryModal', () => false)

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
  '#A52A2A',
  '#333333'
]

const newCategory = reactive({
  title: '',
  icon: iconOptions[0],
  background: colorOptions[0],
  image: ''
})

const editingId = ref<string | null>(null)
const imageFile = ref<File | null>(null)

const app = useFirebaseApp()
const db = getFirestore(app)
const storage = getStorage(app)

watch(showModal, (val) => {
  if (val) {
    if (categoryToEdit.value) {
      editingId.value = categoryToEdit.value.id || null
      newCategory.title = categoryToEdit.value.title
      newCategory.icon = categoryToEdit.value.icon
      newCategory.background = categoryToEdit.value.background
      newCategory.image = categoryToEdit.value.image || ''
    } else {
      editingId.value = null
      newCategory.title = ''
      newCategory.icon = iconOptions[0]
      newCategory.background = colorOptions[0]
      newCategory.image = ''
    }
    imageFile.value = null
  }
})

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    if (file.size > 1024 * 1024) {
      alert('Image must be less than 1MB')
      ;(e.target as HTMLInputElement).value = ''
      return
    }
    imageFile.value = file
  }
}

const removeImage = async () => {
  if (!user.value || !editingId.value || !newCategory.image) return
  try {
    await deleteObject(storageRef(storage, newCategory.image))
  } catch (e) {
    console.error('Error deleting image from storage', e)
  }
  await updateDoc(doc(db, 'users', user.value.uid, 'categories', editingId.value), {
    image: deleteField()
  })
  newCategory.image = ''
}

const closeModal = () => {
  showModal.value = false
  categoryToEdit.value = null
  imageFile.value = null
}

const saveCategory = async () => {
  if (!user.value) return
  const title = newCategory.title.trim()
  if (!title) return
  showModal.value = false
  if (editingId.value) {
    let imagePath = newCategory.image || ''
    if (imageFile.value) {
      const path = `users/${user.value.uid}/categories/${editingId.value}/${imageFile.value.name}`
      const sRef = storageRef(storage, path)
      await uploadBytes(sRef, imageFile.value)
      imagePath = path
    }
    await updateDoc(
      doc(db, 'users', user.value.uid, 'categories', editingId.value),
      {
        title,
        icon: newCategory.icon?.trim(),
        background: newCategory.background,
        image: imagePath
      }
    )
  } else {
    const docRef = await addDoc(collection(db, 'users', user.value.uid, 'categories'), {
      title,
      icon: newCategory.icon?.trim(),
      background: newCategory.background
    })
    if (imageFile.value) {
      const path = `users/${user.value.uid}/categories/${docRef.id}/${imageFile.value.name}`
      const sRef = storageRef(storage, path)
      await uploadBytes(sRef, imageFile.value)
      await updateDoc(docRef, { image: path })
    }
  }
  newCategory.title = ''
  newCategory.icon = iconOptions[0]
  newCategory.background = colorOptions[0]
  newCategory.image = ''
  imageFile.value = null
  editingId.value = null
  categoryToEdit.value = null
}
</script>
