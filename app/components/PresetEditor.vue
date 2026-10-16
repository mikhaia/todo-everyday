<template>
  <form ref="form" class="space-y-3" @submit.prevent="save">
    <input
      ref="titleInput"
      v-model="title"
      placeholder="Preset name, e.g. Morning routine"
      aria-label="Preset name"
      maxlength="100"
      class="w-full rounded border px-3 py-2 font-semibold shadow-sm"
    />
    <draggable v-model="rows" item-key="key" tag="ul" handle=".drag-handle" :animation="150" class="space-y-2">
      <template #item="{ element: row, index }">
        <li class="flex items-center gap-1 sm:gap-2">
          <span class="material-symbols-outlined drag-handle cursor-grab select-none text-gray-400" title="Drag to reorder">drag_indicator</span>
          <input
            v-model="row.title"
            data-task-input
            placeholder="Task"
            :aria-label="`Task ${index + 1}`"
            maxlength="200"
            class="h-9 min-w-0 flex-1 rounded border px-2 text-sm shadow-sm"
            @keydown.enter.prevent="addRow(index + 1)"
          />
          <select
            v-model="row.categoryId"
            :aria-label="`Category for task ${index + 1}`"
            class="h-9 w-32 shrink-0 rounded border bg-white px-2 text-sm shadow-sm sm:w-44"
            :style="categoryStyle(row.categoryId)"
          >
            <option :value="null">No category</option>
            <option v-if="row.categoryId && !categoryMap[row.categoryId]" :value="row.categoryId">Deleted category</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.title }}</option>
          </select>
          <button type="button" class="shrink-0 rounded p-1 text-red-500 hover:bg-red-50" :aria-label="`Remove task ${index + 1}`" title="Remove task" @click="removeRow(index)">
            <span class="material-symbols-outlined block">close</span>
          </button>
        </li>
      </template>
    </draggable>
    <button type="button" class="btn btn-secondary btn-sm gap-1" @click="addRow(rows.length)">
      <span class="material-symbols-outlined text-base">add</span> Add task
    </button>
    <div class="flex items-center justify-end gap-2 border-t pt-3">
      <button type="button" class="btn btn-secondary btn-sm" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary btn-sm" :disabled="!canSave">Save preset</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import draggable from 'vuedraggable'
import { textColor } from '../utils/color'
import { cleanPresetTasks, type Preset, type PresetTask } from '../utils/presets'

const props = defineProps<{ preset?: Preset }>()
const emit = defineEmits<{ save: [value: { title: string, tasks: PresetTask[] }], cancel: [] }>()

const categories = useState<{ id: string, title: string, background: string }[]>('categories', () => [])
const categoryMap = computed(() => Object.fromEntries(categories.value.map(c => [c.id, c])))
const categoryStyle = (id: string | null) => {
  const background = id ? categoryMap.value[id]?.background : undefined
  return background ? { background, color: textColor(background) } : undefined
}

type Row = PresetTask & { key: number }
let nextKey = 0
const row = (task?: PresetTask): Row => ({ key: nextKey++, title: task?.title ?? '', categoryId: task?.categoryId ?? null })
const title = ref(props.preset?.title ?? '')
const rows = ref<Row[]>(props.preset?.tasks.length ? props.preset.tasks.map(row) : [row()])
const canSave = computed(() => !!title.value.trim() && cleanPresetTasks(rows.value).length > 0)

const form = ref<HTMLFormElement>()
const titleInput = ref<HTMLInputElement>()
onMounted(() => titleInput.value?.focus())

async function addRow(index: number) {
  // A new row takes the category of the row above it: routine lists are usually grouped.
  rows.value.splice(index, 0, row({ title: '', categoryId: rows.value[index - 1]?.categoryId ?? null }))
  await nextTick()
  form.value?.querySelectorAll<HTMLInputElement>('[data-task-input]')[index]?.focus()
}
function removeRow(index: number) {
  rows.value.splice(index, 1)
  if (!rows.value.length) rows.value.push(row())
}
function save() {
  if (canSave.value) emit('save', { title: title.value.trim(), tasks: cleanPresetTasks(rows.value) })
}
</script>
