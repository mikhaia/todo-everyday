<template>
  <TodoList />
</template>

<script setup lang="ts">
const route = useRoute()
const day = useState('day', () => new Date().toISOString().slice(0, 10))

watch(
  () => route.params.date,
  (val) => {
    if (typeof val === 'string') day.value = val
  },
  { immediate: true }
)
</script>
