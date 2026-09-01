import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  difficultyModifiers,
  getDungeonHighestFloorKey,
  getDungeonRewardMultiplier
} from '../src/plugins/dungeon.js'

const appSource = fs.readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const cultivationSource = fs.readFileSync(new URL('../src/views/Cultivation.vue', import.meta.url), 'utf8')
const achievementsSource = fs.readFileSync(new URL('../src/views/Achievements.vue', import.meta.url), 'utf8')
const playerSource = fs.readFileSync(new URL('../src/stores/player.js', import.meta.url), 'utf8')

test('main navigation exposes every registered player-facing route', () => {
  for (const key of ['achievements', 'alchemy', 'dungeon', 'market']) {
    assert.match(appSource, new RegExp(`key:\\s*['"]${key}['"]`))
  }
  assert.doesNotMatch(appSource, /key:\s*['"]gacha['"]/, '抽卡不应再出现在主导航')
})

test('legacy gacha route redirects to the market', () => {
  const routerSource = fs.readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  assert.ok(routerSource.includes("path: '/gacha', redirect: '/market'"))
})

test('dungeon highest-floor progress uses the selected difficulty bucket', () => {
  assert.equal(getDungeonHighestFloorKey(1), 'dungeonHighestFloor')
  assert.equal(getDungeonHighestFloorKey(2), 'dungeonHighestFloor_2')
  assert.equal(getDungeonHighestFloorKey(3), 'dungeonHighestFloor_5')
  assert.equal(getDungeonHighestFloorKey(4), 'dungeonHighestFloor_10')
  assert.equal(getDungeonHighestFloorKey(5), 'dungeonHighestFloor_100')
})

test('dungeon exposes five continuous difficulty levels with bounded reward growth', () => {
  assert.deepEqual(Object.keys(difficultyModifiers), ['1', '2', '3', '4', '5'])
  assert.deepEqual([1, 2, 3, 4, 5].map(getDungeonRewardMultiplier), [0.8, 1, 1.2, 1.45, 1.75])
})

test('batch cultivation has a single-flight request lock that is released after settlement', () => {
  assert.match(cultivationSource, /isBatchCultivationPending/)
  assert.match(cultivationSource, /if\s*\(isBatchCultivationPending\.value\)/)
  assert.match(cultivationSource, /data\.type\s*===\s*['"]error['"][\s\S]*isBatchCultivationPending\.value\s*=\s*false/)
  assert.match(cultivationSource, /data\.type\s*===\s*['"]success['"][\s\S]*isBatchCultivationPending\.value\s*=\s*false/)
})

test('batch cultivation locks every competing cultivation action while pending', () => {
  const pendingGuardCount = (cultivationSource.match(/isBatchCultivationPending\.value/g) || []).length
  assert.ok(pendingGuardCount >= 6, 'manual, auto, breakthrough and batch paths should all observe the pending lock')
  assert.match(cultivationSource, /:disabled="[^"]*isBatchCultivationPending/)
  assert.match(cultivationSource, /const cultivate = \(\) => \{\s*if \(isBatchCultivationPending\.value\) return/)
  assert.match(cultivationSource, /const toggleAutoCultivation = \(\) => \{\s*if \(isBatchCultivationPending\.value\) return/)
  assert.match(cultivationSource, /const attemptBreakthrough = \(\) => \{\s*if \(isBatchCultivationPending\.value\) return/)
})

test('manual cultivation uses the shared progression curve', () => {
  assert.match(cultivationSource, /getCultivationCost\(playerStore\.level, playerStore\.maxCultivation\)/)
  assert.match(cultivationSource, /getCultivationGain\(playerStore\.level, playerStore\.maxCultivation\)/)
  assert.doesNotMatch(cultivationSource, /Math\.pow\(1\.5, playerStore\.level/)
  assert.doesNotMatch(cultivationSource, /Math\.pow\(1\.2, playerStore\.level/)
})

test('achievements category setup defines helpers before using them', () => {
  const categoriesIndex = achievementsSource.indexOf('const achievementCategories')
  const helperIndex = achievementsSource.indexOf('const getCategoryName')
  assert.ok(categoriesIndex >= 0 && helperIndex >= 0)
  assert.ok(helperIndex < categoriesIndex, 'getCategoryName must be initialized before achievementCategories')
})

test('alchemy and equipment actions contribute to the shared stage preparation', () => {
  assert.match(playerSource, /recordStagePreparation\('alchemy',[\s\S]*alchemy:/)
  assert.match(playerSource, /equipArtifact\(artifact, slot\)[\s\S]*recordStagePreparation\('equipment'/)
})

test('ordinary saves do not discard unsettled cave production time', () => {
  const start = playerSource.indexOf('async saveData(')
  const end = playerSource.indexOf('// 导出存档数据', start)
  assert.ok(start >= 0 && end > start)
  assert.doesNotMatch(playerSource.slice(start, end), /lastSettledAt:\s*this\.lastActiveAt/)
})

test('failed sect challenges still spend their cost and enter commission cooldown', () => {
  const start = playerSource.indexOf('startSectCommission(commissionId')
  const end = playerSource.indexOf('claimSectCommission(commissionId', start)
  assert.ok(start >= 0 && end > start)
  const source = playerSource.slice(start, end)
  const costIndex = source.indexOf('this.payResourceCost(result.cost)')
  const stateIndex = source.indexOf('this.sectOperationsState = result.state')
  const combatIndex = source.indexOf('resolveAutoCombat')
  const failedIndex = source.indexOf("combat.outcome !== 'victory'")

  assert.ok(costIndex >= 0 && costIndex < combatIndex)
  assert.ok(stateIndex >= 0 && stateIndex < failedIndex)
})
