<template>
  <div class="flex items-center gap-2">
    <template v-if="user">
      <img :src="user.photoURL || ''" class="w-6 h-6 rounded-full" />
      <span class="text-sm">{{ user.displayName || 'User' }}</span>
      <button class="ml-auto text-red-600" @click="logout">Sign Out</button>
    </template>
    <button v-else class="bg-brand text-white px-3 py-1 rounded" @click="login">
      Sign In
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
