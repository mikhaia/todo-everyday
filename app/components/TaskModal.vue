<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000]"
  >
    <div class="bg-white p-6 rounded shadow max-w-sm w-full text-black">
      <h3 class="text-lg font-bold mb-4">Edit task</h3>
      <input
        v-model="editTitle"
        class="border rounded px-3 py-2 w-full mb-2 shadow-sm"
      />
      <select
        v-model="editCategoryId"
        class="border rounded px-3 py-2 w-full mb-2 shadow-sm"
      >
        <option value="">No category</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">
          {{ c.title }}
        </option>
      </select>
      <input
        type="date"
        v-model="editDate"
        class="border rounded px-3 py-2 w-full mb-4 shadow-sm"
      />
      <p v-if="saveError" class="text-sm text-red-600 mb-4" role="alert">
        {{ saveError }}
      </p>
      <div class="flex justify-end gap-2">
        <button
          @click="closeModal"
          class="btn btn-secondary text-sm disabled:opacity-50"
          :disabled="isSaving"
        >
          Cancel
        </button>
        <button
          @click="saveTask"
          class="btn btn-primary text-sm disabled:opacity-50"
          :disabled="isSaving"
        >
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFirebaseApp } from 'vuefire'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'

interface Todo {
  id?: string
  title: string
  order: number
  date: string | null
  done: boolean
  categoryId: string | null
}

interface Category {
  id: string
  title: string
  icon?: string
  background?: string
  image?: string
}

const user = useState<{ uid: string } | null>('user', () => null)
const categories = useState<Category[]>('categories', () => [])
const taskToEdit = useState<Todo | null>('taskToEdit', () => null)
const showModal = useState<boolean>('showTaskModal', () => false)

const editTitle = ref('')
const editCategoryId = ref('')
const editDate = ref('')
const isSaving = ref(false)
const saveError = ref('')

const app = useFirebaseApp()
const db = getFirestore(app)

watch(showModal, (val) => {
  if (val && taskToEdit.value) {
    editTitle.value = taskToEdit.value.title
    editCategoryId.value = taskToEdit.value.categoryId || ''
    editDate.value = taskToEdit.value.date || ''
    saveError.value = ''
  } else {
    editTitle.value = ''
    editCategoryId.value = ''
    editDate.value = ''
    saveError.value = ''
  }
})

const closeModal = () => {
  if (isSaving.value) return
  showModal.value = false
  taskToEdit.value = null
}

const saveTask = async () => {
  if (isSaving.value) return

  const uid = user.value?.uid
  const taskId = taskToEdit.value?.id
  if (!uid || !taskId) {
    saveError.value = 'Unable to save the task. Please reopen it and try again.'
    return
  }

  const title = editTitle.value.trim()
  const categoryId = editCategoryId.value || null
  const date = editDate.value || null

  isSaving.value = true
  saveError.value = ''
  try {
    await updateDoc(doc(db, 'users', uid, 'todos', taskId), {
      title,
      categoryId,
      date,
      // Moving to another day releases the previous slot, including when the
      // task is later moved back to its original date.
      ...(date !== taskToEdit.value?.date ? { schedule: null } : {}),
    })

    // Only close the editor that initiated this request. This prevents an older
    // save from clearing a task that was opened while the request was pending.
    if (taskToEdit.value?.id === taskId) {
      showModal.value = false
      taskToEdit.value = null
    }
  } catch (error) {
    console.error('Error saving task', error)
    saveError.value = 'Failed to save the task. Please try again.'
  } finally {
    isSaving.value = false
  }
}
</script>
