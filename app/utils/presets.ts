export interface PresetTask {
  title: string
  categoryId: string | null
}

export interface Preset {
  id?: string
  title: string
  tasks: PresetTask[]
}

interface DayTask {
  title: string
  categoryId?: string | null
  order?: number
}

const taskKey = (title: string, categoryId: string | null) => `${categoryId ?? ''}\n${title.trim().toLowerCase()}`

/** Trims task titles and drops empty rows before a preset is saved. */
export function cleanPresetTasks(tasks: PresetTask[]): PresetTask[] {
  return tasks
    .map(task => ({ title: (task.title ?? '').trim(), categoryId: task.categoryId || null }))
    .filter(task => task.title)
}

/**
 * The todos a preset adds to a day, in preset order and placed after the day's existing tasks.
 * A task that is already in the day (same title and category, done or not) is skipped, so
 * applying a preset twice does not duplicate it. Deleted categories fall back to "No category".
 */
export function presetTodos(preset: Preset, dayTasks: DayTask[], categoryIds: Iterable<string>) {
  const known = new Set(categoryIds)
  const seen = new Set(dayTasks.map(task => taskKey(task.title, task.categoryId ?? null)))
  let order = Math.max(0, ...dayTasks.map(task => Number(task.order) || 0))
  const todos: (PresetTask & { order: number })[] = []
  let skipped = 0
  for (const task of cleanPresetTasks(preset.tasks ?? [])) {
    const categoryId = task.categoryId && known.has(task.categoryId) ? task.categoryId : null
    const key = taskKey(task.title, categoryId)
    if (seen.has(key)) { skipped++; continue }
    seen.add(key)
    order += 1000
    todos.push({ title: task.title, categoryId, order })
  }
  return { todos, skipped }
}
