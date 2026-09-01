import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyReforgeStats,
  enhanceConfig,
  enhanceEquipment,
  getEnhanceCost,
  getEnhanceStatMultiplier,
  getEnhanceSuccessRate,
  reforgeEquipment
} from '../src/plugins/equipment.js'

test('强化消耗和成功率可以直接展示且有最低成功率', () => {
  assert.equal(enhanceConfig.maxLevel, 20)
  assert.equal(getEnhanceCost(0), 3)
  assert.equal(getEnhanceCost(4), 5)
  assert.equal(getEnhanceCost(19), 11)
  assert.equal(getEnhanceSuccessRate(0), 1)
  assert.equal(getEnhanceSuccessRate(5), 0.95)
  assert.equal(getEnhanceSuccessRate(10), 0.85)
  assert.equal(getEnhanceSuccessRate(19), 0.7)
  assert.equal(getEnhanceSuccessRate(80), 0.7)
})

test('强化可通过固定判定值复现成功与失败', () => {
  const successEquipment = { stats: { attack: 10 }, enhanceLevel: 0 }
  const failedEquipment = { stats: { attack: 10 }, enhanceLevel: 19 }

  assert.equal(enhanceEquipment(successEquipment, 100, 0.5).success, true)
  assert.equal(enhanceEquipment(failedEquipment, 1000, 0.9).success, false)
  assert.deepEqual(failedEquipment.stats, { attack: 10 })
})

test('enhancement growth is based on original stats and capped at 1.8x', () => {
  const equipment = { stats: { attack: 10, critRate: 0.05 }, enhanceLevel: 0 }

  for (let level = 0; level < enhanceConfig.maxLevel; level += 1) {
    const result = enhanceEquipment(equipment, 999, 0)
    assert.equal(result.success, true)
  }

  assert.equal(getEnhanceStatMultiplier(10), 1.5)
  assert.equal(getEnhanceStatMultiplier(20), 1.8)
  assert.deepEqual(equipment.stats, { attack: 18, critRate: 0.09 })
  assert.deepEqual(equipment.enhanceBaseStats, { attack: 10, critRate: 0.05 })
  assert.equal(enhanceEquipment(equipment, 999, 0).success, false)
})

test('legacy enhanced equipment is rebased before applying the new curve', () => {
  const legacy = { stats: { attack: 25.937 }, enhanceLevel: 10 }
  const result = enhanceEquipment(legacy, 999, 0)

  assert.equal(result.success, true)
  assert.ok(Math.abs(legacy.enhanceBaseStats.attack - 10) < 0.01)
  assert.ok(Math.abs(legacy.stats.attack - 15.3) < 0.02)
})

test('confirmed reforging updates the enhancement baseline', () => {
  const equipment = {
    type: 'weapon',
    stats: { attack: 15 },
    enhanceBaseStats: { attack: 10 },
    enhanceLevel: 10
  }
  const originalRandom = Math.random
  const rolls = [0, 0, 0.9, 0.999]
  Math.random = () => rolls.shift() ?? 0.5
  try {
    assert.equal(reforgeEquipment(equipment, 10, true).success, true)
  } finally {
    Math.random = originalRandom
  }

  const reforgedAttack = equipment.stats.attack
  assert.equal(enhanceEquipment(equipment, 999, 0).success, true)
  assert.ok(Math.abs(equipment.stats.attack - reforgedAttack * (1.53 / 1.5)) < 0.02)
})

test('applying a previewed reforge preserves it through the next enhancement', () => {
  const equipment = {
    type: 'weapon',
    stats: { attack: 15 },
    enhanceBaseStats: { attack: 10 },
    enhanceLevel: 10
  }

  applyReforgeStats(equipment, { attack: 18 })
  const result = enhanceEquipment(equipment, 999, 0)

  assert.equal(result.success, true)
  assert.ok(Math.abs(equipment.enhanceBaseStats.attack - 12) < 0.001)
  assert.ok(Math.abs(equipment.stats.attack - 18.36) < 0.02)
})
