<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]"
  >
    <div class="bg-white p-4 rounded shadow w-80 text-black">
      <h4 class="text-lg font-semibold mb-4">Delete task?</h4>
      <div class="flex justify-end gap-2">
        <button @click="cancelDelete" class="px-3 py-1 bg-gray-200 rounded">Cancel</button>
        <button @click="deleteTask" class="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFirebaseApp } from 'vuefire'
import { getFirestore, doc, deleteDoc } from 'firebase/firestore'

interface Todo {
  id?: string
  title: string
  order: number
  date: string | null
  done: boolean
  categoryId: string | null
}

const user = useState<{ uid: string } | null>('user', () => null)
const taskToDelete = useState<Todo | null>('taskToDelete', () => null)
const showModal = useState<boolean>('showDeleteTaskModal', () => false)

const app = useFirebaseApp()
const db = getFirestore(app)

const cancelDelete = () => {
  showModal.value = false
  taskToDelete.value = null
}

const deleteTask = async () => {
  if (!user.value || !taskToDelete.value?.id) return
  await deleteDoc(doc(db, 'users', user.value.uid, 'todos', taskToDelete.value.id))
  cancelDelete()
}
</script>
