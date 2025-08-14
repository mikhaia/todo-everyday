<template>
  <div class="max-w-3xl text-black">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-1" :style="headerStyle">
      <span class="material-symbols-outlined text-4xl" v-if="category?.icon">{{ category.icon }}</span>
      <span v-else class="material-symbols-outlined">checklist</span>
      {{ category?.title || 'ToDo' }} :: {{ share?.date }}
    </h2>
    <ul class="space-y-2">
      <li v-for="t in tasks" :key="t.id">
        <div class="bg-white border rounded p-2 flex items-center gap-2">
          <input class="w-5 h-5 accent-green-600" type="checkbox" :checked="t.done" disabled />
          <span :class="{ 'line-through text-gray-400': t.done }">{{ t.title }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useFirebaseApp } from 'vuefire'
import { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { ref, computed, onMounted } from 'vue'

interface Share { uid: string; date: string; categoryId: string }
interface Todo { id?: string; title: string; done: boolean; categoryId: string | null; order: number; createdAt?: any }
interface Category { id?: string; title: string; icon: string; background: string; image?: string }

const route = useRoute()
const app = useFirebaseApp()
const db = getFirestore(app)

const share = ref<Share | null>(null)
const tasks = useState<Todo[]>('tasks', () => [])
const category = ref<Category | null>(null)
const categories = useState<Category[]>('categories', () => [])
const activeCategoryId = useState<string>('activeCategoryId', () => '')

const headerStyle = computed(() => ({
  color: category.value?.image
    ? '#fff'
    : (category.value?.background ? textColor(category.value.background) : undefined)
}))

onMounted(async () => {
  const id = route.params.uid as string
  const snap = await getDoc(doc(db, 'share', id))
  if (!snap.exists()) return
  share.value = snap.data() as Share
  const { uid, date, categoryId } = share.value
  let q = query(
    collection(db, 'users', uid, 'todos'),
    where('date', '==', date),
    orderBy('order'),
    orderBy('createdAt', 'desc')
  )
  if (categoryId) q = query(q, where('categoryId', '==', categoryId))
  const taskSnap = await getDocs(q)
  tasks.value = taskSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Todo,'id'>) }))
  if (categoryId) {
    const catSnap = await getDoc(doc(db, 'users', uid, 'categories', categoryId))
    if (catSnap.exists()) {
      category.value = { id: catSnap.id, ...(catSnap.data() as Omit<Category,'id'>) }
      categories.value = [category.value]
      activeCategoryId.value = categoryId
    }
  } else {
    categories.value = []
    activeCategoryId.value = ''
  }
})

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
