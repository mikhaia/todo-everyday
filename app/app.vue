<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans">
    <div class="flex min-h-screen">
      <aside class="w-72 p-4 border-r flex flex-col justify-between bg-gray-600 text-white">
        <div>
          <h1 class="flex items-center gap-2 text-lg font-bold">
            <span class="material-symbols-outlined">checklist</span> Todo
          </h1>
          <div class="space-y-2 h-[300px]">
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
              :get-classes="getDayClass"
              @change="onDateSelect"
            />
          </div>
          <CategoryList />
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
import { computed } from 'vue'
import DatePicker from 'vue-datepicker-next'
import 'vue-datepicker-next/index.css'
import { format } from 'date-fns'
import CategoryList from './components/CategoryList.vue'

interface Todo {
  date: string
  done: boolean
}

const router = useRouter()
const day = useState('day', () =>
  new Date().toISOString().slice(0, 10)
)
const tasks = useState<Todo[]>('tasks', () => [])

const dayMap = computed(() => {
  const map: Record<string, { total: number; done: number }> = {}
  for (const t of tasks.value) {
    const m = map[t.date] || (map[t.date] = { total: 0, done: 0 })
    m.total++
    if (t.done) m.done++
  }
  return map
})

const getDayClass = (value: Date, innerValue: Date[], classes: string) => {
  const date = format(value, 'yyyy-MM-dd')
  if (innerValue.some(v => format(v, 'yyyy-MM-dd') === date)) {
    return `${classes} selected-day`
  }
  const info = dayMap.value[date]
  if (info) {
    return `${classes} ${info.done === info.total ? 'completed-day' : 'pending-day'}`
  }
  return classes
}

const onDateSelect = (newDate: string | Date) => {
  router.push(`/date/${newDate}`);
}
</script>

<style>
.inline-picker .mx-input-wrapper,
.inline-picker .mx-input {
  display: none !important;
}

.mx-datepicker .cell.completed-day {
  background: #22c55e !important;
  color: #ffffff !important;
}

.mx-datepicker .cell.pending-day {
  background: #6b7280 !important;
  color: #ffffff !important;
}

.mx-datepicker .cell.selected-day {
  background: #3b82f6 !important;
  color: #ffffff !important;
}
</style>
