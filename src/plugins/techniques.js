export const TECHNIQUES = [
  {
    id: 'thunder_sword_intent', name: '\u60ca\u96f7\u5251\u610f', description: '\u5f15\u96f7\u5165\u5251\uff0c\u4ee5\u96f7\u610f\u50ac\u53d1\u4f1a\u5fc3\u4e00\u51fb\u3002',
    style: 'critical_burst', styleName: '\u96f7\u9706\u7206\u53d1', critRateBonus: 0.12, critRateBonusPerLevel: 0.03,
    damageMultiplier: 1.5, damagePerLevel: 0.12, cooldownRounds: 3, maxLevel: 5, duplicateFragments: 2
  },
  {
    id: 'spirit_edge', name: '\u5f15\u7075\u950b', description: '\u51dd\u805a\u7075\u6c14\u5316\u4f5c\u950b\u8292\uff0c\u7a7f\u900f\u62a4\u4f53\u771f\u6c14\u3002',
    style: 'armor_break', styleName: '\u7834\u7532\u950b\u8292', armorPenetration: 0.35, armorPenetrationPerLevel: 0.05,
    damageMultiplier: 1.25, damagePerLevel: 0.1, cooldownRounds: 3, maxLevel: 5, duplicateFragments: 2
  },
  {
    id: 'ember_meridian_art', name: '\u7130\u8109\u708e\u8bc0', description: '\u4ee5\u708e\u8840\u70bc\u610f\uff0c\u77ed\u65f6\u95f4\u5185\u5f15\u7206\u7ecf\u8109\u3002',
    style: 'critical_burst', styleName: '\u7130\u8109\u7206\u53d1', critRateBonus: 0.08, critRateBonusPerLevel: 0.025,
    damageMultiplier: 1.38, damagePerLevel: 0.1, cooldownRounds: 2, maxLevel: 5, duplicateFragments: 3
  },
  {
    id: 'void_seal_sword', name: '\u865a\u65e0\u5c01\u5251', description: '\u4ee5\u865a\u7a7a\u4e4b\u529b\u5207\u5f00\u62a4\u4f53\uff0c\u4e13\u6ce8\u4e8e\u7a7f\u7532\u7834\u9632\u3002',
    style: 'armor_break', styleName: '\u865a\u7a7a\u7981\u5236', armorPenetration: 0.28, armorPenetrationPerLevel: 0.055,
    damageMultiplier: 1.18, damagePerLevel: 0.11, cooldownRounds: 3, maxLevel: 5, duplicateFragments: 3
  },
  {
    id: 'starfall_sutra', name: '\u661f\u6cb3\u843d\u661f\u8bc0', description: '\u5f15\u661f\u8f89\u5316\u4f5c\u5251\u6c14\uff0c\u4e00\u51fb\u7cbe\u51c6\u800c\u5f3a\u5927\u3002',
    style: 'critical_burst', styleName: '\u661f\u843d\u7206\u53d1', critRateBonus: 0.16, critRateBonusPerLevel: 0.02,
    damageMultiplier: 1.65, damagePerLevel: 0.14, cooldownRounds: 4, maxLevel: 5, duplicateFragments: 4
  }
]

export const STARTER_TECHNIQUE_ID = 'spirit_edge'
export const getTechniqueById = id => TECHNIQUES.find(technique => technique.id === id) || null
export const normalizeUnlockedTechniques = unlockedIds => {
  const ids = Array.isArray(unlockedIds) ? unlockedIds : []
  const knownIds = new Set(TECHNIQUES.map(technique => technique.id))
  return [...new Set(ids.filter(id => typeof id === 'string' && knownIds.has(id)))]
}
export const normalizeStoredSkillIds = unlockedIds => {
  const ids = Array.isArray(unlockedIds) ? unlockedIds : []
  return [...new Set(ids.filter(id => typeof id === 'string' && id.length > 0))]
}
const normalizeProgressMap = (value, minimum) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([id, amount]) => typeof id === 'string' && id.length > 0 && Number.isInteger(amount) && amount >= minimum))
}
export const normalizeTechniqueLevels = value => normalizeProgressMap(value, 1)
export const normalizeTechniqueFragments = value => normalizeProgressMap(value, 0)
export const grantTechniqueFragments = ({ techniqueId, amount, techniqueFragments } = {}) => {
  const fragments = normalizeTechniqueFragments(techniqueFragments)
  const technique = getTechniqueById(techniqueId)
  const gained = Math.max(0, Math.floor(Number(amount) || 0))
  if (!technique || gained <= 0) return { valid: false, gained: 0, technique, techniqueFragments: fragments }
  return { valid: true, gained, technique, techniqueFragments: { ...fragments, [technique.id]: (fragments[technique.id] || 0) + gained } }
}
export const getTechniqueAtLevel = (id, level = 1) => {
  const technique = getTechniqueById(id)
  if (!technique) return null
  const normalizedLevel = Math.min(technique.maxLevel, Math.max(1, Math.floor(Number(level) || 1)))
  const armorPenetration = Math.min(0.75, Number(((technique.armorPenetration || 0) + (technique.armorPenetrationPerLevel || 0) * (normalizedLevel - 1)).toFixed(2)))
  const critRateBonus = Math.min(1, Number(((technique.critRateBonus || 0) + (technique.critRateBonusPerLevel || 0) * (normalizedLevel - 1)).toFixed(2)))
  const effectText = armorPenetration > 0 ? `\u7834\u7532 ${Math.round(armorPenetration * 100)}%` : critRateBonus > 0 ? `\u4f1a\u5fc3 +${Math.round(critRateBonus * 100)}%` : ''
  return { ...technique, level: normalizedLevel, armorPenetration, critRateBonus, effectText, damageMultiplier: Number((technique.damageMultiplier + technique.damagePerLevel * (normalizedLevel - 1)).toFixed(2)) }
}
export const getTechniqueUpgradeCost = (id, level = 1) => {
  const technique = getTechniqueById(id)
  if (!technique) return null
  const normalizedLevel = Math.min(technique.maxLevel, Math.max(1, Math.floor(Number(level) || 1)))
  return normalizedLevel >= technique.maxLevel ? null : normalizedLevel * 2
}
export const applyTechniqueUpgrade = ({ techniqueId, techniqueLevels, techniqueFragments } = {}) => {
  const technique = getTechniqueById(techniqueId)
  const levels = normalizeTechniqueLevels(techniqueLevels)
  const fragments = normalizeTechniqueFragments(techniqueFragments)
  if (!technique) return { valid: false, upgraded: false, techniqueLevels: levels, techniqueFragments: fragments }
  const level = Math.min(technique.maxLevel, levels[technique.id] || 1)
  const cost = getTechniqueUpgradeCost(technique.id, level)
  if (cost === null || (fragments[technique.id] || 0) < cost) return { valid: true, upgraded: false, level, cost, techniqueLevels: levels, techniqueFragments: fragments }
  return { valid: true, upgraded: true, level: level + 1, cost, techniqueLevels: { ...levels, [technique.id]: level + 1 }, techniqueFragments: { ...fragments, [technique.id]: (fragments[technique.id] || 0) - cost } }
}
export const selectTechniqueForCombat = (unlockedIds, activeTechniqueId = null, techniqueLevels = {}) => {
  const unlocked = new Set(normalizeUnlockedTechniques(unlockedIds))
  const selected = (activeTechniqueId && unlocked.has(activeTechniqueId) ? getTechniqueById(activeTechniqueId) : null) || TECHNIQUES.find(technique => unlocked.has(technique.id)) || (Array.isArray(unlockedIds) && unlockedIds.length ? getTechniqueById(STARTER_TECHNIQUE_ID) : null)
  return selected ? getTechniqueAtLevel(selected.id, normalizeTechniqueLevels(techniqueLevels)[selected.id] || 1) : null
}
