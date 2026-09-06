import { QUALITY_INFO, QUALITY_ORDER, getQualityInfo, getQualityPowerMultiplier, rollQuality } from './quality.js'

export const EQUIPMENT_QUALITIES = {
  common: { name: '凡品', color: '#6b7280', multiplier: 1 },
  uncommon: { name: '下品', color: '#2f855a', multiplier: 1.2 },
  rare: { name: '中品', color: '#2563eb', multiplier: 1.5 },
  epic: { name: '上品', color: '#7c3aed', multiplier: 1.9 },
  mythic: QUALITY_INFO.mythic
}

export const EQUIPMENT_PITY_LIMIT = 8

export const EQUIPMENT_SETS = {
  qingfeng: {
    name: '青锋套',
    color: '#2563eb',
    bonuses: [
      { pieces: 2, stats: { attack: 3 }, description: '攻击 +3' },
      { pieces: 4, stats: { critRate: 0.03 }, description: '暴击率 +3%' }
    ]
  },
  xuanshou: {
    name: '玄守套',
    color: '#2f855a',
    bonuses: [
      { pieces: 2, stats: { defense: 3 }, description: '防御 +3' },
      { pieces: 4, stats: { dodgeRate: 0.03 }, description: '闪避率 +3%' }
    ]
  }
}

export const EQUIPMENT_SLOTS = {
  weapon: { name: '武器', prefixes: ['青锋', '玄铁', '流云'], stats: { attack: [2, 4], critRate: [0.01, 0.03] } },
  head: { name: '冠', prefixes: ['静心', '青木', '玄纹'], stats: { defense: [1, 2], health: [8, 14] } },
  body: { name: '法衣', prefixes: ['云纹', '护元', '青霞'], stats: { defense: [2, 4], health: [12, 20] } },
  legs: { name: '护腿', prefixes: ['踏山', '御风', '玄布'], stats: { defense: [1, 3], speed: [1, 2] } },
  feet: { name: '履', prefixes: ['轻云', '逐风', '踏月'], stats: { speed: [2, 4], dodgeRate: [0.01, 0.03] } },
  shoulder: { name: '肩甲', prefixes: ['镇岳', '护脉', '青岩'], stats: { defense: [1, 3], health: [6, 12] } },
  hands: { name: '护手', prefixes: ['凝锋', '聚气', '赤铜'], stats: { attack: [1, 3], comboRate: [0.01, 0.03] } },
  wrist: { name: '护腕', prefixes: ['守心', '玄丝', '回风'], stats: { defense: [1, 2], counterRate: [0.01, 0.03] } },
  necklace: { name: '灵佩', prefixes: ['养元', '清灵', '聚灵'], stats: { health: [8, 16], spiritRate: [0.01, 0.03] } },
  ring1: { name: '攻戒', prefixes: ['破妄', '锐金', '烈阳'], stats: { attack: [1, 3], critDamageBoost: [0.02, 0.05] } },
  ring2: { name: '守戒', prefixes: ['定心', '厚土', '玄守'], stats: { defense: [1, 3], critDamageReduce: [0.02, 0.05] } },
  belt: { name: '腰带', prefixes: ['束灵', '护元', '藏气'], stats: { health: [8, 14], defense: [1, 2] } },
  artifact: { name: '法器', prefixes: ['引雷', '青木', '离火'], stats: { attack: [2, 4], comboRate: [0.02, 0.04] } }
}

EQUIPMENT_SETS.yanling = {
  name: '\u7130\u7075\u5957', color: '#dc2626',
  bonuses: [
    { pieces: 2, stats: { attack: 6 }, description: '\u653b\u51fb +6' },
    { pieces: 4, stats: { critRate: 0.05 }, description: '\u4f1a\u5fc3\u7387 +5%' }
  ]
}
EQUIPMENT_SETS.xingyun = {
  name: '\u661f\u9668\u5957', color: '#0891b2',
  bonuses: [
    { pieces: 2, stats: { defense: 7 }, description: '\u9632\u5fa1 +7' },
    { pieces: 4, stats: { speed: 4 }, description: '\u901f\u5ea6 +4' }
  ]
}
EQUIPMENT_SETS.canglan = {
  name: '沧澜套', color: '#0e7490',
  bonuses: [
    { pieces: 2, stats: { spiritRate: 0.04 }, description: '吐纳效率 +4%' },
    { pieces: 4, stats: { healBoost: 0.06 }, description: '治疗效果 +6%' }
  ]
}
EQUIPMENT_SETS.tianyan = {
  name: '天衍套', color: '#a16207',
  bonuses: [
    { pieces: 2, stats: { attack: 10 }, description: '攻击 +10' },
    { pieces: 4, stats: { finalDamageBoost: 0.05 }, description: '最终伤害 +5%' }
  ]
}
EQUIPMENT_SETS.xinghe = {
  name: '星河套', color: '#4f46e5',
  bonuses: [
    { pieces: 2, stats: { speed: 5 }, description: '速度 +5' },
    { pieces: 4, stats: { critDamageBoost: 0.08 }, description: '暴击伤害 +8%' }
  ]
}
EQUIPMENT_SETS.houtu = {
  name: '厚土套', color: '#92400e',
  bonuses: [
    { pieces: 2, stats: { health: 40 }, description: '生命 +40' },
    { pieces: 4, stats: { finalDamageReduce: 0.06 }, description: '最终减伤 +6%' }
  ]
}
EQUIPMENT_SETS.yufeng = {
  name: '御风套', color: '#0f766e',
  bonuses: [
    { pieces: 2, stats: { dodgeRate: 0.04 }, description: '闪避 +4%' },
    { pieces: 4, stats: { comboRate: 0.06 }, description: '连击 +6%' }
  ]
}
EQUIPMENT_SETS.hunyuan = {
  name: '混元套', color: '#7e22ce',
  bonuses: [
    { pieces: 2, stats: { attack: 8, defense: 8 }, description: '攻防 +8' },
    { pieces: 4, stats: { combatBoost: 0.05 }, description: '战斗属性 +5%' }
  ]
}

EQUIPMENT_SETS.yufeng_immortal = {
  name: '\u5fa1\u98ce\u4ed9\u8863', color: '#0f766e',
  bonuses: [
    { pieces: 2, stats: { speed: 7 }, description: '\u901f\u5ea6 +7' },
    { pieces: 4, stats: { dodgeRate: 0.06, comboRate: 0.04 }, description: '\u95ea\u907f +6%\uff0c\u8fde\u51fb +4%' }
  ]
}
EQUIPMENT_SETS.daluo_origin = {
  name: '\u5927\u7f57\u9053\u6e90\u5957', color: '#b45309',
  bonuses: [
    { pieces: 2, stats: { attack: 12, defense: 12 }, description: '\u653b\u9632 +12' },
    { pieces: 4, stats: { finalDamageBoost: 0.08, finalDamageReduce: 0.08 }, description: '\u6700\u7ec8\u4f24\u5bb3\u589e\u51cf +8%' }
  ]
}

const PERCENT_STATS = new Set([
  'critRate',
  'comboRate',
  'counterRate',
  'dodgeRate',
  'critDamageBoost',
  'critDamageReduce',
  'spiritRate'
])

const SCORE_WEIGHTS = {
  attack: 5,
  defense: 4,
  health: 0.4,
  speed: 3,
  critRate: 120,
  comboRate: 100,
  counterRate: 90,
  dodgeRate: 110,
  critDamageBoost: 80,
  critDamageReduce: 90,
  vampireRate: 110,
  stunResist: 55,
  healBoost: 55,
  finalDamageBoost: 100,
  finalDamageReduce: 110,
  combatBoost: 130,
  resistanceBoost: 110,
  spiritRate: 60
}

const clampRoll = value => (Number.isFinite(value) ? Math.min(0.999999, Math.max(0, value)) : Math.random())

const pick = (values, roll) => values[Math.floor(clampRoll(roll) * values.length)]

const getQuality = (tier, playerLevel, roll) => {
  const normalizedTier = Math.min(13, Math.max(1, Number(tier) || 1))
  const progress = Math.min(1, Math.max(0, (Number(playerLevel) - 1) / 99))
  const earlyThresholds = [0.65, 0.93, 0.99, 0.998, 0.9998]
  const lateThresholds = [0.35, 0.72, 0.92, 0.985, 0.998]
  const thresholds = earlyThresholds.map((value, index) => value + (lateThresholds[index] - value) * progress)
  const tierQualityBonus = Math.min(0.08, (normalizedTier - 1) * 0.006)
  const value = clampRoll(clampRoll(roll) - tierQualityBonus)
  const qualityIndex = thresholds.findIndex(threshold => value < threshold)
  return QUALITY_ORDER[qualityIndex === -1 ? QUALITY_ORDER.length - 1 : qualityIndex]
}

const rollStat = (range, roll, multiplier) => {
  const raw = (range[0] + clampRoll(roll) * (range[1] - range[0])) * multiplier
  return PERCENT_STATS.has(range.stat) ? Number(raw.toFixed(3)) : Math.max(1, Math.round(raw))
}

export const createEquipmentDrop = ({ id, tier = 1, playerLevel = 1, rolls = {} } = {}) => {
  const slot = pick(Object.keys(EQUIPMENT_SLOTS), rolls.slot)
  const slotConfig = EQUIPMENT_SLOTS[slot]
  const quality = getQuality(tier, playerLevel, rolls.quality)
  const qualityInfo = getQualityInfo(quality)
  const maximumLevel = Math.max(1, Math.floor(Number(playerLevel) || 1))
  const normalizedTier = Math.min(13, Math.max(1, Number(tier) || 1))
  // 高阶地点的装备等级下限更高，避免连续掉落远低于当前装备的低等级白板。
  const levelFloorRatio = Math.min(0.86, 0.48 + normalizedTier * 0.03)
  const minimumLevel = Math.max(1, Math.floor(maximumLevel * levelFloorRatio))
  const level = Math.min(maximumLevel, minimumLevel + Math.floor(clampRoll(rolls.level) * (maximumLevel - minimumLevel + 1)))
  const tierMultiplier = 1 + (normalizedTier - 1) * 0.7
  const levelMultiplier = 1 + (level - 1) * 0.04
  const multiplier = getQualityPowerMultiplier(quality, playerLevel) * tierMultiplier * levelMultiplier
  const stats = {}

  Object.entries(slotConfig.stats).forEach(([stat, range], index) => {
    const statRange = [...range]
    statRange.stat = stat
    stats[stat] = rollStat(statRange, rolls.stats?.[index], multiplier)
  })

  const prefix = pick(slotConfig.prefixes, rolls.name)
  const setId = pick(Object.keys(EQUIPMENT_SETS), rolls.set)
  const suffix = { common: '', uncommon: '·灵', rare: '·玄', epic: '·真', mythic: '·仙' }[quality]

  return {
    id: id || `exploration_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: `${prefix}${slotConfig.name}${suffix}`,
    type: slot,
    slot,
    quality,
    level,
    requiredRealm: level,
    stats,
    equipType: slot,
    qualityInfo: { name: qualityInfo.name, color: qualityInfo.color },
    setId
  }
}

export const getEquipmentScore = equipment => {
  if (!equipment?.stats) return 0
  const score = Object.entries(equipment.stats).reduce(
    (total, [stat, value]) => {
      const numericValue = Number(value)
      const weight = SCORE_WEIGHTS[stat]
      return total + (weight && Number.isFinite(numericValue) && numericValue > 0 ? numericValue * weight : 0)
    },
    0
  )
  return Math.round(score)
}

export const getEquipmentStatDeltas = (previousStats = {}, nextStats = {}) => {
  const stats = new Set([...Object.keys(previousStats), ...Object.keys(nextStats)])
  return Object.fromEntries(
    [...stats]
      .map(stat => [stat, (Number(nextStats[stat]) || 0) - (Number(previousStats[stat]) || 0)])
      .filter(([, value]) => value !== 0)
  )
}

export const compareEquipment = (candidate, current) => {
  const candidateScore = getEquipmentScore(candidate)
  const currentScore = getEquipmentScore(current)
  const difference = candidateScore - currentScore
  return {
    currentScore,
    candidateScore,
    difference,
    verdict: !current ? 'new-slot' : difference > 0 ? 'upgrade' : difference < 0 ? 'downgrade' : 'sidegrade'
  }
}

export const getEquipmentPityAfter = (currentPity, rewardType) => {
  if (rewardType === 'equipment') return 0
  return Math.min(EQUIPMENT_PITY_LIMIT, Math.max(0, Math.floor(Number(currentPity) || 0)) + 1)
}

export const getEquipmentSetState = equippedArtifacts => {
  const counts = {}
  Object.values(equippedArtifacts || {}).forEach(equipment => {
    if (equipment?.setId && EQUIPMENT_SETS[equipment.setId]) {
      counts[equipment.setId] = (counts[equipment.setId] || 0) + 1
    }
  })
  return Object.entries(EQUIPMENT_SETS).map(([id, set]) => ({
    id,
    ...set,
    count: counts[id] || 0,
    bonuses: set.bonuses.map(bonus => ({ ...bonus, active: (counts[id] || 0) >= bonus.pieces }))
  }))
}

export const getActiveEquipmentSetBonuses = equippedArtifacts => {
  const totals = {}
  getEquipmentSetState(equippedArtifacts).forEach(set => {
    set.bonuses.forEach(bonus => {
      if (!bonus.active) return
      Object.entries(bonus.stats).forEach(([stat, value]) => {
        totals[stat] = (totals[stat] || 0) + value
      })
    })
  })
  return totals
}

export const clampCurrentHealth = (currentHealth, maxHealth) => {
  const maximum = Math.max(1, Number(maxHealth) || 1)
  return Math.min(maximum, Math.max(0, Number(currentHealth) || 0))
}
