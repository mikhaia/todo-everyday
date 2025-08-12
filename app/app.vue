<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans">
    <div class="flex min-h-screen">
      <aside class="w-72 p-4 border-r flex flex-col justify-between">
        <h1 class="flex items-center gap-2 text-lg font-bold">
          <span class="material-symbols-outlined text-brand">checklist</span> Todo
        </h1>
        <div class="mt-4 space-y-2 h-[300px]">
          <DatePicker
            class="inline-picker"
            v-model="day"
            type="date"
            format="YYYY-MM-DD"
            value-type="format"
            :open="true"
            :editable="false"
            :clearable="false"
            :append-to-body="false"
            title-format="YYYY-MM-DD"
            @change="onDateSelect"
          />
        </div>
        <AuthBlock />
      </aside>
      <main class="flex-1 p-6">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import DatePicker from 'vue-datepicker-next'
import 'vue-datepicker-next/index.css'

const router = useRouter()
const day = useState('day', () =>
  new Date().toISOString().slice(0, 10)
)

const onDateSelect = (newDate: string | Date) => {
  router.push(`/date/${newDate}`);
}
</script>

<style>
.inline-picker .mx-input-wrapper,
.inline-picker .mx-input {
  display: none !important;
}

/* Todo: в будущем так будут выделяться дни где все задачи выполнены, а и другим цветом где остались не выполненые задачи.
.cell[title="2025-08-09"] {
  background: green;
  color: white;
}
.cell[title="2025-08-09"] {
  background: red;
  color: white;
}
*/
</style>
