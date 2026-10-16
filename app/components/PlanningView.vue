<template>
  <section class="planning rounded-xl border border-white/60 bg-white/75 p-3 shadow-lg backdrop-blur-md sm:p-4" :aria-label="`Planning View for ${day}`">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 class="flex items-center gap-2 font-semibold">
        <span class="material-symbols-outlined text-blue-600">calendar_view_day</span>
        Planning View
      </h3>
      <span class="text-xs text-gray-500">{{ planned.length }} planned · {{ unplanned.length }} unplanned</span>
    </div>

    <div class="range-bar flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <select :value="rangeStart" aria-label="Planning start time" class="range-time" :disabled="!!gesture" @change="changeRange($event, 'start')">
        <option v-for="minute in startOptions" :key="minute" :value="minute">{{ formatMinute(minute) }}</option>
      </select>
      <div class="relative mx-2 h-8 min-w-0 flex-1 overflow-hidden rounded bg-slate-100" aria-label="Tasks overview">
        <div v-for="hour in overviewHours" :key="hour" class="absolute inset-y-0 border-l border-white" :style="{ left: `${(hour - rangeStart) / rangeLength * 100}%` }" />
        <div
          v-for="task in visiblePlanned" :key="task.id"
          class="absolute inset-y-1 rounded-sm"
          :style="overviewStyle(task)"
          :title="`${task.title}: ${formatMinute(displaySlot(task)!.start)}–${formatMinute(displaySlot(task)!.end)}`"
        />
      </div>
      <select :value="rangeEnd" aria-label="Planning end time" class="range-time" :disabled="!!gesture" @change="changeRange($event, 'end')">
        <option v-for="minute in endOptions" :key="minute" :value="minute">{{ formatMinute(minute) }}</option>
      </select>
    </div>
    <p class="my-3 text-xs leading-relaxed text-gray-500">Drag tasks to a time. Drag the top or bottom edge to resize in 1-hour steps. Use the edit icon to enter exact times.</p>

    <div v-if="unplanned.length" class="mb-3">
      <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Not planned yet</h4>
      <ul class="flex max-h-40 flex-wrap gap-2 overflow-y-auto p-1">
        <li v-for="task in unplanned" :key="task.id" class="flex max-w-full items-center gap-1 rounded-md border bg-white px-2 py-1 shadow-sm">
          <button
            class="touch-none select-none cursor-grab rounded p-1 focus-visible:ring-2 focus-visible:ring-blue-500"
            :aria-label="`Drag ${task.title} onto the planner`"
            @pointerdown="startGesture($event, task, 'new')"
            @click="scheduleFirst(task)"
          ><span class="material-symbols-outlined block text-lg">drag_indicator</span></button>
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: taskColor(task) }" />
          <span class="min-w-0 truncate text-sm" :class="{ 'line-through text-gray-400': task.done }">{{ task.title }}</span>
          <button class="shrink-0 rounded p-1 text-blue-700 hover:bg-blue-50 disabled:opacity-50" :aria-label="`Plan ${task.title} in the first free hour`" title="Plan in the first free hour" @click="scheduleFirst(task)">
            <span class="material-symbols-outlined block text-lg">add</span>
          </button>
        </li>
      </ul>
    </div>
    <p v-if="!items.length" class="mb-3 rounded-lg bg-white/80 p-3 text-sm text-gray-500">No tasks for this day. Add a dated task above to start planning.</p>
    <div v-if="outsideCount" class="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
      <span>{{ outsideCount }} task(s) extend outside this range.</span>
      <button class="text-blue-700 underline" :disabled="!!gesture" @click="rangeStart = 0; rangeEnd = 1440">Show full day</button>
    </div>

    <Teleport to="body">
      <dialog ref="editorDialog" class="planning-dialog rounded-xl bg-white p-0 text-black shadow-xl" aria-labelledby="planning-editor-title" @cancel.prevent="closeEditor" @click.self="closeEditor" @close="editorOpen = false">
        <form v-if="selectedTask && selectedSlot" class="p-6" @submit.prevent="saveSelected">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 id="planning-editor-title" class="text-lg font-semibold">Edit task time</h3>
            <button type="button" class="rounded p-1 hover:bg-gray-100 disabled:opacity-50" aria-label="Close time editor" @click="closeEditor">
              <span class="material-symbols-outlined block">close</span>
            </button>
          </div>
          <p class="mb-4 break-words font-medium">{{ selectedTask.title }}</p>
          <div class="mb-4 grid grid-cols-2 gap-3">
            <label class="text-sm text-gray-600">Start
              <select v-model.number="editStart" aria-label="Task start time" class="mt-1 block w-full rounded border bg-white px-2 py-2" autofocus>
                <option v-for="minute in allMinutes.slice(0, -1)" :key="minute" :value="minute">{{ formatMinute(minute) }}</option>
              </select>
            </label>
            <label class="text-sm text-gray-600">End
              <select v-model.number="editEnd" aria-label="Task end time" class="mt-1 block w-full rounded border bg-white px-2 py-2">
                <option v-for="minute in allMinutes.slice(1)" :key="minute" :value="minute">{{ formatMinute(minute) }}</option>
              </select>
            </label>
          </div>
          <p v-if="error" role="alert" class="mb-4 rounded-lg bg-red-50 p-2 text-sm text-red-700">{{ error }}</p>
          <div class="flex flex-wrap justify-end gap-2">
            <button type="button" class="mr-auto rounded border px-3 py-2 text-sm disabled:opacity-50" @click="unplanSelected">Unplan</button>
            <button type="button" class="rounded border px-3 py-2 text-sm disabled:opacity-50" @click="closeEditor">Cancel</button>
            <button type="submit" class="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">Save time</button>
          </div>
        </form>
      </dialog>
    </Teleport>

    <p v-if="error && !editorOpen" role="alert" class="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{{ error }}</p>
    <p class="sr-only" role="status" aria-live="polite">{{ status }}</p>
    <div class="mb-2 flex min-h-4 items-center justify-between gap-2 text-xs text-gray-500">
      <span>{{ gesture ? (gestureValid ? 'Release to save time' : 'This slot is unavailable') : 'Tasks cannot overlap, including other categories.' }}</span>
      <span v-if="saving">Saving…</span>
      <span v-else>{{ plannedMinutes }} min planned</span>
    </div>

    <div ref="scroller" class="planner-scroll relative max-h-[65vh] overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white" :aria-busy="saving">
      <div class="relative mr-2" :style="{ height: `${rangeLength * PIXELS_PER_MINUTE}px` }">
        <div v-for="minute in gridLines" :key="minute" class="pointer-events-none absolute inset-x-0 flex" :style="{ top: `${(minute - rangeStart) * PIXELS_PER_MINUTE}px` }">
          <span class="w-14 shrink-0 pr-2 text-right text-[11px] leading-none text-gray-400" :class="minute === rangeStart ? 'translate-y-1' : '-translate-y-1/2'">{{ formatMinute(minute) }}</span>
          <div class="flex-1 border-t" :class="minute % 60 === 0 ? 'border-gray-200' : 'border-dashed border-gray-100'" />
        </div>
        <div ref="grid" class="absolute inset-y-0 left-14 right-0" aria-label="Hourly task planner">
          <div v-for="task in hiddenPlanned" :key="task.id" class="pointer-events-none absolute inset-x-0 rounded border border-dashed border-gray-300 bg-gray-100/70" :style="blockStyle(taskSlot(task)!)" title="Time occupied by another category">
            <span class="px-2 text-[11px] text-gray-400">Busy · other category</span>
          </div>
          <div
            v-for="task in visiblePlanned" :key="task.id"
            class="task-block absolute inset-x-1 cursor-grab touch-none select-none overflow-hidden rounded-md border border-black/10 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            :class="[{ 'ring-2 ring-blue-500': selectedId === task.id, 'opacity-60': task.done, 'ring-2 ring-red-500': gesture?.task.id === task.id && !gestureValid }]"
            :style="{ ...blockStyle(displaySlot(task)!), background: taskColor(task), color: textColor(taskColor(task)) }"
            tabindex="0"
            role="group"
            :aria-label="`${task.title}, ${formatMinute(displaySlot(task)!.start)} to ${formatMinute(displaySlot(task)!.end)}. Use the edit button to edit times; arrow keys move by 1 hour.`"
            @pointerdown="startGesture($event, task, 'move')"
            @click="selectTask(task)"
            @keydown.enter.self.prevent="openEditor(task)"
            @keydown.space.self.prevent="openEditor(task)"
            @keydown.up.prevent="moveWithKeyboard(task, -PLANNING_STEP)"
            @keydown.down.prevent="moveWithKeyboard(task, PLANNING_STEP)"
          >
            <div v-if="displaySlot(task)!.start >= rangeStart" class="resize-handle absolute inset-x-0 top-0 h-2 cursor-ns-resize" title="Drag to change start time" @pointerdown.stop="startGesture($event, task, 'start')"><span /></div>
            <div class="flex h-full items-start gap-2 px-2 py-1.5 text-xs leading-4">
              <span class="min-w-0 flex-1 break-words font-semibold" :class="{ 'line-through': task.done }">{{ task.title }}</span>
              <span class="shrink-0 text-[10px] opacity-80">{{ formatMinute(displaySlot(task)!.start) }}–{{ formatMinute(displaySlot(task)!.end) }}</span>
              <button type="button" class="shrink-0 rounded p-1 hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-current disabled:opacity-50" :aria-label="`Edit time for ${task.title}`" title="Edit task time" @pointerdown.stop @click.stop="openEditor(task)" @keydown.stop>
                <span class="material-symbols-outlined block text-base">edit</span>
              </button>
            </div>
            <div v-if="displaySlot(task)!.end <= rangeEnd" class="resize-handle absolute inset-x-0 bottom-0 h-2 cursor-ns-resize" title="Drag to change end time" @pointerdown.stop="startGesture($event, task, 'end')"><span /></div>
          </div>
          <div v-if="gesture?.mode === 'new' && gesture.overGrid" class="pointer-events-none absolute inset-x-1 rounded-md border-2 border-dashed p-2 text-xs font-semibold" :class="gestureValid ? 'border-blue-500 bg-blue-100/90 text-blue-800' : 'border-red-500 bg-red-100/90 text-red-800'" :style="blockStyle(gesture.slot)">{{ gesture.task.title }} · {{ formatMinute(gesture.slot.start) }}–{{ formatMinute(gesture.slot.end) }}</div>
        </div>
      </div>
    </div>
    <div class="mt-1 text-right text-[11px] text-gray-400">{{ formatMinute(rangeEnd) }}</div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { textColor } from '../utils/color'
import { firstFreeSlot, formatMinute, PLANNING_STEP, sameSlot, slotAvailable, taskSlot, type PlanningTask, type TimeSlot } from '../utils/planning'

const props = defineProps<{
  day: string
  items: PlanningTask[]
  dayTasks: PlanningTask[]
  categoryMap: Record<string, { background: string }>
  saveSchedule: (id: string, slot: TimeSlot | null, date: string) => Promise<void>
}>()

// Optimistic layer: the slot each task will have once its queued saves finish. The planner
// renders and validates against these values, so the UI never waits for Firestore.
type SaveJob = { id: string, title: string, date: string, slot: TimeSlot | null }
const pending = ref<Record<string, TimeSlot | null>>({})
const queue: SaveJob[] = []
const confirmed = new Map<string, SaveJob>()
let draining = false
const withPending = (task: PlanningTask): PlanningTask => {
  if (!task.id || !(task.id in pending.value)) return task
  const slot = pending.value[task.id]
  return { ...task, schedule: slot && task.date ? { date: task.date, start: slot.start, end: slot.end } : null }
}
const viewItems = computed(() => props.items.map(withPending))
const viewDayTasks = computed(() => props.dayTasks.map(withPending))
const saving = computed(() => Object.keys(pending.value).length > 0)

const PIXELS_PER_MINUTE = 0.8
const rangeStart = useState('planningRangeStart', () => 420)
const rangeEnd = useState('planningRangeEnd', () => 1380)
const rangeLength = computed(() => rangeEnd.value - rangeStart.value)
const allMinutes = Array.from({ length: 1440 / PLANNING_STEP + 1 }, (_, index) => index * PLANNING_STEP)
const startOptions = computed(() => allMinutes.filter(minute => minute < rangeEnd.value))
const endOptions = computed(() => allMinutes.filter(minute => minute > rangeStart.value))
const gridLines = computed(() => Array.from({ length: Math.ceil(rangeLength.value / 60) }, (_, index) => rangeStart.value + index * 60))
const overviewHours = computed(() => allMinutes.filter(minute => minute % 60 === 0 && minute > rangeStart.value && minute < rangeEnd.value))
const planned = computed(() => viewItems.value.filter(task => taskSlot(task)))
const unplanned = computed(() => viewItems.value.filter(task => !taskSlot(task)))
const plannedMinutes = computed(() => planned.value.reduce((sum, task) => sum + taskSlot(task)!.end - taskSlot(task)!.start, 0))
const outsideCount = computed(() => planned.value.filter(task => taskSlot(task)!.start < rangeStart.value || taskSlot(task)!.end > rangeEnd.value).length)
const intersectsRange = (slot: TimeSlot) => slot.start < rangeEnd.value && slot.end > rangeStart.value
const visiblePlanned = computed(() => planned.value.filter(task => intersectsRange(displaySlot(task)!)))
const hiddenPlanned = computed(() => viewDayTasks.value.filter(task => taskSlot(task) && !props.items.some(item => item.id === task.id) && intersectsRange(taskSlot(task)!)))
const taskColor = (task: PlanningTask) => (task.categoryId && props.categoryMap[task.categoryId]?.background) || '#64748b'
const displaySlot = (task: PlanningTask) => gesture.value?.task.id === task.id ? gesture.value.slot : taskSlot(task)
const blockStyle = (slot: TimeSlot) => ({
  top: `${(Math.max(slot.start, rangeStart.value) - rangeStart.value) * PIXELS_PER_MINUTE}px`,
  height: `${(Math.min(slot.end, rangeEnd.value) - Math.max(slot.start, rangeStart.value)) * PIXELS_PER_MINUTE}px`,
})
const overviewStyle = (task: PlanningTask) => {
  const slot = displaySlot(task)!
  return {
    left: `${(Math.max(slot.start, rangeStart.value) - rangeStart.value) / rangeLength.value * 100}%`,
    width: `${(Math.min(slot.end, rangeEnd.value) - Math.max(slot.start, rangeStart.value)) / rangeLength.value * 100}%`,
    background: taskColor(task),
  }
}

const error = ref('')
const status = ref('')
const selectedId = ref<string>()
const editorDialog = ref<HTMLDialogElement>()
const editorOpen = ref(false)
const selectedTask = computed(() => viewItems.value.find(task => task.id === selectedId.value))
const selectedSlot = computed(() => selectedTask.value && taskSlot(selectedTask.value))
const editStart = ref(420)
const editEnd = ref(480)
// Watch the times, not the slot object: snapshots and background saves recreate task objects.
watch([() => selectedSlot.value?.start, () => selectedSlot.value?.end], ([start, end]) => {
  if (start !== undefined && end !== undefined) { editStart.value = start; editEnd.value = end }
  else editorDialog.value?.close()
})
function selectTask(task: PlanningTask) {
  if (suppressClick) return
  selectedId.value = task.id
  const slot = taskSlot(task)
  if (slot) { editStart.value = slot.start; editEnd.value = slot.end }
}
async function openEditor(task: PlanningTask) {
  if (suppressClick || !taskSlot(task)) return
  selectTask(task)
  error.value = ''
  await nextTick()
  editorDialog.value?.showModal()
  editorOpen.value = true
}
function closeEditor() {
  editorDialog.value?.close()
  editorOpen.value = false
  error.value = ''
}
function changeRange(event: Event, edge: 'start' | 'end') {
  const value = Number((event.target as HTMLSelectElement).value)
  if (edge === 'start') rangeStart.value = value
  else rangeEnd.value = value
}
// Shows the new time immediately and saves it in the background.
function persist(task: PlanningTask, slot: TimeSlot | null) {
  if (!task.id) return false
  error.value = ''
  if (slot && !slotAvailable(slot, viewDayTasks.value, task.id)) {
    error.value = 'Choose a free time with at least 1 hour. Tasks cannot overlap.'
    return false
  }
  pending.value[task.id] = slot
  confirmed.delete(task.id)
  // Saves run one at a time and in order, so a task can take a slot another task has just
  // left. Back-to-back edits of the same task are merged into a single write.
  const last = queue[queue.length - 1]
  if (last?.id === task.id) last.slot = slot
  else queue.push({ id: task.id, title: task.title, date: props.day, slot })
  status.value = slot ? `${task.title} planned for ${formatMinute(slot.start)}–${formatMinute(slot.end)}.` : `${task.title} is no longer planned.`
  selectedId.value = slot ? task.id : undefined
  void drain()
  return true
}
async function drain() {
  if (draining) return
  draining = true
  while (queue.length) {
    const job = queue.shift()!
    let saved = true
    try {
      await props.saveSchedule(job.id, job.slot, job.date)
    } catch (cause) {
      saved = false
      const reason = cause instanceof Error && !('code' in cause) ? cause.message : 'Check your connection and try again.'
      error.value = `"${job.title}" was not saved. ${reason}`
      status.value = error.value
    }
    // A newer edit of this task is still queued: keep showing that one.
    if (queue.some(next => next.id === job.id)) continue
    if (saved) {
      // Keep the optimistic slot until the snapshot catches up, so the block does not jump back.
      confirmed.set(job.id, job)
      releaseConfirmed()
      setTimeout(() => { if (confirmed.get(job.id) === job) release(job.id) }, 5000)
    } else {
      delete pending.value[job.id]
    }
  }
  draining = false
}
function release(id: string) {
  confirmed.delete(id)
  delete pending.value[id]
}
function releaseConfirmed() {
  for (const [id, job] of confirmed) {
    const task = props.dayTasks.find(task => task.id === id)
    if (!task || sameSlot(taskSlot(task), job.slot)) release(id)
  }
}
watch(() => props.dayTasks, releaseConfirmed)
function scheduleFirst(task: PlanningTask) {
  if (suppressClick) return
  const slot = firstFreeSlot(viewDayTasks.value, rangeStart.value, rangeEnd.value)
  if (slot) persist(task, slot)
  else error.value = 'No free hour in this range. Expand the range or free up an existing slot.'
}
function saveSelected() {
  if (selectedTask.value && persist(selectedTask.value, { start: editStart.value, end: editEnd.value })) closeEditor()
}
function unplanSelected() {
  if (selectedTask.value && persist(selectedTask.value, null)) closeEditor()
}
function moveWithKeyboard(task: PlanningTask, delta: number) {
  const slot = taskSlot(task)
  if (slot) persist(task, { start: slot.start + delta, end: slot.end + delta })
}

type Gesture = {
  task: PlanningTask
  mode: 'new' | 'move' | 'start' | 'end'
  pointerId: number
  anchor: number
  initialX: number
  initialY: number
  original: TimeSlot
  slot: TimeSlot
  moved: boolean
  overGrid: boolean
}
const grid = ref<HTMLElement>()
const scroller = ref<HTMLElement>()
watch([rangeStart, rangeEnd], () => { if (scroller.value) scroller.value.scrollTop = 0 })
const gesture = ref<Gesture | null>(null)
const gestureValid = computed(() => !!gesture.value && gesture.value.overGrid && slotAvailable(gesture.value.slot, viewDayTasks.value, gesture.value.task.id))
let suppressClick = false
let clickTimer: ReturnType<typeof setTimeout> | undefined
let frame = 0
let pointerX = 0
let pointerY = 0
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
function pointerMinute(y: number) {
  return rangeStart.value + (y - grid.value!.getBoundingClientRect().top) / PIXELS_PER_MINUTE
}
function startGesture(event: PointerEvent, task: PlanningTask, mode: Gesture['mode']) {
  if (!task.id || !grid.value || gesture.value || !event.isPrimary || event.button !== 0) return
  const original = taskSlot(task) || { start: rangeStart.value, end: Math.min(rangeEnd.value, rangeStart.value + 60) }
  pointerX = event.clientX
  pointerY = event.clientY
  gesture.value = { task, mode, pointerId: event.pointerId, anchor: pointerMinute(event.clientY), initialX: pointerX, initialY: pointerY, original: { ...original }, slot: { ...original }, moved: false, overGrid: mode !== 'new' }
  error.value = ''
  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', finishGesture)
  window.addEventListener('pointercancel', cancelGesture)
  window.addEventListener('keydown', onEscape)
  window.addEventListener('blur', cancelGesture)
  frame = requestAnimationFrame(autoScroll)
}
function updateGesture() {
  const current = gesture.value
  if (!current || !grid.value || !scroller.value) return
  if (Math.hypot(pointerX - current.initialX, pointerY - current.initialY) > 4) current.moved = true
  if (!current.moved) return
  const rect = scroller.value.getBoundingClientRect()
  const gridRect = grid.value.getBoundingClientRect()
  current.overGrid = pointerX >= gridRect.left && pointerX <= gridRect.right && pointerY >= rect.top && pointerY <= rect.bottom
  const delta = Math.round((pointerMinute(pointerY) - current.anchor) / PLANNING_STEP) * PLANNING_STEP
  const duration = current.original.end - current.original.start
  if (current.mode === 'new' || current.mode === 'move') {
    const raw = current.mode === 'new' ? Math.floor(pointerMinute(pointerY) / PLANNING_STEP) * PLANNING_STEP : current.original.start + delta
    const minStart = current.mode === 'new' ? rangeStart.value : Math.min(rangeStart.value, current.original.start)
    const maxEnd = current.mode === 'new' ? rangeEnd.value : Math.max(rangeEnd.value, current.original.end)
    const start = clamp(raw, minStart, maxEnd - duration)
    current.slot = { start, end: start + duration }
  } else if (current.mode === 'start') {
    current.slot = { start: clamp(current.original.start + delta, Math.min(rangeStart.value, current.original.start), current.original.end - PLANNING_STEP), end: current.original.end }
  } else {
    current.slot = { start: current.original.start, end: clamp(current.original.end + delta, current.original.start + PLANNING_STEP, Math.max(rangeEnd.value, current.original.end)) }
  }
}
function onPointerMove(event: PointerEvent) {
  if (event.pointerId !== gesture.value?.pointerId) return
  event.preventDefault()
  pointerX = event.clientX
  pointerY = event.clientY
  updateGesture()
}
function autoScroll() {
  if (!gesture.value || !scroller.value) return
  if (gesture.value.moved) {
    const rect = scroller.value.getBoundingClientRect()
    if (pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom) {
      const speed = pointerY < rect.top + 40 ? -10 : pointerY > rect.bottom - 40 ? 10 : 0
      if (speed) { scroller.value.scrollTop += speed; updateGesture() }
    }
  }
  frame = requestAnimationFrame(autoScroll)
}
function stopListeners() {
  cancelAnimationFrame(frame)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', finishGesture)
  window.removeEventListener('pointercancel', cancelGesture)
  window.removeEventListener('keydown', onEscape)
  window.removeEventListener('blur', cancelGesture)
}
function ignoreNextClick() {
  suppressClick = true
  clearTimeout(clickTimer)
  clickTimer = setTimeout(() => { suppressClick = false }, 250)
}
function finishGesture(event: PointerEvent) {
  const current = gesture.value
  if (!current || event.pointerId !== current.pointerId) return
  pointerX = event.clientX
  pointerY = event.clientY
  updateGesture()
  const valid = gestureValid.value
  stopListeners()
  gesture.value = null
  if (!current.moved) return
  ignoreNextClick()
  if (valid) persist(current.task, current.slot)
  else error.value = current.overGrid ? 'This time is occupied. The task kept its previous time.' : 'Drop the task inside the planner to save its time.'
}
function cancelGesture() {
  if (gesture.value?.moved) ignoreNextClick()
  stopListeners()
  gesture.value = null
}
function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') cancelGesture()
}
watch(() => props.items.map(task => task.id).join(','), cancelGesture)
onBeforeUnmount(() => { stopListeners(); clearTimeout(clickTimer) })
</script>

<style scoped>
.planning-dialog { width: min(28rem, calc(100vw - 2rem)); max-height: calc(100dvh - 2rem); overflow-y: auto; }
.planning-dialog::backdrop { background: rgb(0 0 0 / 50%); }
.range-time {
  width: 5rem;
  flex-shrink: 0;
  padding: 0.75rem 0.25rem;
  background: transparent;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.range-time:first-child { border-right: 1px solid #e5e7eb; }
.range-time:last-child { border-left: 1px solid #e5e7eb; }
.planner-scroll { scrollbar-gutter: stable; }
.resize-handle { display: flex; justify-content: center; align-items: center; }
.resize-handle span { width: 24px; height: 2px; border-radius: 2px; background: currentColor; opacity: 0.3; }
.task-block:hover .resize-handle span { opacity: 0.7; }
</style>
