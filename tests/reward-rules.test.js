import test from 'node:test'
import assert from 'node:assert/strict'

import { applySkillReward } from '../src/plugins/rewardRules.js'

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
