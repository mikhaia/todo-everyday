<template>
  <div v-if="isAuthRoute">
    <NuxtPage />
  </div>
  <template v-else>
    <div
      class="fixed min-h-screen inset-0 bg-cover bg-center opacity-90"
      :style="{ backgroundImage: imageUrl ? `url('${imageUrl}')` : undefined }"
    ></div>
    <div
      class="fixed min-h-screen inset-0 bg-cover bg-center z-[-1]"
      :style="{ backgroundColor: activeCategory?.background || undefined }"
    ></div>
    <div class="min-h-screen text-gray-900 font-sans bg-cover bg-center relative z-1"
      :class="{ 'bg-gray-300': !activeCategory?.background }"
      :style="{
        color: activeCategory?.background ? textColor(activeCategory.background) : ''
      }">
      <div class="flex flex-col md:flex-row min-h-screen">
        <div
          v-if="!isShareRoute"
          class="md:block w-72 bg-white/25 backdrop-blur-2xl backdrop-saturate-150
              border border-white/40 shadow-lg p-5 fixed h-full z-10 transition-transform duration-300"
          :class="[sidebarOpen ? 'translate-x-0' : '-translate-x-full', 'md:translate-x-0']"></div>
        <aside
          v-if="!isShareRoute"
          :class="[
            'fixed md:relative top-0 left-0 h-full md:h-auto w-72 flex flex-col justify-between p-5 transition-transform duration-300 z-10',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'md:translate-x-0'
          ]"
        >
          <div>
            <button
              v-if="!isShareRoute"
              class="md:hidden absolute top-4 left-4 z-20 p-2 pt-3 bg-white rounded shadow text-black"
              @click="sidebarOpen = !sidebarOpen"
            >
              <span class="material-symbols-outlined">{{ sidebarOpen ? 'close' : 'menu' }}</span>
            </button>
            <h1 class="flex items-center gap-2 text-2xl font-bold justify-center">
              <span class="material-symbols-outlined">checklist</span> Todo
            </h1>
            <div class="space-y-2 h-[300px]">
              <DatePicker
                class="inline-picker"
                v-model="day"
                type="date"
                format="YYYY-MM-DD"
                value-type="format"
                :lang="lang"
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
        <main class="flex-1 p-4 md:p-6" @click="closeSidebarOnMobile">
          <button
            v-if="!isShareRoute"
            class="md:hidden absolute top-4 left-4 p-2 pt-3 bg-white rounded shadow text-black"
            @click.stop="sidebarOpen = !sidebarOpen"
          >
            <span class="material-symbols-outlined">menu</span>
          </button>
          <NuxtPage />
        </main>
      </div>
        <DeleteCategoryModal />
        <CategoryModal />
        <TaskModal />
        <DeleteTaskModal />
    </div>
  </template>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { watch, computed, ref } from 'vue'
import { getStorage, ref as sref, getDownloadURL } from 'firebase/storage'
import DatePicker from 'vue-datepicker-next'
import 'vue-datepicker-next/index.css'
import { format } from 'date-fns'
import DeleteCategoryModal from './components/DeleteCategoryModal.vue'
import CategoryList from './components/CategoryList.vue'
import CategoryModal from './components/CategoryModal.vue'
import TaskModal from './components/TaskModal.vue'
import DeleteTaskModal from './components/DeleteTaskModal.vue'
import { textColor } from './utils/color'

interface Todo {
  date: string | null
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
const sidebarOpen = ref(false)
const imageUrl = ref<string>('')
const urlCache = new Map<string, string>()
const isShareRoute = computed(() => route.path.startsWith('/share'))
const isAuthRoute = computed(() => route.path.startsWith('/login'))

const closeSidebarOnMobile = () => {
  if (sidebarOpen.value && window.innerWidth < 768) {
    console.log('here');
    sidebarOpen.value = false
  }
}

watch(() => activeCategory.value?.image, async (path) => {
  if (!path) { imageUrl.value = ''; return }

  const cached = urlCache.get(path);
  if (cached) { imageUrl.value = cached; return }

  const currentPath = path;
  try {
    const url = await getDownloadURL(sref(storage, path));
    if (activeCategory.value?.image === currentPath) {
      urlCache.set(path, url)
      imageUrl.value = url
    }
  } catch (e) {
    console.error('Error getting image:', e)
    if (activeCategory.value?.image === currentPath) imageUrl.value = '';
  }
}, { immediate: true })

const dayMap = computed(() => {
  const map: Record<string, { total: number; done: number }> = {}
  for (const t of tasks.value) {
    if (!t.date) continue
    const m = map[t.date] || (map[t.date] = { total: 0, done: 0 })
    m.total++
    if (t.done) m.done++
  }
  return map
})

const lang = {
  formatLocale: { firstDayOfWeek: 1 },
}

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
