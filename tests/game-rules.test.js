import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateCultivationBatch,
  calculateBreakthroughOutcome,
  drawSpiritualRoot,
  normalizeCharacterName
} from '../src/plugins/gameRules.js'

test('批量修炼会按有效倍率只计算一次并支持固定随机值', () => {
  const result = calculateCultivationBatch({
    level: 2,
    spirit: 1200,
    cultivation: 0,
    maxCultivation: 100,
    luck: 1,
    effectiveCultivationRate: 1.25,
    rolls: Array(80).fill(0.99)
  })

  assert.equal(result.valid, true)
  assert.equal(result.times, 80)
  assert.equal(result.totalCost, 1200)
  assert.equal(result.rawCultivationGain, 80)
  assert.equal(result.cultivationGain, 100)
  assert.equal(result.doubleGainTimes, 0)
})

test('批量修炼在灵力差一点时返回可读的不足结果且不产生收益', () => {
  const result = calculateCultivationBatch({
    level: 1,
    spirit: 99,
    cultivation: 0,
    maxCultivation: 100,
    luck: 1,
    effectiveCultivationRate: 1,
    rolls: []
  })

  assert.equal(result.valid, false)
  assert.equal(result.times, 100)
  assert.equal(result.totalCost, 1000)
  assert.equal(result.rawCultivationGain, 0)
  assert.equal(result.cultivationGain, 0)
})

test('道号会去除首尾空格并限制为 2 到 8 个字符', () => {
  assert.equal(normalizeCharacterName('  青玄  '), '青玄')
  assert.throws(() => normalizeCharacterName('玄'), /2 到 8/)
  assert.throws(() => normalizeCharacterName('一二三四五六七八九'), /2 到 8/)
})

test('灵根抽取可通过固定随机值稳定复现', () => {
  assert.equal(drawSpiritualRoot(0).id, 'metal')
  assert.equal(drawSpiritualRoot(0.99).id, 'earth')
})

test('修为不足时不能突破', () => {
  const result = calculateBreakthroughOutcome({
    level: 1,
    luck: 1,
    cultivation: 99,
    maxCultivation: 100,
    roll: 0
  })

  assert.equal(result.ready, false)
  assert.equal(result.cultivationAfter, 99)
})

test('突破成功时保留溢出的修为', () => {
  const result = calculateBreakthroughOutcome({
    level: 1,
    luck: 1,
    cultivation: 120,
    maxCultivation: 100,
    roll: 0.2
  })

  assert.equal(result.ready, true)
  assert.equal(result.success, true)
  assert.equal(result.cultivationAfter, 20)
})

test('突破失败会损失当前境界上限的 20% 修为', () => {
  const result = calculateBreakthroughOutcome({
    level: 1,
    luck: 1,
    cultivation: 100,
    maxCultivation: 100,
    roll: 0.99
  })

  assert.equal(result.ready, true)
  assert.equal(result.success, false)
  assert.equal(result.loss, 20)
  assert.equal(result.cultivationAfter, 80)
})

test('stage preparation chance bonus can turn the same breakthrough roll into success', () => {
  const base = calculateBreakthroughOutcome({
    level: 1,
    luck: 1,
    cultivation: 100,
    maxCultivation: 100,
    roll: 0.9
  })
  const prepared = calculateBreakthroughOutcome({
    level: 1,
    luck: 1,
    cultivation: 100,
    maxCultivation: 100,
    roll: 0.9,
    chanceBonus: 0.09
  })

  assert.equal(base.success, false)
  assert.equal(prepared.success, true)
  assert.equal(prepared.chance, 0.94)
})

test('stage preparation loss multiplier changes failure cost without changing the default', () => {
  const protectedFailure = calculateBreakthroughOutcome({
    level: 1,
    luck: 1,
    cultivation: 100,
    maxCultivation: 100,
    roll: 0.99,
    lossMultiplier: 0.55
  })
  const riskyFailure = calculateBreakthroughOutcome({
    level: 1,
    luck: 1,
    cultivation: 100,
    maxCultivation: 100,
    roll: 0.99,
    lossMultiplier: 1.25
  })

  assert.equal(protectedFailure.loss, 11)
  assert.equal(riskyFailure.loss, 25)
})
