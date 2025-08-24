<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]"
  >
    <div class="bg-white p-4 rounded shadow w-80 text-black">
      <h4 class="text-lg font-semibold mb-2">Delete category?</h4>
      <p class="mb-4">This will also delete all tasks in this category.</p>
      <div class="flex justify-end gap-2">
        <button @click="cancelDelete" class="btn btn-secondary text-sm">Cancel</button>
        <button @click="deleteCategory" class="btn btn-danger text-sm">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFirebaseApp } from 'vuefire'
import {
  getFirestore,
  collection,
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
  image?: string
}

const user = useState<{ uid: string } | null>('user', () => null)
const activeCategoryId = useState<string>('activeCategoryId', () => '')
const categoryToDelete = useState<Category | null>('categoryToDelete', () => null)
const showModal = useState<boolean>('showDeleteCategoryModal', () => false)

const app = useFirebaseApp()
const db = getFirestore(app)

const cancelDelete = () => {
  showModal.value = false
  categoryToDelete.value = null
}

const deleteCategory = async () => {
  if (!user.value || !categoryToDelete.value?.id) return
  const id = categoryToDelete.value.id
  showModal.value = false
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
</script>
