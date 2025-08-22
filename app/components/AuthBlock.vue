<template>
  <div v-if="user" class="flex items-center gap-2 mt-4 bg-gray-50 rounded p-2 text-black">
    <img :src="user.photoURL || ''" class="w-6 h-6 rounded-full" />
    <span class="text-sm">{{ user.displayName || 'User' }}</span>
    <button class="ml-auto flex items-center" @click="logout">
      <span class="material-symbols-outlined">exit_to_app</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useFirebaseApp } from 'vuefire'
import { getAuth, signOut } from 'firebase/auth'

const router = useRouter()
const app = useFirebaseApp()
const auth = getAuth(app)

const user = useState<{uid:string;displayName:string|null;photoURL:string|null}|null>('user', () => null)

const logout = async () => {
  await signOut(auth)
  await router.push('/login')
}
</script>
