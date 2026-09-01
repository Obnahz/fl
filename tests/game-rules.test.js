import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateCultivationBatch,
  calculateEffectiveProgressionRates,
  calculateBreakthroughOutcome,
  drawSpiritualRoot,
  getCultivationCost,
  getCultivationGain,
  normalizeCharacterName
} from '../src/plugins/gameRules.js'
import { calculatePillEffect, getActivePillBonuses, pillRecipes, tryCreatePill } from '../src/plugins/pills.js'
import {
  getRealmAttributeDelta,
  getRealmBaseAttributes,
  migrateRealmAttributes
} from '../src/plugins/realm.js'

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
  assert.equal(result.totalCost, 1040)
  assert.equal(result.rawCultivationGain, 80)
  assert.equal(result.cultivationGain, 100)
  assert.equal(result.doubleGainTimes, 0)
})

test('修炼消耗与收益随境界平滑成长而不会指数断档', () => {
  const earlyCost = getCultivationCost(9, 900)
  const nextRealmCost = getCultivationCost(10, 1000)
  const lateCost = getCultivationCost(90, 16_000_000)

  assert.ok(nextRealmCost > earlyCost)
  assert.ok(nextRealmCost / earlyCost < 1.25)
  assert.ok(lateCost < 2_000)
  assert.ok(getCultivationGain(90, 16_000_000) > getCultivationGain(10, 1000))
})

test('境界成长提供稳定基础属性并可按等级差量迁移旧存档', () => {
  const first = getRealmBaseAttributes(1)
  const foundation = getRealmBaseAttributes(10)
  const delta = getRealmAttributeDelta(1, 10)

  assert.deepEqual(first, { attack: 10, health: 100, defense: 5, speed: 10 })
  assert.ok(foundation.attack >= 30)
  assert.ok(foundation.health >= 250)
  assert.deepEqual(delta, {
    attack: foundation.attack - first.attack,
    health: foundation.health - first.health,
    defense: foundation.defense - first.defense,
    speed: foundation.speed - first.speed
  })
})

test('40级旧存档只迁移一次境界属性并保留零生命状态', () => {
  const legacyAttributes = { attack: 154, health: 830, defense: 168, speed: 85 }
  const first = migrateRealmAttributes({
    baseAttributes: legacyAttributes,
    defaultAttributes: getRealmBaseAttributes(1),
    currentHealth: 0,
    fromLevel: 1,
    toLevel: 40
  })
  const second = migrateRealmAttributes({
    baseAttributes: first.baseAttributes,
    defaultAttributes: getRealmBaseAttributes(1),
    currentHealth: first.currentHealth,
    fromLevel: 40,
    toLevel: 40
  })

  assert.deepEqual(first.baseAttributes, {
    attack: 264,
    health: 1655,
    defense: 223,
    speed: 112
  })
  assert.equal(first.currentHealth, 0)
  assert.deepEqual(second, first)
})

test('最终吐纳和修炼倍率组合宗门、装备与未过期丹药并执行上限', () => {
  const now = 10_000
  const rates = calculateEffectiveProgressionRates({
    spiritRate: 1.2,
    cultivationRate: 1.1,
    level: 10,
    sectBonuses: { spiritRate: 1.1, cultivationRate: 1.2 },
    equipmentBonuses: { spiritRate: 1.25, cultivationRate: 1.3 },
    activeEffects: [
      { type: 'spiritRate', value: 0.5, endTime: now + 1 },
      { type: 'cultivationRate', value: 0.6, endTime: now + 1 },
      { type: 'cultivationEfficiency', value: 0.4, endTime: now + 1 },
      { type: 'spiritRate', value: 99, endTime: now - 1 }
    ],
    now
  })

  assert.ok(rates.spiritRate > 2)
  assert.ok(rates.cultivationRate > 3)
  assert.ok(rates.spiritRate <= 8)
  assert.ok(rates.cultivationRate <= 5)
})

test('丹药效果、有效期和炼制概率都有明确边界', () => {
  const recipe = pillRecipes.find(item => item.id === 'celestial_essence_pill')
  const effect = calculatePillEffect(recipe, 999)
  const now = 20_000
  const bonuses = getActivePillBonuses([
    { type: 'cultivationRate', value: effect.value, endTime: now + 1 },
    { type: 'cultivationRate', value: 999, endTime: now - 1 }
  ], now)
  const herbs = recipe.materials.flatMap(material =>
    Array.from({ length: material.count }, () => ({ id: material.herb }))
  )
  const player = { pillRecipes: [recipe.id] }

  assert.ok(effect.value <= 1.5)
  assert.equal(bonuses.cultivationRate, effect.value)
  assert.equal(tryCreatePill(recipe, herbs, player, 0, 999, 0.96).success, false)
  assert.equal(tryCreatePill(recipe, herbs, player, 0, 999, 0.94).success, true)
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
