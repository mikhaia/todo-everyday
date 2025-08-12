<template>
  <TodoList />
</template>

<script setup lang="ts">
const day = useState('day', () => new Date().toISOString().slice(0, 10))
// always reset to today on root
day.value = new Date().toISOString().slice(0, 10)
</script>
