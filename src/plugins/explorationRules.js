import { buildDungeonPlayerCombatant, resolveAutoCombat } from './combatRules.js'
import { selectEnemyForLocation } from './enemies.js'
import { EQUIPMENT_PITY_LIMIT, getEquipmentPityAfter } from './equipmentRules.js'
import { STARTER_TECHNIQUE_ID, selectTechniqueForCombat } from './techniques.js'
import { getQualityPowerMultiplier, normalizeQuality, rollQuality } from './quality.js'

export const PET_SPECIES = [
  {
    id: 'spirit_cat', name: '灵猫', specialty: '迅影',
    description: '身法轻灵，擅长闪避与抢先出手。',
    multipliers: { speed: 1.16, dodgeRate: 1.35 }, bonuses: { dodgeResist: 0.03 }
  },
  {
    id: 'cloud_fox', name: '云狐', specialty: '幻袭',
    description: '借云气藏形，擅长暴击与连击。',
    multipliers: { critRate: 1.3, comboRate: 1.25 }, bonuses: { finalDamageBoost: 0.025 }
  },
  {
    id: 'stone_tortoise', name: '玄甲龟', specialty: '镇岳',
    description: '玄甲厚重，擅长承伤与降低爆发伤害。',
    multipliers: { health: 1.18, defense: 1.2 }, bonuses: { finalDamageReduce: 0.04, stunResist: 0.03 }
  },
  {
    id: 'flame_hound', name: '炎獒', specialty: '焚杀号',
    description: '炎息炽烈，擅长强化攻击与终结伤害。',
    multipliers: { attack: 1.18, stunRate: 1.25 }, bonuses: { critDamageBoost: 0.08, finalDamageBoost: 0.02 }
  }
]

export const normalizeExplorationPet = (pet = {}) => {
  if (pet?.type !== 'pet') return pet
  const species = PET_SPECIES.find(item => item.id === pet.speciesId)
    || PET_SPECIES.find(item => item.name === pet.name)
    || PET_SPECIES[0]
  const quality = normalizeQuality(pet.quality || pet.rarity)
  const combatAttributes = { ...(pet.combatAttributes || {}) }
  if (!pet.speciesId) {
    for (const [key, multiplier] of Object.entries(species.multipliers || {})) {
      if (Number.isFinite(Number(combatAttributes[key]))) {
        combatAttributes[key] = key.endsWith('Rate')
          ? Number((Number(combatAttributes[key]) * multiplier).toFixed(3))
          : Math.round(Number(combatAttributes[key]) * multiplier)
      }
    }
    for (const [key, value] of Object.entries(species.bonuses || {})) {
      combatAttributes[key] = Number((Number(combatAttributes[key] || 0) + value).toFixed(3))
    }
  }
  for (const key of ['attack', 'health', 'defense', 'speed', 'critRate', 'comboRate', 'counterRate', 'stunRate', 'dodgeRate', 'vampireRate']) {
    if (!Number.isFinite(Number(combatAttributes[key]))) combatAttributes[key] = 0
  }
  return {
    ...pet,
    speciesId: species.id,
    specialty: pet.specialty || species.specialty,
    description: pet.description || species.description,
    quality,
    rarity: quality,
    combatAttributes
  }
}

const createExplorationPet = (level, tier, rolls = {}) => {
  const quality = rollQuality(Number(level) + Math.max(0, Number(tier) - 1) * 8, rolls.quality)
  const strength = getQualityPowerMultiplier(quality, level) * (1 + Math.max(0, Number(tier) - 1) * 0.12)
  const species = PET_SPECIES[Math.floor(clampRoll(rolls.species) * PET_SPECIES.length)]
  const base = { attack: 10, health: 110, defense: 8, speed: 10 }
  const attributes = {
    attack: Math.round(base.attack * strength * (species.multipliers.attack || 1)),
    health: Math.round(base.health * strength * (species.multipliers.health || 1)),
    defense: Math.round(base.defense * strength * (species.multipliers.defense || 1)),
    speed: Math.round(base.speed * strength * (species.multipliers.speed || 1)),
    critRate: Number((0.05 * strength * (species.multipliers.critRate || 1)).toFixed(3)),
    comboRate: Number((0.04 * strength * (species.multipliers.comboRate || 1)).toFixed(3)),
    counterRate: Number((0.03 * strength * (species.multipliers.counterRate || 1)).toFixed(3)),
    stunRate: Number((0.02 * strength * (species.multipliers.stunRate || 1)).toFixed(3)),
    dodgeRate: Number((0.04 * strength * (species.multipliers.dodgeRate || 1)).toFixed(3)),
    vampireRate: Number((0.02 * strength).toFixed(3)),
    ...Object.fromEntries(Object.entries(species.bonuses).map(([key, value]) => [key, Number((value * strength).toFixed(3))]))
  }
  return {
    id: `exploration_pet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'pet',
    name: species.name,
    speciesId: species.id,
    specialty: species.specialty,
    description: species.description,
    rarity: quality,
    quality,
    level: 1,
    star: 0,
    power: Math.round(strength * 100),
    combatAttributes: attributes
  }
}

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
  const tier = Math.max(1, Number(location.tier) || 1)
  const petChance = Math.min(0.12, 0.02 + tier * 0.008)
  if (clampRoll(rolls.pet == null ? 1 : rolls.pet) < petChance) {
    return {
      kind: 'reward',
      reward: { type: 'pet', amount: 1, pet: createExplorationPet(player.level, tier, rolls) },
      multiplier: 1,
      guaranteed: false,
      equipmentPityAfter: equipmentPity,
      spiritCost: location.spiritCost
    }
  }
  const rewardConfig = guaranteed
    ? location.rewards.find(reward => reward.type === 'equipment') || { type: 'equipment', amount: [1, 1] }
    : selectReward(location.rewards, rolls.reward)
  const multiplier = clampRoll(rolls.bonus) < Math.min(0.4, 0.12 * Math.max(1, Number(player.luck) || 1)) ? 1.5 : 1
  const amount = Math.floor(amountFromRange(rewardConfig.amount, rolls.amount) * multiplier)
  const reward = { type: rewardConfig.type, amount }
  if (rewardConfig.type === 'equipment') reward.tier = tier
  return {
    kind: 'reward',
    reward,
    multiplier,
    guaranteed,
    equipmentPityAfter: getEquipmentPityAfter(equipmentPity, reward.type),
    spiritCost: location.spiritCost
  }
}
