<template>
  <StaticPage title="How to use the API" icon="help">
    <div class="space-y-6">
        <div>
          <span class="block font-semibold mb-1">Your API token</span>
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
          <p v-else class="text-gray-500">
            No token yet. Open <span class="font-semibold">Settings</span> to generate one, then use
            <code class="bg-gray-100 px-1 rounded">&lt;YOUR_TOKEN&gt;</code> in the examples below.
          </p>
        </div>

        <div class="border-t pt-4 space-y-6">
          <p>Send <span class="font-semibold">POST</span> requests with your token in the JSON body.</p>

          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="font-semibold">Create task(s)</span>
              <button @click="copy(createExample)" class="btn btn-secondary p-1" aria-label="Copy example" title="Copy example">
                <span class="material-symbols-outlined text-sm">content_copy</span>
              </button>
            </div>
            <code class="block bg-gray-100 rounded px-2 py-1 mb-1 break-all">POST {{ origin }}/api/tasks</code>
            <pre class="bg-gray-100 rounded p-2 overflow-x-auto whitespace-pre text-xs">{{ createExample }}</pre>
            <p class="mt-1">
              Use <code class="bg-gray-100 px-1 rounded">"tasks": ["A", "B"]</code> for several at once.
              <code class="bg-gray-100 px-1 rounded">date</code> optional (omit → No date);
              <code class="bg-gray-100 px-1 rounded">category</code> optional (omit → No category).
            </p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="font-semibold">Get tasks</span>
              <button @click="copy(getExample)" class="btn btn-secondary p-1" aria-label="Copy example" title="Copy example">
                <span class="material-symbols-outlined text-sm">content_copy</span>
              </button>
            </div>
            <code class="block bg-gray-100 rounded px-2 py-1 mb-1 break-all">POST {{ origin }}/api/tasks/get</code>
            <pre class="bg-gray-100 rounded p-2 overflow-x-auto whitespace-pre text-xs">{{ getExample }}</pre>
            <p class="mt-1">
              <code class="bg-gray-100 px-1 rounded">date</code> optional (omit → today);
              <code class="bg-gray-100 px-1 rounded">category</code> optional (filters by category title).
            </p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="font-semibold">Complete task(s)</span>
              <button @click="copy(completeExample)" class="btn btn-secondary p-1" aria-label="Copy example" title="Copy example">
                <span class="material-symbols-outlined text-sm">content_copy</span>
              </button>
            </div>
            <code class="block bg-gray-100 rounded px-2 py-1 mb-1 break-all">POST {{ origin }}/api/tasks/complete</code>
            <pre class="bg-gray-100 rounded p-2 overflow-x-auto whitespace-pre text-xs">{{ completeExample }}</pre>
            <p class="mt-1">
              Use <code class="bg-gray-100 px-1 rounded">"ids": ["ID_1", "ID_2"]</code> for several tasks at once.
            </p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="font-semibold">Delete task(s)</span>
              <button @click="copy(deleteExample)" class="btn btn-secondary p-1" aria-label="Copy example" title="Copy example">
                <span class="material-symbols-outlined text-sm">content_copy</span>
              </button>
            </div>
            <code class="block bg-gray-100 rounded px-2 py-1 mb-1 break-all">POST {{ origin }}/api/tasks/delete</code>
            <pre class="bg-gray-100 rounded p-2 overflow-x-auto whitespace-pre text-xs">{{ deleteExample }}</pre>
            <p class="mt-1">
              Task IDs are returned by the create and get endpoints. Use <code class="bg-gray-100 px-1 rounded">ids</code> for several tasks at once.
            </p>
          </div>
        </div>
    </div>
  </StaticPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFirebaseApp } from 'vuefire'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const user = useState<{ uid: string } | null>('user', () => null)

const app = useFirebaseApp()
const db = getFirestore(app)

const token = ref('')

const origin = computed(() =>
  typeof window !== 'undefined' ? window.location.origin : 'https://todo-everyday.web.app'
)
const today = new Date().toISOString().slice(0, 10)
const exampleToken = computed(() => token.value || '<YOUR_TOKEN>')

const createExample = computed(() =>
  JSON.stringify(
    { token: exampleToken.value, date: today, category: 'Work', task: 'Task text' },
    null,
    2
  )
)

const getExample = computed(() =>
  JSON.stringify(
    { token: exampleToken.value, date: today, category: 'Work' },
    null,
    2
  )
)

const completeExample = computed(() =>
  JSON.stringify(
    { token: exampleToken.value, id: '<TASK_ID>' },
    null,
    2
  )
)

const deleteExample = computed(() =>
  JSON.stringify(
    { token: exampleToken.value, id: '<TASK_ID>' },
    null,
    2
  )
)

onMounted(async () => {
  if (!user.value) return
  const snap = await getDoc(doc(db, 'users', user.value.uid))
  token.value = snap.exists() ? (snap.data().apiToken as string) || '' : ''
})

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('Copied to clipboard')
  } catch (e) {
    window.prompt('Copy', text)
  }
}

const selectAll = (e: FocusEvent) => (e.target as HTMLInputElement).select()
</script>
