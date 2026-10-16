import assert from 'node:assert/strict'
import test from 'node:test'
import { cleanPresetTasks, presetTodos } from '../app/utils/presets.ts'

const preset = tasks => ({ title: 'Morning', tasks })

test('saving a preset trims titles, drops empty rows and normalizes "No category"', () => {
  assert.deepEqual(cleanPresetTasks([
    { title: '  Run ', categoryId: 'health' },
    { title: '   ', categoryId: 'health' },
    { title: 'Read', categoryId: '' },
  ]), [{ title: 'Run', categoryId: 'health' }, { title: 'Read', categoryId: null }])
})

test('preset tasks keep their order and categories and go after the day\'s tasks', () => {
  const day = [{ title: 'Existing', categoryId: null, order: 3000 }, { title: 'New', categoryId: null, order: 0 }]
  const { todos, skipped } = presetTodos(preset([
    { title: 'Run', categoryId: 'health' },
    { title: 'Email', categoryId: 'work' },
  ]), day, ['health', 'work'])
  assert.equal(skipped, 0)
  assert.deepEqual(todos, [
    { title: 'Run', categoryId: 'health', order: 4000 },
    { title: 'Email', categoryId: 'work', order: 5000 },
  ])
})

test('tasks already in the day are skipped, even when done or typed differently', () => {
  const day = [{ title: 'run', categoryId: 'health', done: true }]
  const { todos, skipped } = presetTodos(preset([
    { title: 'Run ', categoryId: 'health' },
    { title: 'Run', categoryId: 'work' },
    { title: 'Run', categoryId: 'work' },
  ]), day, ['health', 'work'])
  assert.equal(skipped, 2)
  assert.deepEqual(todos.map(t => [t.title, t.categoryId]), [['Run', 'work']])
})

test('deleted categories fall back to "No category"', () => {
  const { todos } = presetTodos(preset([{ title: 'Stretch', categoryId: 'gone' }]), [], ['health'])
  assert.deepEqual(todos, [{ title: 'Stretch', categoryId: null, order: 1000 }])
})
