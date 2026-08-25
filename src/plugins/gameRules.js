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

export const calculateBreakthroughOutcome = ({ level, luck, cultivation, maxCultivation, roll = Math.random() }) => {
  const currentCultivation = Number(cultivation) || 0
  const requiredCultivation = Math.max(1, Number(maxCultivation) || 1)
  const chance = getBreakthroughChance({ level, luck })

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

  const loss = Math.ceil(requiredCultivation * 0.2)
  return {
    ready: true,
    success: false,
    chance,
    loss,
    cultivationAfter: Math.max(0, currentCultivation - loss)
  }
}
