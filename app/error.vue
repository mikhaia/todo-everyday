<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center text-gray-700">
    <h1 class="text-8xl font-extrabold text-gray-300">404</h1>
    <p class="mt-4 text-2xl" v-if="error.statusCode === 404">Shared list not found</p>
    <p class="mt-4 text-2xl" v-else>{{ error.message }}</p>
    <button class="mt-6 px-4 py-2 bg-blue-600 text-white rounded" @click="handleError">Go back home</button>
  </div>
</template>

<script setup lang="ts">
const error = useError()
const handleError = () => clearError({ redirect: '/' })
</script>
