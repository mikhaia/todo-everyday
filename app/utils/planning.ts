export const PLANNING_STEP = 60

export interface TimeSlot {
  start: number
  end: number
}

export interface TaskSchedule extends TimeSlot {
  date: string
}

export interface PlanningTask {
  id?: string
  title: string
  date: string | null
  done: boolean
  categoryId: string | null
  schedule?: TaskSchedule | null
}

export function validSlot(slot: TimeSlot): boolean {
  return Number.isInteger(slot.start) && Number.isInteger(slot.end)
    && slot.start >= 0 && slot.end <= 1440
    && slot.end - slot.start >= PLANNING_STEP
    && slot.start % PLANNING_STEP === 0 && slot.end % PLANNING_STEP === 0
}

export function taskSlot(task: PlanningTask): TaskSchedule | null {
  const slot = task.schedule
  return slot && slot.date === task.date && validSlot(slot) ? slot : null
}

export function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return a.start < b.end && a.end > b.start
}

export function slotAvailable(slot: TimeSlot, tasks: PlanningTask[], taskId?: string): boolean {
  return validSlot(slot) && !tasks.some(task => {
    const other = taskSlot(task)
    return task.id !== taskId && other && slotsOverlap(slot, other)
  })
}

export function firstFreeSlot(tasks: PlanningTask[], start: number, end: number, duration = 60): TimeSlot | null {
  for (let minute = start; minute + duration <= end; minute += PLANNING_STEP) {
    const slot = { start: minute, end: minute + duration }
    if (slotAvailable(slot, tasks)) return slot
  }
  return null
}

export function formatMinute(minute: number): string {
  return `${Math.floor(minute / 60).toString().padStart(2, '0')}:${(minute % 60).toString().padStart(2, '0')}`
}
