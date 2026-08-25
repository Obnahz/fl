import test from 'node:test'
import assert from 'node:assert/strict'

import { validateData } from '../src/plugins/crypto.js'

const validSave = {
  saveVersion: 3,
  name: '青玄道人',
  level: 1,
  realm: '练气一重',
  cultivation: 20,
  maxCultivation: 100,
  spirit: 30,
  currentHealth: 80,
  baseAttributes: { attack: 10, health: 100, defense: 5, speed: 10 },
  items: [],
  herbs: []
}

test('结构完整的存档可以通过校验', () => {
  assert.equal(validateData(validSave), true)
})

test('拒绝非对象与关键嵌套字段为空的存档', () => {
  assert.equal(validateData(null), false)
  assert.equal(validateData({ ...validSave, baseAttributes: null }), false)
})

test('拒绝数字字符串、无限值和负数进度', () => {
  assert.equal(validateData({ ...validSave, level: '1' }), false)
  assert.equal(validateData({ ...validSave, spirit: Infinity }), false)
  assert.equal(validateData({ ...validSave, cultivation: -1 }), false)
})

test('拒绝高于当前游戏版本的存档', () => {
  assert.equal(validateData({ ...validSave, saveVersion: 999 }), false)
})

test('装备保底进度必须是零到八的整数', () => {
  assert.equal(validateData({ ...validSave, saveVersion: 4, equipmentPity: 8 }), true)
  assert.equal(validateData({ ...validSave, saveVersion: 4, equipmentPity: 9 }), false)
  assert.equal(validateData({ ...validSave, saveVersion: 4, equipmentPity: 1.5 }), false)
})

test('已解锁功法必须是字符串 ID 数组', () => {
  assert.equal(validateData({ ...validSave, unlockedSkills: ['spirit_edge'] }), true)
  assert.equal(validateData({ ...validSave, unlockedSkills: 'spirit_edge' }), false)
  assert.equal(validateData({ ...validSave, unlockedSkills: [123] }), false)
})

test('第五版功法养成字段必须使用合法的纯数据结构', () => {
  const progressSave = {
    ...validSave,
    saveVersion: 5,
    unlockedSkills: ['spirit_edge'],
    activeTechniqueId: 'spirit_edge',
    techniqueLevels: { spirit_edge: 2, legacy_secret_art: 1 },
    techniqueFragments: { spirit_edge: 3 }
  }

  assert.equal(validateData(progressSave), true)
  assert.equal(validateData({ ...progressSave, activeTechniqueId: 123 }), false)
  assert.equal(validateData({ ...progressSave, techniqueLevels: { spirit_edge: 0 } }), false)
  assert.equal(validateData({ ...progressSave, techniqueLevels: [] }), false)
  assert.equal(validateData({ ...progressSave, techniqueFragments: { spirit_edge: -1 } }), false)
  assert.equal(validateData({ ...progressSave, techniqueFragments: { spirit_edge: 1.5 } }), false)
})
