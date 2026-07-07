<template>
  <StaticPage title="About Todo Everyday" icon="info">
    <div class="space-y-6">
      <p>
        <span class="font-semibold">Todo Everyday</span> is a simple task manager for
        organizing what you need to get done — day by day and by your own categories.
      </p>

      <div>
        <h2 class="font-semibold text-base mb-2">Features</h2>
        <ul class="list-disc pl-5 space-y-1">
          <li>Sign in with your Google account.</li>
          <li>Tasks sync in real time across your devices.</li>
          <li>Organize tasks by day, and by customizable categories with their own colors and icons.</li>
          <li>Reorder tasks with drag &amp; drop.</li>
          <li>Import and export lists as Markdown checklists.</li>
          <li>Share a read-only view of any day or category via a public link.</li>
          <li>Create, read, complete, and delete tasks programmatically through the API.</li>
        </ul>
      </div>

      <div>
        <h2 class="font-semibold text-base mb-2">Using the API</h2>
        <p>
          Generate a token in <span class="font-semibold">Settings</span>, then see the
          <NuxtLink to="/help" class="text-blue-600 hover:underline">API guide</NuxtLink>
          for request examples.
        </p>
      </div>

      <div class="border-t pt-4 text-gray-500">
        <p>Built with Nuxt and Firebase.</p>
      </div>
    </div>
  </StaticPage>
</template>

<script setup lang="ts">
// Static informational page — see app/utils/staticRoutes.ts (public + standalone).
</script>
