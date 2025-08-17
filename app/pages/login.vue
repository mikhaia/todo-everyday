<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 text-white">
    <div class="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
      <h2 class="text-2xl font-bold mb-6 text-center">Sign in</h2>
      <form class="space-y-4" @submit.prevent="loginWithEmail">
        <input v-model="email" type="email" placeholder="Email" class="w-full p-2 rounded bg-gray-700 placeholder-gray-400" />
        <input v-model="password" type="password" placeholder="Password" class="w-full p-2 rounded bg-gray-700 placeholder-gray-400" />
        <button type="submit" class="w-full py-2 bg-blue-500 rounded">Sign in</button>
      </form>
      <div class="mt-4 flex flex-col gap-2">
        <button class="w-full py-2 bg-red-600 rounded" @click="loginGoogle">Sign in with Google</button>
        <button class="w-full py-2 bg-gray-700 rounded" @click="loginGithub">Sign in with Github</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFirebaseApp } from 'vuefire'
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth'

const app = useFirebaseApp()
const auth = getAuth(app)
const email = ref('')
const password = ref('')

const loginWithEmail = async () => {
  if (!email.value || !password.value) return
  await signInWithEmailAndPassword(auth, email.value, password.value)
  await navigateTo('/')
}

const loginGoogle = async () => {
  await signInWithPopup(auth, new GoogleAuthProvider())
  await navigateTo('/')
}

const loginGithub = async () => {
  await signInWithPopup(auth, new GithubAuthProvider())
  await navigateTo('/')
}
</script>
