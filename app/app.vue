<template>
  <div
    class="fixed min-h-screen inset-0 bg-cover bg-center opacity-90"
    :style="{ backgroundImage: imageUrl ? `url('${imageUrl}')` : undefined }"
  ></div>
    <div
    class="fixed min-h-screen inset-0 bg-cover bg-center z-[-1]"
    :style="{ backgroundColor: activeCategory?.background || undefined }"
  ></div>
  <div class="min-h-screen text-gray-900 font-sans bg-cover bg-center relative z-1"
    :style="{
      color: activeCategory?.background ? textColor(activeCategory.background) : ''
    }">
    <div class="flex min-h-screen">
      <aside class="w-72 p-4 flex flex-col justify-between bg-white/25 backdrop-blur-2xl backdrop-saturate-150 
            border border-white/40 shadow-lg p-5">
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
import { useRouter, useRoute } from 'vue-router'
import { ref as vueRef, watch, computed } from 'vue'
import { getStorage, ref as sref, getDownloadURL } from "firebase/storage"
import DatePicker from 'vue-datepicker-next'
import 'vue-datepicker-next/index.css'
import { format } from 'date-fns'
import CategoryList from './components/CategoryList.vue'

interface Todo {
  date: string
  done: boolean
}

interface Category {
  id?: string
  title: string
  icon: string
  background: string
  image?: string
}

const router = useRouter()
const route = useRoute()
const day = useState('day', () =>
  new Date().toISOString().slice(0, 10)
)
const tasks = useState<Todo[]>('tasks', () => [])
const categories = useState<{ id: string; background: string }[]>('categories', () => [])
const activeCategoryId = useState<string>('activeCategoryId', () => '')

const activeCategory = computed(() =>
  categories.value.find(c => c.id === activeCategoryId.value) as Category
)
const storage = getStorage()
const imageUrl = ref<string>('')

watch(() => activeCategory.value?.image, async (path) => {
  if (!path) { imageUrl.value = ''; return }
  try {
    imageUrl.value = await getDownloadURL(sref(storage, path))
  } catch (e) {
    console.error('Error getting image:', e)
    imageUrl.value = ''
  }
}, { immediate: true })

const dayMap = computed(() => {
  const map: Record<string, { total: number; done: number }> = {}
  for (const t of tasks.value) {
    const m = map[t.date] || (map[t.date] = { total: 0, done: 0 })
    m.total++
    if (t.done) m.done++
  }
  return map
})

const getDayClass = (value: Date, _innerValue: Date[], classes: string) => {
  const date = format(value, 'yyyy-MM-dd')
  const selected = route.params.date as string | undefined
  if (selected === date) {
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

function textColor(bg: string) {
  const { r, g, b } = toRGB(bg);
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return L > 0.6 ? '#111827' : '#ffffff';
}

function toRGB(color: string) {
  if (!color) return { r: 0, g: 0, b: 0 };
  if (color.startsWith('#')) {
    const hex = color.slice(1).replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3');
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  const m = color.match(/\d+/g);
  return m ? { r: +m[0], g: +Number(m[1]), b: +Number(m[2]) } : { r: 0, g: 0, b: 0 };
}
</script>

<style>
.inline-picker .mx-input-wrapper,
.inline-picker .mx-input {
  display: none;
}

.mx-datepicker-main {
  border-radius: 5px;
}

.mx-datepicker .cell {
  border-radius: 3px;
}

.mx-datepicker .cell.completed-day {
  background: #22c55e;
  color: #ffffff;
}

.mx-datepicker .cell.pending-day {
  background: #6b7280;
  color: #ffffff;
}

.mx-datepicker .cell.selected-day {
  background: #3b82f6;
  color: #ffffff;
}
</style>
