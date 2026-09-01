import test from 'node:test'
import assert from 'node:assert/strict'

import { applyResourceSettlement, applySkillReward } from '../src/plugins/rewardRules.js'

test('skill rewards unlock a known technique once and ignore unknown ids', () => {
  const first = applySkillReward({
    skillId: 'thunder_sword_intent',
    unlockedSkills: ['spirit_edge', 'legacy_secret_art'],
    techniqueLevels: { spirit_edge: 2 },
    techniqueFragments: {}
  })
  const duplicate = applySkillReward({
    skillId: 'thunder_sword_intent',
    unlockedSkills: first.unlockedSkills,
    techniqueLevels: first.techniqueLevels,
    techniqueFragments: first.techniqueFragments,
    duplicateFragments: 2
  })
  const unknown = applySkillReward({
    skillId: 'missing_technique',
    unlockedSkills: first.unlockedSkills
  })

  assert.equal(first.unlocked, true)
  assert.equal(first.technique.name, '惊雷剑意')
  assert.deepEqual(first.unlockedSkills, ['spirit_edge', 'legacy_secret_art', 'thunder_sword_intent'])
  assert.deepEqual(first.techniqueLevels, { spirit_edge: 2, thunder_sword_intent: 1 })
  assert.deepEqual(first.techniqueFragments, {})
  assert.equal(duplicate.unlocked, false)
  assert.equal(duplicate.fragmentsGained, 2)
  assert.deepEqual(duplicate.techniqueFragments, { thunder_sword_intent: 2 })
  assert.equal(unknown.valid, false)
  assert.deepEqual(unknown.unlockedSkills, first.unlockedSkills)
})

test('resource settlements sanitize and apply every supported reward in one pass', () => {
  const result = applyResourceSettlement({
    resources: {
      spirit: 10,
      spiritStones: 20,
      reinforceStones: 1,
      refinementStones: 2,
      sectContribution: 30
    },
    reward: {
      spirit: 100,
      spiritStones: 50,
      reinforceStones: 3,
      refinementStones: 4,
      sectContribution: 25
    }
  })

  assert.deepEqual(result.applied, {
    spirit: 100,
    spiritStones: 50,
    reinforceStones: 3,
    refinementStones: 4,
    sectContribution: 25
  })
  assert.deepEqual(result.resources, {
    spirit: 110,
    spiritStones: 70,
    reinforceStones: 4,
    refinementStones: 6,
    sectContribution: 55
  })
})

test('resource settlements ignore unsupported, negative and non-finite rewards', () => {
  const result = applyResourceSettlement({
    resources: { spirit: 5, spiritStones: 6 },
    reward: {
      spirit: -10,
      spiritStones: Infinity,
      reinforceStones: '2.9',
      unknownCurrency: 999
    }
  })

  assert.deepEqual(result.applied, { reinforceStones: 2 })
  assert.deepEqual(result.resources, {
    spirit: 5,
    spiritStones: 6,
    reinforceStones: 2,
    refinementStones: 0,
    sectContribution: 0
  })
})
