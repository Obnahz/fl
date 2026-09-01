import test from 'node:test'
import assert from 'node:assert/strict'

import {
  STAGE_PREPARATION_KEYS,
  createStageGoal,
  getStageGoalProgress,
  getStageStrategy,
  normalizeStageGoal,
  recordStagePreparation,
  restartStageGoal,
  settleStageGoal,
  summarizeStageOutcome
} from '../src/plugins/stageGoals.js'

test('creates a safe breakthrough goal with one slot per existing system', () => {
  const goal = createStageGoal(3, 100)
  assert.equal(goal.kind, 'breakthrough')
  assert.equal(goal.level, 3)
  assert.deepEqual(Object.keys(goal.preparations), STAGE_PREPARATION_KEYS)
  assert.equal(goal.status, 'preparing')
})

test('preparation mix creates distinct breakthrough strategies with explicit tradeoffs', () => {
  let steady = createStageGoal(1, 100)
  steady = recordStagePreparation(steady, 'cultivation', { amount: 3 })
  steady = recordStagePreparation(steady, 'cave', { amount: 2 })
  assert.deepEqual(getStageStrategy(steady), {
    id: 'steady',
    name: '稳修路线',
    chanceBonus: 0.03,
    lossMultiplier: 0.55,
    description: '成功率小幅提高，失败损失显著降低'
  })

  let venture = createStageGoal(1, 100)
  venture = recordStagePreparation(venture, 'exploration', { amount: 3 })
  venture = recordStagePreparation(venture, 'dungeon', { amount: 2 })
  assert.equal(getStageStrategy(venture).id, 'venture')
  assert.ok(getStageStrategy(venture).chanceBonus > getStageStrategy(steady).chanceBonus)
  assert.ok(getStageStrategy(venture).lossMultiplier > getStageStrategy(steady).lossMultiplier)
})

test('repeating one preparation cannot overpower a route built from multiple systems', () => {
  let goal = createStageGoal(1, 100)
  goal = recordStagePreparation(goal, 'cultivation', { amount: 100 })
  goal = recordStagePreparation(goal, 'exploration')
  goal = recordStagePreparation(goal, 'alchemy')

  assert.equal(getStageStrategy(goal).id, 'venture')
})

test('normalizes legacy and corrupted stage goal state', () => {
  const goal = normalizeStageGoal({ level: 'bad', status: 'unknown', preparations: { exploration: 2, extra: 99 }, costs: { exploration: -4 } }, 2, 200)
  assert.equal(goal.level, 2)
  assert.equal(goal.status, 'preparing')
  assert.equal(goal.preparations.exploration, 2)
  assert.equal(goal.costs.exploration, 0)
  assert.equal(goal.preparations.extra, undefined)
})

test('records a preparation as progress, cost, risk, and a readable last action', () => {
  const goal = recordStagePreparation(createStageGoal(1, 100), 'exploration', { amount: 1, cost: 20, risk: 0.3, action: '深入天阙峰' })
  assert.equal(goal.status, 'ready')
  assert.equal(goal.preparations.exploration, 1)
  assert.equal(goal.costs.exploration, 20)
  assert.equal(goal.risks.exploration, 0.3)
  assert.equal(goal.lastAction, '深入天阙峰')
})

test('progress combines cultivation readiness with preparation choices', () => {
  const goal = recordStagePreparation(recordStagePreparation(createStageGoal(1, 100), 'alchemy'), 'equipment')
  assert.equal(getStageGoalProgress(goal, { cultivation: 50, maxCultivation: 100 }), 65)
})

test('settlement is idempotent and preserves a replayable outcome summary', () => {
  const prepared = recordStagePreparation(createStageGoal(1, 100), 'cultivation', { cost: 10 })
  const settled = settleStageGoal(prepared, { success: false, reason: '准备不足', settledAt: 200 })
  const duplicate = settleStageGoal(settled, { success: true, reason: 'ignored', settledAt: 300 })
  assert.deepEqual(duplicate, settled)
  assert.deepEqual(summarizeStageOutcome(settled), {
    success: false,
    reason: '准备不足',
    usedPreparations: ['cultivation'],
    totalCost: 10,
    totalRisk: 0
  })
})

test('restart opens a fresh preparation cycle while preserving the previous outcome', () => {
  const settled = settleStageGoal(
    recordStagePreparation(createStageGoal(1, 100), 'cultivation'),
    { success: false, reason: 'failed', settledAt: 200 }
  )
  const restarted = restartStageGoal(settled, 1, 300)

  assert.equal(restarted.status, 'preparing')
  assert.equal(restarted.preparations.cultivation, 0)
  assert.deepEqual(restarted.lastOutcome, settled.outcome)
})
