<template>
  <div class="min-h-screen bg-gray-100 text-black py-8 px-4">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-2 mb-6">
        <NuxtLink :to="backTo" class="btn btn-secondary p-1 flex items-center" aria-label="Back" title="Back">
          <span class="material-symbols-outlined">arrow_back</span>
        </NuxtLink>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <span v-if="icon" class="material-symbols-outlined">{{ icon }}</span>
          {{ title }}
        </h1>
      </div>
      <div class="bg-white rounded shadow p-4 text-sm text-gray-700">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    icon?: string
    backTo?: string
  }>(),
  { backTo: '/' }
)
</script>
