<template>
  <div class="max-w-3xl">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-1">
      <span class="material-symbols-outlined">checklist</span>ToDo
    </h2>
    <div class="space-y-2">
      <div class="flex gap-2">
        <input v-model="text" @keyup.enter="add" placeholder="New task…" class="border rounded px-3 py-2 flex-1" />
        <button @click="add" class="bg-brand text-white px-4 rounded">Add</button>
      </div>

      <ul class="space-y-2 animate__animated animate__fadeIn">
        <li v-for="(t,i) in list" :key="i" class="bg-white border rounded p-2 flex justify-between">
          <span :class="{ 'line-through text-gray-400': t.done }" @click="toggle(i)">{{ t.text }}</span>
          <button class="text-red-500" @click="remove(i)" aria-label="Remove task">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'

interface Todo { text: string; done: boolean }

const day = useState('day', () => new Date().toISOString().slice(0, 10))

const todos = useStorage<Record<string, Todo[]>>('todos', {})

const list = computed({
  get: () => todos.value[day.value] || [],
  set: (val: Todo[]) => {
    todos.value[day.value] = val
  }
})

const text = ref('')

const add = () => {
  const s = text.value.trim()
  if (!s) return
  list.value = [...list.value, { text: s, done: false }]
  text.value = ''
}

const remove = (i: number) => {
  list.value = list.value.filter((_, n) => n !== i)
}

const toggle = (i: number) => {
  const updated = [...list.value]
  updated[i].done = !updated[i].done
  list.value = updated
}
</script>
