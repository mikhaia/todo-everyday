<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]"
    @click.self="close"
  >
    <div class="bg-white p-4 rounded shadow w-80 text-black">
      <h4 class="text-lg font-semibold mb-2">All tasks background</h4>
      <div class="space-y-2">
        <div>
          <span class="block text-sm mb-1">Background</span>
          <div class="grid grid-cols-7 gap-2">
            <button
              type="button"
              title="Default"
              aria-label="Default background"
              @click="background = null"
              :class="[
                'w-8 h-8 rounded bg-gray-300 flex items-center justify-center text-gray-600',
                !background ? 'ring-2 ring-offset-2 ring-primary' : ''
              ]"
            >
              <span class="material-symbols-outlined text-base">format_color_reset</span>
            </button>
            <button
              v-for="color in backgroundOptions"
              :key="color"
              type="button"
              :aria-label="`Background ${color}`"
              @click="background = color"
              :style="{ background: color }"
              :class="['w-8 h-8 rounded', background === color ? 'ring-2 ring-offset-2 ring-primary' : '']"
            ></button>
          </div>
        </div>
        <div>
          <span class="block mb-1">Image</span>
          <div v-if="image" class="flex items-center gap-2">
            <span class="min-w-0 flex-1 truncate text-sm text-gray-600" :title="fileName">{{ fileName }}</span>
            <button type="button" @click="image = ''" class="btn btn-danger text-sm">Remove image</button>
          </div>
          <input v-else type="file" accept="image/*" @change="onFileChange" class="file-input" />
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button @click="close" class="btn btn-secondary text-sm">Cancel</button>
        <button @click="save" class="btn btn-primary text-sm">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFirebaseApp } from 'vuefire'
import { doc, getFirestore, setDoc } from 'firebase/firestore'
import { deleteObject, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage'
import { backgroundOptions } from '../utils/color'
import type { ListTheme } from '../composables/useTheme'

const user = useState<{ uid: string } | null>('user', () => null)
const defaultTheme = useState<ListTheme>('defaultTheme', () => ({}))
const showModal = useState<boolean>('showListThemeModal', () => false)

const app = useFirebaseApp()
const db = getFirestore(app)
const storage = getStorage(app)

// Edits stay local until Save, so Cancel leaves the saved theme untouched.
const background = ref<string | null>(null)
const image = ref('')
const imageFile = ref<File | null>(null)
const fileName = computed(() => image.value.split('/').pop())

watch(showModal, open => {
  if (!open) return
  background.value = defaultTheme.value.background || null
  image.value = defaultTheme.value.image || ''
  imageFile.value = null
})

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 1024 * 1024) {
    alert('Image must be less than 1MB')
    input.value = ''
    return
  }
  imageFile.value = file
}

const close = () => {
  showModal.value = false
}

const save = async () => {
  const uid = user.value?.uid
  if (!uid) return
  const previous = defaultTheme.value.image || ''
  const file = imageFile.value
  close()
  try {
    let path = image.value
    if (file) {
      // Same folder layout as category images, so the existing Storage rules cover it.
      path = `users/${uid}/categories/all-tasks/${file.name}`
      await uploadBytes(storageRef(storage, path), file)
    }
    await setDoc(doc(db, 'users', uid), {
      defaultTheme: { background: background.value, image: path || null }
    }, { merge: true })
    if (previous && previous !== path) {
      await deleteObject(storageRef(storage, previous)).catch(e => console.error('Error deleting old image', e))
    }
  } catch (e) {
    console.error('Error saving the background', e)
    alert('Could not save the background. Please try again.')
  }
}
</script>
