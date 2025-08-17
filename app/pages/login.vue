<template>
  <div class="min-h-screen flex bg-gray-900 text-white">
    <div class="relative hidden md:flex w-1/2 items-center justify-center">
      <img
        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=60"
        alt="Background"
        class="object-cover w-full h-full"
      />
      <span
        class="material-symbols-outlined absolute text-white text-9xl"
      >early_on</span>
    </div>
    <div class="flex flex-1 items-center justify-center">
      <div class="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8 animate-pulse-glow">
      <h2 class="text-2xl font-bold mb-6 text-center">Sign in</h2>
      <form class="space-y-4" @submit.prevent="loginWithEmail">
        <input v-model="email" type="email" placeholder="Email" class="w-full p-2 rounded bg-gray-700 placeholder-gray-400" />
        <input v-model="password" type="password" placeholder="Password" class="w-full p-2 rounded bg-gray-700 placeholder-gray-400" />
        <button type="submit" class="w-full py-2 bg-blue-500 rounded">Sign in</button>
      </form>
      <div class="mt-4 flex flex-col gap-2">
        <button class="w-full py-2 bg-red-600 rounded flex items-center justify-center gap-2" @click="loginGoogle">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-5 h-5" />
          Sign in with Google
        </button>
        <button class="w-full py-2 bg-gray-700 rounded flex items-center justify-center gap-2" @click="loginGithub">
          <img src="https://www.svgrepo.com/show/475661/github-color.svg" alt="Github" class="w-5 h-5" />
          Sign in with Github
        </button>
      </div>
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
