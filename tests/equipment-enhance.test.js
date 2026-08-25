import test from 'node:test'
import assert from 'node:assert/strict'

import { enhanceEquipment, getEnhanceCost, getEnhanceSuccessRate } from '../src/plugins/equipment.js'

test('强化消耗和成功率可以直接展示且有最低成功率', () => {
  assert.equal(getEnhanceCost(0), 10)
  assert.equal(getEnhanceCost(4), 50)
  assert.equal(getEnhanceSuccessRate(0), 1)
  assert.equal(getEnhanceSuccessRate(19), 0.05)
  assert.equal(getEnhanceSuccessRate(80), 0.05)
})

test('强化可通过固定判定值复现成功与失败', () => {
  const successEquipment = { stats: { attack: 10 }, enhanceLevel: 0 }
  const failedEquipment = { stats: { attack: 10 }, enhanceLevel: 19 }

  assert.equal(enhanceEquipment(successEquipment, 100, 0.5).success, true)
  assert.equal(enhanceEquipment(failedEquipment, 1000, 0.9).success, false)
  assert.deepEqual(failedEquipment.stats, { attack: 10 })
})
