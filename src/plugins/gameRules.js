export const SPIRITUAL_ROOTS = [
  {
    id: 'metal',
    name: '金灵根',
    element: '金',
    color: '#b0892d',
    description: '锐意精进，突破时更受天道眷顾。',
    cultivationRate: 1.05,
    spiritRate: 1,
    luck: 1.08
  },
  {
    id: 'wood',
    name: '木灵根',
    element: '木',
    color: '#2f855a',
    description: '生机绵长，日常修炼更为稳健。',
    cultivationRate: 1.12,
    spiritRate: 1,
    luck: 1
  },
  {
    id: 'water',
    name: '水灵根',
    element: '水',
    color: '#2b6cb0',
    description: '周天流转，吐纳灵力的速度更快。',
    cultivationRate: 1,
    spiritRate: 1.15,
    luck: 1
  },
  {
    id: 'fire',
    name: '火灵根',
    element: '火',
    color: '#c2413a',
    description: '进境迅猛，打坐所得修为最多。',
    cultivationRate: 1.18,
    spiritRate: 0.95,
    luck: 1
  },
  {
    id: 'earth',
    name: '土灵根',
    element: '土',
    color: '#8a6840',
    description: '根基厚重，灵力与福缘均有小幅增益。',
    cultivationRate: 1.04,
    spiritRate: 1.06,
    luck: 1.05
  }
]

export const normalizeCharacterName = value => {
  const name = String(value || '').trim()
  const length = Array.from(name).length
  if (length < 2 || length > 8) {
    throw new Error('道号需为 2 到 8 个字符')
  }
  return name
}

export const drawSpiritualRoot = (randomValue = Math.random()) => {
  const normalizedRandom = Number.isFinite(randomValue) ? Math.min(0.999999, Math.max(0, randomValue)) : 0
  const index = Math.floor(normalizedRandom * SPIRITUAL_ROOTS.length)
  return SPIRITUAL_ROOTS[index]
}

export const getSpiritualRoot = id => SPIRITUAL_ROOTS.find(root => root.id === id) || null

export const getBreakthroughChance = ({ level, luck }) => {
  const majorRealm = Math.floor(Math.max(0, Number(level) - 1) / 9)
  const realmPenalty = majorRealm * 0.05
  const luckBonus = Math.max(0, Number(luck || 1) - 1) * 0.25
  return Math.min(0.95, Math.max(0.45, 0.85 - realmPenalty + luckBonus))
}

export const calculateBreakthroughOutcome = ({
  level,
  luck,
  cultivation,
  maxCultivation,
  roll = Math.random(),
  chanceBonus = 0,
  lossMultiplier = 1
}) => {
  const currentCultivation = Number(cultivation) || 0
  const requiredCultivation = Math.max(1, Number(maxCultivation) || 1)
  const chance = Math.min(0.98, Math.max(0.05, getBreakthroughChance({ level, luck }) + Number(chanceBonus || 0)))

  if (currentCultivation < requiredCultivation) {
    return { ready: false, success: false, chance, loss: 0, cultivationAfter: currentCultivation }
  }

  if (roll < chance) {
    return {
      ready: true,
      success: true,
      chance,
      loss: 0,
      cultivationAfter: currentCultivation - requiredCultivation
    }
  }

  const loss = Math.ceil(requiredCultivation * 0.2 * Math.max(0, Number(lossMultiplier) || 0))
  return {
    ready: true,
    success: false,
    chance,
    loss,
    cultivationAfter: Math.max(0, currentCultivation - loss)
  }
}

const BASE_CULTIVATION_COST = 10
const BASE_CULTIVATION_GAIN = 1
const EXTRA_CULTIVATION_CHANCE = 0.3

const getCultivationCost = level =>
  Math.floor(BASE_CULTIVATION_COST * Math.pow(1.5, Math.max(0, Number(level) - 1)))

const getCultivationGain = level =>
  Math.floor(BASE_CULTIVATION_GAIN * Math.pow(1.2, Math.max(0, Number(level) - 1)))

export const calculateCultivationBatch = ({
  level = 1,
  spirit = 0,
  cultivation = 0,
  maxCultivation = 0,
  luck = 1,
  effectiveCultivationRate = 1,
  rolls = []
} = {}) => {
  const currentSpirit = Math.max(0, Number(spirit) || 0)
  const currentCultivation = Math.max(0, Number(cultivation) || 0)
  const cultivationLimit = Math.max(0, Number(maxCultivation) || 0)
  const baseGain = getCultivationGain(level)
  const costPerAttempt = getCultivationCost(level)
  const effectiveRate = Math.max(0, Number(effectiveCultivationRate) || 0)
  const gainPerAttempt = baseGain * effectiveRate
  const remainingCultivation = Math.max(0, cultivationLimit - currentCultivation)
  const times = gainPerAttempt > 0 ? Math.ceil(remainingCultivation / gainPerAttempt) : 0
  const totalCost = times * costPerAttempt

  if (currentSpirit < totalCost) {
    return {
      valid: false,
      times,
      totalCost,
      rawCultivationGain: 0,
      cultivationGain: 0,
      doubleGainTimes: 0,
      effectiveCultivationRate: effectiveRate
    }
  }

  let rawCultivationGain = 0
  let doubleGainTimes = 0
  for (let index = 0; index < times; index += 1) {
    const roll = Number.isFinite(rolls[index]) ? rolls[index] : Math.random()
    const doubled = roll < EXTRA_CULTIVATION_CHANCE * Math.max(0, Number(luck) || 0)
    rawCultivationGain += doubled ? baseGain * 2 : baseGain
    if (doubled) doubleGainTimes += 1
  }

  return {
    valid: true,
    times,
    totalCost,
    rawCultivationGain,
    cultivationGain: rawCultivationGain * effectiveRate,
    doubleGainTimes,
    effectiveCultivationRate: effectiveRate
  }
}
