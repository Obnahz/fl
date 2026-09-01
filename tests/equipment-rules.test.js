import test from 'node:test'
import assert from 'node:assert/strict'

import {
  clampCurrentHealth,
  createEquipmentDrop,
  EQUIPMENT_QUALITIES,
  EQUIPMENT_SETS,
  EQUIPMENT_SLOTS,
  compareEquipment,
  getActiveEquipmentSetBonuses,
  getEquipmentScore,
  getEquipmentStatDeltas,
  getEquipmentPityAfter
} from '../src/plugins/equipmentRules.js'

test('equipment score ignores unknown, negative and non-finite affixes', () => {
  const valid = getEquipmentScore({ stats: { attack: 10, critRate: 0.05 } })
  const polluted = getEquipmentScore({
    stats: { attack: 10, critRate: 0.05, imaginaryPower: 999999, defense: -10, health: Infinity }
  })

  assert.equal(polluted, valid)
})

test('equipment score gives comparable value to distinct viable builds', () => {
  const offense = getEquipmentScore({ stats: { attack: 10, critRate: 0.05 } })
  const defense = getEquipmentScore({ stats: { defense: 10, health: 40 } })
  const tempo = getEquipmentScore({ stats: { speed: 8, dodgeRate: 0.2 } })

  assert.ok(Math.max(offense, defense, tempo) / Math.min(offense, defense, tempo) < 1.35)
})

const fixedRolls = {
  slot: 0,
  quality: 0,
  level: 0,
  name: 0,
  set: 0,
  stats: [0, 0, 0]
}

test('历练装备可以通过固定随机值稳定复现', () => {
  const equipment = createEquipmentDrop({
    id: 'drop-1',
    tier: 1,
    playerLevel: 1,
    rolls: fixedRolls
  })

  assert.equal(equipment.id, 'drop-1')
  assert.equal(equipment.type, 'weapon')
  assert.equal(equipment.slot, 'weapon')
  assert.equal(equipment.quality, 'common')
  assert.equal(equipment.level, 1)
  assert.equal(equipment.requiredRealm, 1)
  assert.equal(equipment.qualityInfo.name, '凡品')
  assert.equal(equipment.setId, 'qingfeng')
  assert.deepEqual(Object.keys(equipment.stats), ['attack', 'critRate'])
  assert.ok(Object.values(equipment.stats).every(value => Number.isFinite(value) && value > 0))
})

test('生成的装备只会使用受支持的栏位和品质', () => {
  const equipment = createEquipmentDrop({
    id: 'drop-2',
    tier: 5,
    playerLevel: 37,
    rolls: { slot: 0.999, quality: 0.999, level: 0.999, name: 0.999, stats: [0.5, 0.5, 0.5] }
  })

  assert.ok(EQUIPMENT_SLOTS[equipment.slot])
  assert.ok(EQUIPMENT_QUALITIES[equipment.quality])
  assert.equal(equipment.type, equipment.slot)
  assert.ok(equipment.requiredRealm <= 37)
})

test('相同栏位与词条下高品质装备评分更高', () => {
  const common = createEquipmentDrop({
    id: 'common',
    tier: 1,
    playerLevel: 1,
    rolls: fixedRolls
  })
  const rare = createEquipmentDrop({
    id: 'rare',
    tier: 1,
    playerLevel: 1,
    rolls: { ...fixedRolls, quality: 0.97 }
  })

  assert.equal(rare.quality, 'rare')
  assert.ok(getEquipmentScore(rare) > getEquipmentScore(common))
})

test('最大气血降低时截断当前气血，提高时不免费回血', () => {
  assert.equal(clampCurrentHealth(90, 80), 80)
  assert.equal(clampCurrentHealth(50, 120), 50)
  assert.equal(clampCurrentHealth(-5, 100), 0)
})

test('强化或洗练已穿戴装备时只同步属性差值', () => {
  assert.deepEqual(
    getEquipmentStatDeltas({ attack: 3, health: 10 }, { attack: 5, defense: 2 }),
    { attack: 2, health: -10, defense: 2 }
  )
})

test('装备保底在掉落装备后归零，否则逐次累积', () => {
  assert.equal(getEquipmentPityAfter(0, 'cultivation'), 1)
  assert.equal(getEquipmentPityAfter(7, 'herb'), 8)
  assert.equal(getEquipmentPityAfter(8, 'equipment'), 0)
})

test('装备比较会返回同栏位的战力提升值', () => {
  const weaker = { slot: 'weapon', stats: { attack: 2, critRate: 0.01 } }
  const stronger = { slot: 'weapon', stats: { attack: 4, critRate: 0.03 } }

  assert.deepEqual(compareEquipment(stronger, weaker), {
    currentScore: getEquipmentScore(weaker),
    candidateScore: getEquipmentScore(stronger),
    difference: getEquipmentScore(stronger) - getEquipmentScore(weaker),
    verdict: 'upgrade'
  })
  assert.equal(compareEquipment(stronger, null).verdict, 'new-slot')
})

test('套装加成只在达到两件和四件时生效', () => {
  const piece = slot => ({ id: slot, slot, setId: 'qingfeng', stats: {} })
  assert.deepEqual(getActiveEquipmentSetBonuses({ weapon: piece('weapon') }), {})
  assert.deepEqual(getActiveEquipmentSetBonuses({ weapon: piece('weapon'), hands: piece('hands') }), { attack: 3 })
  assert.deepEqual(
    getActiveEquipmentSetBonuses({
      weapon: piece('weapon'),
      hands: piece('hands'),
      ring1: piece('ring1'),
      artifact: piece('artifact')
    }),
    { attack: 3, critRate: 0.03 }
  )
  assert.equal(EQUIPMENT_SETS.qingfeng.name, '青锋套')
})
