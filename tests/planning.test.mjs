import assert from 'node:assert/strict'
import test from 'node:test'
import { firstFreeSlot, formatMinute, slotAvailable, slotsOverlap, taskSlot, validSlot } from '../app/utils/planning.ts'

const task = (id, start, end, categoryId = 'work') => ({
  id, title: id, date: '2026-09-10', done: false, categoryId,
  schedule: { date: '2026-09-10', start, end },
})

test('only whole-hour slots of at least one hour within the day are valid', () => {
  assert.equal(validSlot({ start: 0, end: 1440 }), true)
  assert.equal(validSlot({ start: 1380, end: 1440 }), true)
  for (const slot of [
    { start: 420, end: 450 }, { start: 435, end: 495 },
    { start: 420, end: 420 }, { start: 480, end: 420 },
    { start: -60, end: 60 }, { start: 1380, end: 1500 },
    { start: NaN, end: 480 }, { start: '420', end: 480 },
  ]) assert.equal(validSlot(slot), false)
})

test('adjacent tasks are allowed; partial and enclosing overlaps are rejected', () => {
  const occupied = { start: 480, end: 600 }
  assert.equal(slotsOverlap({ start: 420, end: 480 }, occupied), false)
  assert.equal(slotsOverlap({ start: 600, end: 660 }, occupied), false)
  assert.equal(slotsOverlap({ start: 420, end: 540 }, occupied), true)
  assert.equal(slotsOverlap({ start: 540, end: 660 }, occupied), true)
  assert.equal(slotsOverlap({ start: 420, end: 660 }, occupied), true)
  assert.equal(slotsOverlap(occupied, occupied), true)
})

test('moving and resizing ignores only the task itself, including completed and other-category tasks', () => {
  const tasks = [task('a', 420, 480), { ...task('b', 600, 720, 'personal'), done: true }]
  assert.equal(slotAvailable({ start: 480, end: 600 }, tasks, 'a'), true)
  assert.equal(slotAvailable({ start: 420, end: 600 }, tasks, 'a'), true)
  assert.equal(slotAvailable({ start: 420, end: 660 }, tasks, 'a'), false)
  assert.equal(slotAvailable({ start: 660, end: 720 }, tasks, 'a'), false)
})

test('legacy tasks and schedules belonging to a different date are unplanned', () => {
  assert.equal(taskSlot({ ...task('a', 420, 480), schedule: undefined }), null)
  assert.equal(taskSlot({ ...task('a', 420, 480), date: '2026-09-11' }), null)
  assert.equal(taskSlot({ ...task('a', 420, 480), date: null }), null)
  assert.equal(taskSlot(task('a', 420, 450)), null)
})

test('first free slot respects occupied times, range limits, and full days', () => {
  assert.deepEqual(firstFreeSlot([task('a', 420, 540), task('b', 600, 660)], 420, 1380), { start: 540, end: 600 })
  assert.equal(firstFreeSlot([task('a', 420, 1380)], 420, 1380), null)
  assert.deepEqual(firstFreeSlot([], 1380, 1440), { start: 1380, end: 1440 })
})

test('time labels include midnight and the exclusive day boundary', () => {
  assert.equal(formatMinute(0), '00:00')
  assert.equal(formatMinute(420), '07:00')
  assert.equal(formatMinute(1440), '24:00')
})
