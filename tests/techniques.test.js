import test from 'node:test'
import assert from 'node:assert/strict'

import {
  TECHNIQUES,
  STARTER_TECHNIQUE_ID,
  applyTechniqueUpgrade,
  getTechniqueById,
  getTechniqueAtLevel,
  getTechniqueUpgradeCost,
  grantTechniqueFragments,
  normalizeStoredSkillIds,
  normalizeUnlockedTechniques,
  selectTechniqueForCombat
} from '../src/plugins/techniques.js'

test('technique catalog has stable unique ids and combat metadata', () => {
  assert.ok(TECHNIQUES.length >= 5)
  assert.equal(new Set(TECHNIQUES.map(technique => technique.id)).size, TECHNIQUES.length)

  for (const technique of TECHNIQUES) {
    assert.equal(getTechniqueById(technique.id), technique)
    assert.equal(typeof technique.name, 'string')
    assert.ok(technique.name.length > 0)
    assert.ok(technique.damageMultiplier > 1)
    assert.ok(Number.isInteger(technique.cooldownRounds))
    assert.ok(technique.cooldownRounds >= 1)
    assert.ok(Number.isInteger(technique.maxLevel))
    assert.ok(technique.maxLevel >= 2)
    assert.ok(Number.isInteger(technique.duplicateFragments))
    assert.ok(technique.duplicateFragments > 0)
  }
})

test('mid and late game techniques are available with distinct combat styles', () => {
  assert.equal(getTechniqueById('ember_meridian_art').style, 'critical_burst')
  assert.equal(getTechniqueById('void_seal_sword').style, 'armor_break')
  assert.equal(getTechniqueById('starfall_sutra').style, 'critical_burst')
  assert.ok(getTechniqueAtLevel('starfall_sutra', 5).damageMultiplier > getTechniqueAtLevel('thunder_sword_intent', 5).damageMultiplier)
})

test('combat technique selection follows catalog priority and ignores invalid unlocks', () => {
  const [first, second] = TECHNIQUES

  assert.equal(
    selectTechniqueForCombat(['missing_technique', second.id, first.id, second.id]).id,
    first.id
  )
  assert.equal(selectTechniqueForCombat([second.id]).id, second.id)
  assert.equal(selectTechniqueForCombat(['missing_technique']).id, STARTER_TECHNIQUE_ID)
  assert.equal(selectTechniqueForCombat(), null)
})

test('combat technique selection honors an unlocked active id and falls back safely', () => {
  const [first, second] = TECHNIQUES

  assert.equal(selectTechniqueForCombat([first.id, second.id], second.id).id, second.id)
  assert.equal(selectTechniqueForCombat([first.id], second.id).id, first.id)
  assert.equal(
    selectTechniqueForCombat(['legacy_secret_art'], 'legacy_secret_art').id,
    STARTER_TECHNIQUE_ID
  )
})

test('technique combat multiplier grows by level and clamps at max level', () => {
  const technique = TECHNIQUES[0]
  const levelOne = getTechniqueAtLevel(technique.id, 1)
  const levelTwo = getTechniqueAtLevel(technique.id, 2)
  const capped = getTechniqueAtLevel(technique.id, technique.maxLevel + 99)

  assert.equal(levelOne.level, 1)
  assert.ok(levelTwo.damageMultiplier > levelOne.damageMultiplier)
  assert.equal(capped.level, technique.maxLevel)
  assert.equal(capped.damageMultiplier, getTechniqueAtLevel(technique.id, technique.maxLevel).damageMultiplier)
})

test('technique style effects scale by level without adding save fields', () => {
  const spiritEdgeLevelOne = getTechniqueAtLevel('spirit_edge', 1)
  const spiritEdgeMax = getTechniqueAtLevel('spirit_edge', 5)
  const thunderLevelOne = getTechniqueAtLevel('thunder_sword_intent', 1)
  const thunderMax = getTechniqueAtLevel('thunder_sword_intent', 5)

  assert.equal(spiritEdgeLevelOne.style, 'armor_break')
  assert.equal(spiritEdgeLevelOne.armorPenetration, 0.35)
  assert.equal(spiritEdgeMax.armorPenetration, 0.55)
  assert.equal(thunderLevelOne.style, 'critical_burst')
  assert.equal(thunderLevelOne.critRateBonus, 0.12)
  assert.equal(thunderMax.critRateBonus, 0.24)
})

test('technique upgrades consume the full cost atomically', () => {
  const technique = TECHNIQUES[0]
  const cost = getTechniqueUpgradeCost(technique.id, 1)
  const levels = { [technique.id]: 1, legacy_secret_art: 4 }
  const fragments = { [technique.id]: cost, legacy_secret_art: 7 }

  const result = applyTechniqueUpgrade({
    techniqueId: technique.id,
    techniqueLevels: levels,
    techniqueFragments: fragments
  })

  assert.equal(result.valid, true)
  assert.equal(result.upgraded, true)
  assert.equal(result.level, 2)
  assert.equal(result.techniqueLevels[technique.id], 2)
  assert.equal(result.techniqueFragments[technique.id], 0)
  assert.equal(result.techniqueLevels.legacy_secret_art, 4)
  assert.equal(result.techniqueFragments.legacy_secret_art, 7)
  assert.deepEqual(levels, { [technique.id]: 1, legacy_secret_art: 4 })
  assert.deepEqual(fragments, { [technique.id]: cost, legacy_secret_art: 7 })
})

test('technique upgrades leave progress unchanged when fragments are insufficient or level is capped', () => {
  const technique = TECHNIQUES[0]
  const cost = getTechniqueUpgradeCost(technique.id, 1)
  const insufficient = applyTechniqueUpgrade({
    techniqueId: technique.id,
    techniqueLevels: { [technique.id]: 1 },
    techniqueFragments: { [technique.id]: cost - 1 }
  })
  const capped = applyTechniqueUpgrade({
    techniqueId: technique.id,
    techniqueLevels: { [technique.id]: technique.maxLevel },
    techniqueFragments: { [technique.id]: 999 }
  })

  assert.equal(insufficient.valid, true)
  assert.equal(insufficient.upgraded, false)
  assert.equal(insufficient.techniqueLevels[technique.id], 1)
  assert.equal(insufficient.techniqueFragments[technique.id], cost - 1)
  assert.equal(capped.valid, true)
  assert.equal(capped.upgraded, false)
  assert.equal(capped.techniqueLevels[technique.id], technique.maxLevel)
  assert.equal(capped.techniqueFragments[technique.id], 999)
})

test('saved technique ids are normalized to known unique ids', () => {
  const validId = TECHNIQUES[0].id
  assert.deepEqual(normalizeUnlockedTechniques([validId, validId, 'missing_technique', 123]), [validId])
  assert.deepEqual(normalizeUnlockedTechniques('not-an-array'), [])
})

test('stored skill ids preserve unknown strings for forward compatibility', () => {
  assert.deepEqual(
    normalizeStoredSkillIds(['spirit_edge', 'legacy_secret_art', 'legacy_secret_art', 123]),
    ['spirit_edge', 'legacy_secret_art']
  )
})

test('fragment grants add known technique fragments without mutating existing progress', () => {
  const existing = { spirit_edge: 1, legacy_secret_art: 7 }
  const result = grantTechniqueFragments({
    techniqueId: 'spirit_edge',
    amount: 2,
    techniqueFragments: existing
  })

  assert.equal(result.valid, true)
  assert.equal(result.gained, 2)
  assert.deepEqual(result.techniqueFragments, { spirit_edge: 3, legacy_secret_art: 7 })
  assert.deepEqual(existing, { spirit_edge: 1, legacy_secret_art: 7 })
  assert.equal(grantTechniqueFragments({ techniqueId: 'missing', amount: 2 }).valid, false)
})
