<template>
  <div class="flex items-center gap-2 mt-4 bg-gray-50 rounded p-2 text-black">
    <template v-if="user">
      <img :src="user.photoURL || ''" class="w-6 h-6 rounded-full" />
      <span class="text-sm">{{ user.displayName || 'User' }}</span>
      <button class="ml-auto flex items-center" @click="logout">
        <span class="material-symbols-outlined">exit_to_app</span>
      </button>
    </template>
    <button v-else class="px-3 py-1 rounded flex items-center w-full justify-center" @click="login">
      <span class="material-symbols-outlined">account_circle</span>
      <span class="ml-2">Sign In</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useFirebaseApp } from 'vuefire'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

const app = useFirebaseApp()
const auth = getAuth(app)
const google = new GoogleAuthProvider()

const user = useState<{uid:string;displayName:string|null;photoURL:string|null}|null>('user', () => null)

onMounted(() => {
  onAuthStateChanged(auth, (u) => {
    user.value = u ? { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL } : null
  })
})

const login = async () => { await signInWithPopup(auth, google) }
const logout = async () => { await signOut(auth) }
</script>
