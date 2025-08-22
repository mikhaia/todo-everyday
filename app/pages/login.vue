<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 text-white bg-[url('assets/img/back.jpg')] bg-cover bg-center">
    <div class="w-full max-w-xl bg-gray-800 rounded-lg flex shadow-[0_0_20px_rgba(0,0,0,1)]">
      <div class="relative hidden md:block w-1/2">
        <img
          src="assets/img/login.jpg"
          alt="Background"
          class="object-cover w-full h-full rounded"
        />
        <span
          class="material-symbols-outlined absolute inset-0 flex items-start justify-start text-white text-6xl m-3"
        >early_on</span>
      </div>
      <div class="flex-1 p-6">
        <h2 class="text-2xl font-bold mb-6 text-center">Sign in</h2>
        <form class="space-y-4" @submit.prevent="loginWithEmail">
          <input v-model="email" type="email" placeholder="Email" class="w-full p-2 rounded bg-gray-700 placeholder-gray-400" />
          <input v-model="password" type="password" placeholder="Password" class="w-full p-2 rounded bg-gray-700 placeholder-gray-400" />
          <button type="submit" class="w-full py-2 bg-blue-500 rounded">Sign in</button>
        </form>
        <div class="mt-4 flex flex-col gap-4 text-black">
          <button class="w-full py-2 bg-gray-50 rounded flex items-center justify-center gap-2" @click="loginGoogle">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-7 h-7" />
            Sign in with Google
          </button>
          <button class="w-full py-2 bg-gray-50 rounded flex items-center justify-center gap-2" @click="loginGithub">
            <img src="https://www.svgrepo.com/download/512317/github-142.svg" alt="Github" class="w-7 h-7" />
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
