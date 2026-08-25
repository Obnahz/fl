import test from 'node:test'
import assert from 'node:assert/strict'

import { TECHNIQUES, getTechniqueAtLevel } from '../src/plugins/techniques.js'
import { locations } from '../src/plugins/locations.js'
import { getBossForLocation, getEnemiesForLocation } from '../src/plugins/enemies.js'
import { createEquipmentDrop, EQUIPMENT_SETS } from '../src/plugins/equipmentRules.js'

test('内容扩充覆盖中后期功法与秘境进度', () => {
  assert.ok(TECHNIQUES.length >= 5)
  assert.equal(getTechniqueAtLevel('ember_meridian_art', 1).style, 'critical_burst')
  assert.equal(getTechniqueAtLevel('void_seal_sword', 5).style, 'armor_break')
  assert.ok(getTechniqueAtLevel('starfall_sutra', 5).damageMultiplier > 2)
  assert.equal(locations.find(location => location.id === 'nether_river').minLevel, 46)
  assert.equal(locations.find(location => location.id === 'star_sea_ruins').minLevel, 55)
})

test('新增秘境拥有独立妖兽与首领功法奖励', () => {
  for (const locationId of ['nether_river', 'star_sea_ruins']) {
    assert.equal(getEnemiesForLocation(locationId).length, 2)
    assert.ok(getBossForLocation(locationId))
    assert.ok(getBossForLocation(locationId).rewards.some(reward => reward.type === 'skill'))
  }
  assert.equal(getBossForLocation('phoenix_valley').rewards[1].skillId, 'ember_meridian_art')
})

test('高阶装备掉落与套装数据可用', () => {
  const drop = createEquipmentDrop({
    id: 'late-game-drop', tier: 7, playerLevel: 55,
    rolls: { slot: 0, quality: 0.999, level: 0.999, name: 0, set: 0.99, stats: [0.5, 0.5, 0.5] }
  })
  assert.ok(Object.values(drop.stats).every(value => Number.isFinite(value) && value > 0))
  assert.ok(EQUIPMENT_SETS.yanling)
  assert.ok(EQUIPMENT_SETS.xingyun)
})
