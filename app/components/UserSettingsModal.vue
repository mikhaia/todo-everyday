<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]"
  >
    <div class="bg-white p-4 rounded shadow w-96 max-w-[95vw] max-h-[85vh] overflow-y-auto text-black">
      <h4 class="text-lg font-semibold mb-2">User settings</h4>
      <div class="space-y-2">
        <span class="block text-sm mb-1">API token</span>
        <div v-if="token" class="flex items-center gap-2">
          <input
            readonly
            :value="token"
            class="shadow-sm border rounded w-full px-2 py-1 text-xs font-mono"
            @focus="selectAll"
          />
          <button @click="copy(token)" class="btn btn-secondary p-1" aria-label="Copy token" title="Copy token">
            <span class="material-symbols-outlined text-sm">content_copy</span>
          </button>
        </div>
        <p v-else class="text-sm text-gray-500">
          No token yet. Generate one to use the external task API.
        </p>
        <button
          @click="generate"
          class="btn btn-primary text-sm w-full"
          :disabled="saving"
        >
          {{ token ? 'Regenerate token' : 'Generate token' }}
        </button>
        <p class="text-xs text-gray-500">
          Required for external API requests. Regenerating invalidates the previous token.
        </p>
      </div>

      <div class="border-t mt-4 pt-2">
        <NuxtLink
          to="/help"
          class="flex items-center gap-1 text-sm font-semibold select-none hover:underline"
          @click="closeModal"
        >
          <span class="material-symbols-outlined text-base">help</span>
          How to use the API
        </NuxtLink>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button @click="closeModal" class="btn btn-secondary text-sm">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFirebaseApp } from 'vuefire'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

const user = useState<{ uid: string } | null>('user', () => null)
const showModal = useState<boolean>('showSettingsModal', () => false)

const app = useFirebaseApp()
const db = getFirestore(app)

const token = ref('')
const saving = ref(false)

watch(showModal, async (val) => {
  if (!val || !user.value) return
  const snap = await getDoc(doc(db, 'users', user.value.uid))
  token.value = snap.exists() ? (snap.data().apiToken as string) || '' : ''
})

const generateToken = () => {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

const generate = async () => {
  if (!user.value || saving.value) return
  if (token.value && !confirm('Regenerate token? The current token will stop working.')) return
  saving.value = true
  const newToken = generateToken()
  await setDoc(doc(db, 'users', user.value.uid), { apiToken: newToken }, { merge: true })
  token.value = newToken
  saving.value = false
}

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('Copied to clipboard')
  } catch (e) {
    window.prompt('Copy', text)
  }
}

const selectAll = (e: FocusEvent) => (e.target as HTMLInputElement).select()

const closeModal = () => {
  showModal.value = false
}
</script>
