import test from 'node:test'
import assert from 'node:assert/strict'

import {
  claimActivityChest,
  claimSevenDayGoal,
  claimTask,
  createDailyState,
  createSevenDayState,
  getDateKey,
  getRecommendedTask,
  getUnlockedSevenDayCount,
  normalizeDailyState,
  normalizeSevenDayState,
  recordSevenDayEvent,
  recordTaskEvent
} from '../src/plugins/tasks.js'

test('同一天生成稳定的三项任务，跨天会重置', () => {
  const first = createDailyState('2026-08-28')
  const second = createDailyState('2026-08-28')
  const nextDay = createDailyState('2026-08-29')

  assert.deepEqual(first.tasks.map(task => task.id), second.tasks.map(task => task.id))
  assert.notDeepEqual(first.tasks.map(task => task.id), nextDay.tasks.map(task => task.id))
  assert.equal(getDateKey(new Date(2026, 7, 28)), '2026-08-28')
  assert.deepEqual(
    new Set(first.tasks.map(task => task.event)),
    new Set(['cultivation', 'exploration', 'spirit'])
  )
})

test('行为事件只推进匹配任务，并在达成后增加活跃度', () => {
  let state = createDailyState('2026-08-28')
  const cultivation = state.tasks.find(task => task.event === 'cultivation')

  if (!cultivation) {
    state = normalizeDailyState({ ...state, tasks: state.tasks.map(task => ({ ...task, id: 'cultivation' })) }, '2026-08-28')
  }

  state = recordTaskEvent(state, 'cultivation', 2)
  const task = state.tasks.find(item => item.event === 'cultivation')
  assert.equal(task.progress, 2)
  assert.equal(state.activity, 0)

  state = recordTaskEvent(state, 'cultivation')
  assert.equal(task.id, state.tasks.find(item => item.event === 'cultivation').id)
  assert.equal(state.tasks.find(item => item.event === 'cultivation').completed, true)
  assert.equal(state.activity, 1)
})

test('任务和活跃度宝箱只能领取一次', () => {
  let state = createDailyState('2026-08-28')
  const task = state.tasks[0]
  state = recordTaskEvent(state, task.event, task.target)

  const firstClaim = claimTask(state, task.id)
  assert.equal(firstClaim.success, true)
  const secondClaim = claimTask(firstClaim.state, task.id)
  assert.equal(secondClaim.success, false)

  const chest = claimActivityChest(firstClaim.state, 1)
  assert.equal(chest.success, true)
  assert.equal(claimActivityChest(chest.state, 1).success, false)
})

test('推荐优先指向可领取任务，其次指向未完成任务', () => {
  let state = createDailyState('2026-08-28')
  const task = state.tasks[0]
  state = recordTaskEvent(state, task.event, task.target)
  assert.equal(getRecommendedTask(state).id, task.id)

  state = claimTask(state, task.id).state
  assert.notEqual(getRecommendedTask(state).id, task.id)
})

test('七日目标每天开放一项，并保留此前进度', () => {
  let state = createSevenDayState('2026-08-28')
  assert.equal(getUnlockedSevenDayCount(state, '2026-08-28'), 1)
  assert.equal(getUnlockedSevenDayCount(state, '2026-08-31'), 4)

  state = recordSevenDayEvent(state, 'cultivation', 5, '2026-08-28')
  assert.equal(state.goals[0].completed, true)
  assert.equal(state.goals[5].progress, 0)
  assert.equal(normalizeSevenDayState(state, '2026-08-31').goals[0].completed, true)
})

test('七日目标奖励只能领取一次，第七日奖励为非战力解锁', () => {
  let state = createSevenDayState('2026-08-28')
  state = recordSevenDayEvent(state, 'cultivation', 5, '2026-08-28')
  const first = claimSevenDayGoal(state, 1, '2026-08-28')
  assert.equal(first.success, true)
  assert.equal(claimSevenDayGoal(first.state, 1, '2026-08-28').success, false)

  const finalState = {
    ...state,
    goals: state.goals.map(goal => goal.day === 7 ? { ...goal, progress: goal.target, completed: true } : goal)
  }
  const finalClaim = claimSevenDayGoal(finalState, 7, '2026-09-03')
  assert.equal(finalClaim.reward.cosmeticUnlock, '初入仙途')
})
