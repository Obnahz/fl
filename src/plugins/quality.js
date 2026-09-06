export const QUALITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'mythic']

export const QUALITY_INFO = {
  common: { name: '凡品', color: '#6b7280', multiplier: 1 },
  uncommon: { name: '下品', color: '#2f855a', multiplier: 1.2 },
  rare: { name: '中品', color: '#2563eb', multiplier: 1.5 },
  epic: { name: '上品', color: '#7c3aed', multiplier: 1.9 },
  mythic: { name: '仙品', color: '#d97706', multiplier: 2.4 }
}

const LEGACY_ALIASES = { legendary: 'mythic', celestial: 'mythic', divine: 'mythic', mystic: 'epic', spiritual: 'rare', mortal: 'common' }
export const normalizeQuality = quality => QUALITY_INFO[quality] ? quality : (LEGACY_ALIASES[quality] || 'common')
export const getQualityInfo = quality => QUALITY_INFO[normalizeQuality(quality)]

export const getQualityThresholds = level => {
  const progress = Math.min(1, Math.max(0, (Number(level) - 1) / 99))
  const early = [0.65, 0.93, 0.99, 0.998, 0.9998]
  const late = [0.35, 0.72, 0.92, 0.985, 0.998]
  return early.map((value, index) => value + (late[index] - value) * progress)
}

export const rollQuality = (level = 1, roll = Math.random()) => {
  const value = Math.min(0.999999, Math.max(0, Number(roll) || 0))
  const index = getQualityThresholds(level).findIndex(threshold => value < threshold)
  return QUALITY_ORDER[index === -1 ? QUALITY_ORDER.length - 1 : index]
}

export const getQualityPowerMultiplier = (quality, level = 1) => {
  const realmFactor = 1 + Math.min(0.35, Math.max(0, Number(level) - 1) * 0.0025)
  return getQualityInfo(quality).multiplier * realmFactor
}
