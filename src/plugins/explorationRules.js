import { buildDungeonPlayerCombatant, resolveAutoCombat } from './combatRules.js'
import { selectEnemyForLocation } from './enemies.js'
import { EQUIPMENT_PITY_LIMIT, getEquipmentPityAfter } from './equipmentRules.js'
import { STARTER_TECHNIQUE_ID, selectTechniqueForCombat } from './techniques.js'

export const SPECIAL_EXPLORATION_EVENTS = [
  {
    id: 'ancient_tablet',
    name: '古碑悟道',
    description: '山壁古碑残留着前人道韵。',
    rewardType: 'cultivation',
    amountPerTier: [12, 24],
    fragmentTechniqueId: STARTER_TECHNIQUE_ID,
    fragmentAmountPerTier: [1, 2]
  },
  {
    id: 'spirit_spring',
    name: '灵泉洗脉',
    description: '一眼灵泉洗去疲惫，灵台重归清明。',
    rewardType: 'spirit',
    amountPerTier: [25, 45],
    healPercent: 0.18
  },
  {
    id: 'hidden_cache',
    name: '前人遗藏',
    description: '枯树石缝间藏着一只无主储物袋。',
    rewardType: 'spirit_stone',
    amountPerTier: [5, 12]
  },
  {
    id: 'herb_garden',
    name: '隐秘药圃',
    description: '雾气散去，显露出一片无人采撷的药圃。',
    rewardType: 'herb',
    amountPerTier: [1, 3]
  }
]

const clampRoll = value => (Number.isFinite(value) ? Math.min(0.999999, Math.max(0, value)) : Math.random())

const amountFromRange = (range, roll) => {
  const [min, max] = range
  return Math.floor(min + clampRoll(roll) * (max - min + 1))
}

const selectReward = (rewards, roll) => {
  const value = clampRoll(roll)
  let cumulative = 0
  for (const reward of rewards) {
    cumulative += reward.chance
    if (value < cumulative) return reward
  }
  return rewards.at(-1)
}

export const calculateRecovery = ({ currentHealth, maxHealth }) => {
  const maximum = Math.max(1, Number(maxHealth) || 1)
  const current = Math.min(maximum, Math.max(0, Number(currentHealth) || 0))
  const heal = Math.min(maximum - current, Math.ceil(maximum * 0.35))
  return { heal, healthAfter: current + heal }
}

export const getRecoveryCost = maxHealth => Math.max(10, Math.ceil((Number(maxHealth) || 1) * 0.1))

export const resolveExploration = ({ location, player, rolls = {} }) => {
  const maxHealth = Math.max(1, Number(player.maxHealth) || 1)
  const currentHealth = Math.max(0, Number(player.currentHealth) || 0)
  if (currentHealth <= 0) return { kind: 'blocked', reason: 'injured' }
  if ((Number(player.spirit) || 0) < location.spiritCost) return { kind: 'blocked', reason: 'spirit' }

  const equipmentPity = Math.min(EQUIPMENT_PITY_LIMIT, Math.max(0, Math.floor(Number(player.equipmentPity) || 0)))
  const dangerChance = Math.min(0.75, Math.max(0, Number(location.dangerChance) || 0))
  if (clampRoll(rolls.danger) < dangerChance) {
    const isQiDeviation = clampRoll(rolls.dangerType) >= 0.5
    if (!isQiDeviation) {
      const enemy = selectEnemyForLocation(location.id, rolls.enemy, rolls.boss)
      if (enemy) {
        const combat = resolveAutoCombat({
          player: buildDungeonPlayerCombatant({
            player: {
              ...player,
              getPetBonus: player.petBonus,
              activeEquipmentSetBonuses: player.setBonuses
            },
            technique: selectTechniqueForCombat(
              player.unlockedSkills,
              player.activeTechniqueId,
              player.techniqueLevels
            )
          }).stats,
          enemy,
          technique: selectTechniqueForCombat(
            player.unlockedSkills,
            player.activeTechniqueId,
            player.techniqueLevels
          ),
          rolls: rolls.combat,
          maxRounds: 8
        })
        return {
          kind: 'combat',
          eventId: 'monster_ambush',
          name: '妖兽伏击',
          enemy,
          ...combat,
          equipmentPityAfter: equipmentPity,
          spiritCost: location.spiritCost
        }
      }
    }

    const damageRange = location.damagePercent || [0.08, 0.16]
    const rawDamage = amountFromRange(
      [Math.ceil(maxHealth * damageRange[0]), Math.ceil(maxHealth * damageRange[1])],
      rolls.amount
    )
    const defense = Math.max(0, Number(player.defense) || 0)
    const damage = Math.max(1, Math.ceil(rawDamage * (100 / (100 + defense))))
    return {
      kind: 'danger',
      eventId: 'qi_deviation',
      name: '灵气逆行',
      description: '险地灵气紊乱，冲撞经脉。',
      damage,
      cultivationLoss: Math.ceil(damage * 0.6),
      equipmentPityAfter: equipmentPity,
      spiritCost: location.spiritCost
    }
  }

  const specialChance = Math.min(0.35, 0.16 * Math.max(1, Number(player.luck) || 1))
  if (clampRoll(rolls.special) < specialChance) {
    const index = Math.floor(clampRoll(rolls.specialType) * SPECIAL_EXPLORATION_EVENTS.length)
    const event = SPECIAL_EXPLORATION_EVENTS[index]
    const tier = Math.max(1, Number(location.tier) || 1)
    const scaledRange = event.amountPerTier.map(value => value * tier)
    const result = {
      kind: 'special',
      eventId: event.id,
      name: event.name,
      description: event.description,
      reward: { type: event.rewardType, amount: amountFromRange(scaledRange, rolls.amount) },
      heal: event.healPercent ? Math.ceil(maxHealth * event.healPercent) : 0,
      equipmentPityAfter: equipmentPity,
      spiritCost: location.spiritCost
    }
    if (event.fragmentTechniqueId && event.fragmentAmountPerTier) {
      result.bonusReward = {
        type: 'technique_fragment',
        techniqueId: event.fragmentTechniqueId,
        amount: amountFromRange(event.fragmentAmountPerTier.map(value => value * tier), rolls.amount)
      }
    }
    return result
  }

  const guaranteed = equipmentPity >= EQUIPMENT_PITY_LIMIT
  const rewardConfig = guaranteed
    ? location.rewards.find(reward => reward.type === 'equipment') || { type: 'equipment', amount: [1, 1] }
    : selectReward(location.rewards, rolls.reward)
  const multiplier = clampRoll(rolls.bonus) < Math.min(0.4, 0.12 * Math.max(1, Number(player.luck) || 1)) ? 1.5 : 1
  const amount = Math.floor(amountFromRange(rewardConfig.amount, rolls.amount) * multiplier)
  const reward = { type: rewardConfig.type, amount }
  if (rewardConfig.type === 'equipment') reward.tier = Math.max(1, Number(location.tier) || 1)
  return {
    kind: 'reward',
    reward,
    multiplier,
    guaranteed,
    equipmentPityAfter: getEquipmentPityAfter(equipmentPity, reward.type),
    spiritCost: location.spiritCost
  }
}
