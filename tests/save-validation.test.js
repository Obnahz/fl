import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { validateData, encryptCompactData, decryptCompactData } from '../src/plugins/crypto.js'
import { MAX_EXPORT_SAVE_BYTES, MAX_SAVE_BYTES } from '../src/plugins/saveLimits.js'

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

test('旧存档导入仍支持 8 MB，新导出限制为 1 MB', () => {
  assert.equal(MAX_SAVE_BYTES, 8 * 1024 * 1024)
  assert.equal(MAX_EXPORT_SAVE_BYTES, 1024 * 1024)
})

test('导入界面保留旧版 8 MB 存档兼容性', () => {
  const settingsSource = fs.readFileSync(new URL('../src/views/Settings.vue', import.meta.url), 'utf8')
  assert.match(settingsSource, /MAX_SAVE_BYTES/)
  assert.doesNotMatch(settingsSource, /file\.size\s*>\s*1024\s*\*\s*1024/)
})

test('紧凑存档压缩加密后可无损还原', async () => {
  const source = {
    ...validSave,
    items: Array.from({ length: 1200 }, (_, index) => ({ id: `item_${index % 20}`, name: '重复装备名称', stats: { attack: 10, defense: 5 } })),
    dailyState: { history: Array.from({ length: 500 }, () => ({ status: 'settled', action: 'cultivation' })) }
  }
  const encoded = await encryptCompactData(source)
  assert.ok(encoded.startsWith('XJ2C:'))
  assert.deepEqual(await decryptCompactData(encoded), source)
  assert.ok(new Blob([encoded]).size < JSON.stringify(source).length)
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

test('第六版每日任务字段可以安全校验，旧存档仍可省略该字段', () => {
  assert.equal(validateData({ ...validSave, saveVersion: 6 }), true)
  assert.equal(validateData({ ...validSave, saveVersion: 10 }), false)
  assert.equal(validateData({ ...validSave, dailyState: null }), true)
})

test('第七版宗门字段允许旧存档迁移并拒绝未来版本', () => {
  assert.equal(validateData({ ...validSave, saveVersion: 7 }), true)
  assert.equal(validateData({ ...validSave, saveVersion: 10 }), false)
})

test('第八版宗门委托字段可进入迁移流程并拒绝未来版本', () => {
  assert.equal(validateData({ ...validSave, saveVersion: 8 }), true)
  assert.equal(validateData({ ...validSave, saveVersion: 10 }), false)
})

test('第九版洞府值守字段可进入迁移流程并拒绝未来版本', () => {
  assert.equal(validateData({ ...validSave, saveVersion: 9 }), true)
  assert.equal(validateData({ ...validSave, saveVersion: 10 }), false)
})
