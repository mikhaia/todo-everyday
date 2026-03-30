<template>
  <template v-if="alwaysShow || items.length">
    <hr v-if="showDivider && items.length" />

    <div :class="{ 'pt-2': !!title }">
      <h3 v-if="title" class="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
        {{ title }}
      </h3>

      <draggable
        :modelValue="items"
        item-key="id"
        tag="ul"
        class="space-y-2 animate__animated animate__fadeIn"
        handle=".drag-handle"
        :animation="200"
        chosen-class="is-chosen"
        ghost-class="is-ghost"
        @update:modelValue="onReorder"
      >
        <template #item="{ element: t }">
          <li>
            <div class="border rounded p-2 flex items-center gap-2 shadow-md bg-gradient-to-b from-white to-gray-100">
              <span class="material-symbols-outlined drag-handle cursor-grab select-none">drag_indicator</span>

              <label class="flex items-center gap-2 flex-1">
                <input class="w-5 h-5 accent-green-600" type="checkbox" :checked="t.done" @change="emit('toggle-todo', t)" />
                <span :class="{ 'line-through text-gray-400': t.done }">{{ t.title }}</span>
              </label>

              <span v-if="showDate && t.date" class="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                {{ t.date }}
              </span>

              <span
                v-if="t.categoryId && categoryMap[t.categoryId]"
                class="text-xs px-2 py-1 rounded flex items-center gap-1 shadow-inner"
                :style="{ background: categoryMap[t.categoryId]?.background, color: textColor(categoryMap[t.categoryId]?.background || '') }"
              >
                <span v-if="categoryMap[t.categoryId]?.icon" class="material-symbols-outlined">
                  {{ categoryMap[t.categoryId]?.icon }}
                </span>
                {{ categoryMap[t.categoryId]?.title }}
              </span>

              <button @click="emit('edit-todo', t)" aria-label="Edit task">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="text-red-500" @click="emit('delete-todo', t)" aria-label="Remove task">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </li>
        </template>
      </draggable>
    </div>
  </template>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { textColor } from '../utils/color'

interface Todo {
  id?: string
  title: string
  order: number
  date: string | null
  done: boolean
  categoryId: string | null
}

interface Category {
  id: string
  title: string
  icon: string
  background: string
}

const props = withDefaults(defineProps<{
  items: Todo[]
  categoryMap: Record<string, Category>
  title?: string
  showDate?: boolean
  showDivider?: boolean
  alwaysShow?: boolean
}>(), {
  title: '',
  showDate: false,
  showDivider: false,
  alwaysShow: false,
})

const emit = defineEmits<{
  reorder: [items: Todo[]]
  'toggle-todo': [todo: Todo]
  'edit-todo': [todo: Todo]
  'delete-todo': [todo: Todo]
}>()

const onReorder = (items: Todo[]) => {
  emit('reorder', items)
}
</script>
