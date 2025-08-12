<template>
  <div class="max-w-3xl">
    <h2 class="text-2xl font-bold mb-4">📝 ToDo</h2>
    <div class="space-y-2">
      <div class="flex gap-2">
        <input v-model="text" @keyup.enter="add" placeholder="New task…" class="border rounded px-3 py-2 flex-1" />
        <button @click="add" class="bg-brand text-white px-4 rounded">Add</button>
      </div>

      <ul class="space-y-2 animate__animated animate__fadeIn">
        <li v-for="(t,i) in list" :key="i" class="bg-white border rounded p-2 flex justify-between">
          <span :class="{ 'line-through text-gray-400': t.done }" @click="t.done=!t.done">{{ t.text }}</span>
          <button class="text-red-500" @click="remove(i)">❌</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const text = ref('');
const list = ref<{text:string;done:boolean}[]>([])
const add = () => {
  const s = text.value.trim();
  if(!s) return; 
  list.value=[...list.value,{text:s,done:false}];
  text.value='';
}
const remove = (i:number) => list.value = list.value.filter((_,n)=>n!==i)
</script>
