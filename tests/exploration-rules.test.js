import test from 'node:test'
import assert from 'node:assert/strict'

import { calculateRecovery, resolveExploration } from '../src/plugins/explorationRules.js'

const location = {
  id: 'test_valley',
  tier: 1,
  spiritCost: 20,
  dangerChance: 0.2,
  damagePercent: [0.1, 0.2],
  rewards: [
    { type: 'spirit_stone', chance: 0.6, amount: [2, 4] },
    { type: 'cultivation', chance: 0.4, amount: [5, 8] }
  ]
}

const player = {
  name: '测试修士',
  luck: 1,
  spirit: 100,
  currentHealth: 100,
  maxHealth: 100,
  defense: 0,
  baseAttributes: { attack: 10, defense: 0, health: 100, speed: 10 },
  combatAttributes: { critRate: 0, dodgeRate: 0 },
  setBonuses: {}
}

test('妖兽伏击会结算一场确定性的自动战斗', () => {
  const result = resolveExploration({
    location: { ...location, id: 'newbie_village' },
    player,
    rolls: {
      danger: 0.1,
      dangerType: 0,
      enemy: 0,
      combat: Array.from({ length: 16 }, () => ({ dodge: 0.9, crit: 0.9, variance: 0.5 }))
    }
  })

  assert.equal(result.kind, 'combat')
  assert.equal(result.enemy.id, 'mist_rat')
  assert.equal(result.outcome, 'victory')
  assert.ok(result.playerHealthAfter < player.currentHealth)
  assert.deepEqual(result.rewards, [{ type: 'spirit_stone', amount: 2 }])
})

test('防御会降低历练伤害但不会降为零', () => {
  const result = resolveExploration({
    location,
    player: { ...player, defense: 100 },
    rolls: { danger: 0.1, dangerType: 0.9, amount: 1 }
  })

  assert.equal(result.damage, 10)
})

test('未遇险且未触发机缘时按地点权重发放奖励', () => {
  const result = resolveExploration({
    location,
    player,
    rolls: { danger: 0.9, special: 0.9, reward: 0.2, amount: 0.5, bonus: 0.9 }
  })

  assert.equal(result.kind, 'reward')
  assert.deepEqual(result.reward, { type: 'spirit_stone', amount: 3 })
})

test('机缘判定会从固定事件表中选择事件', () => {
  const result = resolveExploration({
    location,
    player,
    rolls: { danger: 0.9, special: 0.01, specialType: 0, amount: 0.5 }
  })

  assert.equal(result.kind, 'special')
  assert.equal(result.eventId, 'ancient_tablet')
  assert.equal(result.reward.type, 'cultivation')
  assert.deepEqual(result.bonusReward, { type: 'technique_fragment', techniqueId: 'spirit_edge', amount: 2 })
})

test('调息按最大生命恢复且不会溢出', () => {
  assert.deepEqual(calculateRecovery({ currentHealth: 20, maxHealth: 100 }), { heal: 35, healthAfter: 55 })
  assert.deepEqual(calculateRecovery({ currentHealth: 90, maxHealth: 100 }), { heal: 10, healthAfter: 100 })
})

test('装备奖励会携带地点阶位供主线程生成掉落', () => {
  const result = resolveExploration({
    location: {
      ...location,
      tier: 3,
      rewards: [{ type: 'equipment', chance: 1, amount: [1, 1] }]
    },
    player,
    rolls: { danger: 0.9, special: 0.9, reward: 0, amount: 0, bonus: 0.9 }
  })

  assert.deepEqual(result.reward, { type: 'equipment', amount: 1, tier: 3 })
})

test('连续八次普通收获未获装备后下一次普通收获触发保底', () => {
  const result = resolveExploration({
    location,
    player: { ...player, equipmentPity: 8 },
    rolls: { danger: 0.9, special: 0.9, reward: 0, amount: 0, bonus: 0 }
  })

  assert.equal(result.kind, 'reward')
  assert.deepEqual(result.reward, { type: 'equipment', amount: 1, tier: 1 })
  assert.equal(result.guaranteed, true)
  assert.equal(result.equipmentPityAfter, 0)
})

test('危险不会推进保底而普通非装备奖励会推进', () => {
  const danger = resolveExploration({
    location,
    player: { ...player, equipmentPity: 2 },
    rolls: { danger: 0, dangerType: 0.9, amount: 0 }
  })
  const reward = resolveExploration({
    location,
    player: { ...player, equipmentPity: 2 },
    rolls: { danger: 0.9, special: 0.9, reward: 0, amount: 0, bonus: 0.9 }
  })

  assert.equal(danger.equipmentPityAfter, 2)
  assert.equal(reward.equipmentPityAfter, 3)
})

test('explicit boss roll selects a high-tier boss and keeps its skill reward on victory', () => {
  const result = resolveExploration({
    location: {
      ...location,
      id: 'dragon_abyss',
      tier: 4,
      dangerChance: 1
    },
    player: {
      ...player,
      currentHealth: 1000,
      maxHealth: 1000,
      baseAttributes: { attack: 999, defense: 0, health: 1000, speed: 999 }
    },
    rolls: {
      danger: 0,
      dangerType: 0,
      enemy: 0.5,
      boss: 0,
      combat: [{ dodge: 0.9, crit: 0.9, variance: 0.5 }]
    }
  })

  assert.equal(result.kind, 'combat')
  assert.equal(result.enemy.type, 'boss')
  assert.equal(result.outcome, 'victory')
  assert.ok(result.rewards.some(reward => reward.type === 'skill' && reward.skillId))
})
