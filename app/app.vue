<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans">
    <div class="flex">
      <aside class="w-72 p-4 border-r">
        <h1 class="flex items-center gap-2 text-lg font-bold">
          <span class="material-symbols-outlined text-brand">checklist</span> Todo
        </h1>
        <div class="mt-4 space-y-2">
          <label class="text-sm font-semibold">День</label>
          <input type="date" v-model="day" class="w-full border rounded px-2 py-1" />
        </div>
      </aside>
      <main class="flex-1 p-6">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const day = useState('day', () => new Date().toISOString().slice(0,10))
</script>
