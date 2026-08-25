import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateBreakthroughOutcome,
  drawSpiritualRoot,
  normalizeCharacterName
} from '../src/plugins/gameRules.js'

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
