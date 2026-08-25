<template>
  <LoadingOverlay v-if="loading" />
  <div class="text-black">
    <div class="flex items-center gap-2 pb-4"
      :style="{
        color: activeCategory?.image
          ? '#fff'
          : (activeCategory?.background ? textColor(activeCategory.background) : undefined)
      }">
      <NuxtLink to="/" class="bg-white rounded shadow text-black p-1 material-symbols-outlined" aria-label="Day view" title="Day view">
        checklist
      </NuxtLink>
      <button @click="prevMonth" class="material-symbols-outlined" aria-label="Previous month" title="Previous month">chevron_left</button>
      <h2 class="text-xl md:text-2xl font-bold min-w-[9rem] text-center">{{ monthLabel }}</h2>
      <button @click="nextMonth" class="material-symbols-outlined" aria-label="Next month" title="Next month">chevron_right</button>
      <div class="ml-auto flex items-center gap-2">
        <NuxtLink to="/" class="material-symbols-outlined" aria-label="Today" title="Today">today</NuxtLink>
        <button
          @click="categorySidebarOpen = !categorySidebarOpen"
          class="bg-white rounded shadow text-black p-1 material-symbols-outlined"
          :aria-label="categorySidebarOpen ? 'Hide categories' : 'Show categories'"
          :title="categorySidebarOpen ? 'Hide categories' : 'Show categories'"
        >
          inbox_text
        </button>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1 mb-1">
      <div
        v-for="w in weekdays"
        :key="w"
        class="text-center text-xs md:text-sm font-semibold py-1"
        :style="{
          color: activeCategory?.image
            ? '#fff'
            : (activeCategory?.background ? textColor(activeCategory.background) : undefined)
        }"
      >{{ w }}</div>
    </div>

    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="(cell, idx) in cells"
        :key="idx"
        class="min-h-[90px] md:min-h-[120px] rounded p-1 text-black overflow-hidden"
        :class="cell
          ? (isToday(cell) ? 'bg-white ring-2 ring-blue-500' : 'bg-white/80')
          : 'bg-white/20'"
      >
        <template v-if="cell">
          <div class="text-right text-xs md:text-sm font-semibold mb-1"
            :class="isToday(cell) ? 'text-blue-600' : 'text-gray-500'">
            {{ cell.slice(-2) }}
          </div>
          <ul class="space-y-0.5">
            <li
              v-for="t in visibleTasks(cell)"
              :key="t.id"
              class="flex items-center gap-1 text-[11px] md:text-xs leading-tight"
              :title="t.title"
            >
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :style="{ background: dotColor(t) }"
              ></span>
              <span class="truncate" :class="{ 'line-through text-gray-400': t.done }">{{ t.title }}</span>
            </li>
            <li
              v-if="overflowCount(cell) > 0"
              class="text-[11px] md:text-xs text-gray-500 pl-2.5"
            >+{{ overflowCount(cell) }} more</li>
          </ul>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFirebaseApp } from 'vuefire'
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths } from 'date-fns'
import { textColor } from '../../utils/color'

interface Todo {
  id?: string
  title: string
  order: number
  date: string | null
  done: boolean
  categoryId: string | null
  createdAt?: Timestamp | null
}

interface Category {
  id: string
  title: string
  icon: string
  background: string
  image?: string
}

const route = useRoute()
const router = useRouter()
const app = useFirebaseApp()
const db = getFirestore(app)

const user = useState<{ uid: string } | null>('user', () => null)
const categories = useState<Category[]>('categories', () => [])
const activeCategoryId = useState<string>('activeCategoryId', () => '')
const categorySidebarOpen = useState<boolean>('categorySidebarOpen', () => true)
const tasks = useState<Todo[]>('tasks', () => [])

const MAX_VISIBLE = 4
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Selected month as YYYY-MM, falling back to the current month if the param is invalid.
const month = computed(() => {
  const m = route.params.month as string
  return /^\d{4}-\d{2}$/.test(m) ? m : new Date().toISOString().slice(0, 7)
})
const monthDate = computed(() => new Date(month.value + '-01'))
const monthLabel = computed(() => format(monthDate.value, 'MMMM yyyy'))

const activeCategory = computed(() =>
  categories.value.find((c) => c.id === activeCategoryId.value)
)

useHead({ title: computed(() => `${monthLabel.value} - Todo Everyday`) })

// Cells for a Monday-first grid: leading/trailing blanks (null) pad the weeks.
const cells = computed<(string | null)[]>(() => {
  const first = startOfMonth(monthDate.value)
  const days = eachDayOfInterval({ start: first, end: endOfMonth(monthDate.value) })
    .map((d) => format(d, 'yyyy-MM-dd'))
  const lead = (getDay(first) + 6) % 7
  const arr: (string | null)[] = [...Array(lead).fill(null), ...days]
  while (arr.length % 7) arr.push(null)
  return arr
})

const todayStr = new Date().toISOString().slice(0, 10)
const isToday = (date: string) => date === todayStr

// date string -> its tasks (already ordered by the query), respecting the category filter.
const tasksByDate = computed(() => {
  const map: Record<string, Todo[]> = {}
  for (const t of tasks.value) {
    if (!t.date) continue
    if (activeCategoryId.value && t.categoryId !== activeCategoryId.value) continue
    ;(map[t.date] ||= []).push(t)
  }
  return map
})

const visibleTasks = (date: string) => (tasksByDate.value[date] || []).slice(0, MAX_VISIBLE)
const overflowCount = (date: string) => Math.max(0, (tasksByDate.value[date]?.length || 0) - MAX_VISIBLE)

const categoryMap = computed<Record<string, Category>>(() => {
  const map: Record<string, Category> = {}
  for (const c of categories.value) map[c.id] = c
  return map
})
const dotColor = (t: Todo) =>
  (t.categoryId && categoryMap.value[t.categoryId]?.background) || '#9ca3af'

const prevMonth = () => router.push(`/month/${format(addMonths(monthDate.value, -1), 'yyyy-MM')}`)
const nextMonth = () => router.push(`/month/${format(addMonths(monthDate.value, 1), 'yyyy-MM')}`)

const loading = ref(true)
let off: (() => void) | null = null

const loadMonth = () => {
  off?.()
  off = null
  if (!user.value) {
    tasks.value = []
    loading.value = false
    return
  }
  loading.value = true
  const start = format(startOfMonth(monthDate.value), 'yyyy-MM-dd')
  const end = format(endOfMonth(monthDate.value), 'yyyy-MM-dd')
  const q = query(
    collection(db, 'users', user.value.uid, 'todos'),
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date'),
    orderBy('order'),
    orderBy('createdAt', 'desc'),
  )
  off = onSnapshot(q, (snap) => {
    tasks.value = snap.docs.map((d) => {
      const data = d.data() as Omit<Todo, 'id'>
      return { id: d.id, ...data, categoryId: data.categoryId ?? null, createdAt: data.createdAt ?? null }
    })
    loading.value = false
  })
}

watch([user, month], loadMonth, { immediate: true })
onUnmounted(() => off?.())
</script>
