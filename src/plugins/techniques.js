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

TECHNIQUES.push(
  { id: 'azure_heaven_scripture', name: '青天化气诀', description: '借青天灵气稳固经脉，持续破除护体真气。', style: 'armor_break', styleName: '青天破障', armorPenetration: 0.22, armorPenetrationPerLevel: 0.05, damageMultiplier: 1.2, damagePerLevel: 0.1, cooldownRounds: 3, maxLevel: 5, duplicateFragments: 3 },
  { id: 'golden_body_canon', name: '金身镇岳经', description: '凝练金身，以沉稳重击压制强敌。', style: 'critical_burst', styleName: '金身震岳', critRateBonus: 0.06, critRateBonusPerLevel: 0.025, damageMultiplier: 1.32, damagePerLevel: 0.1, cooldownRounds: 2, maxLevel: 5, duplicateFragments: 3 }
)
TECHNIQUES.push(
  { id: 'star_river_sutra', name: '星河炼体经', description: '借星河之力淬炼肉身，攻守兼备。', style: 'critical_burst', styleName: '星河坠击', critRateBonus: 0.1, critRateBonusPerLevel: 0.025, damageMultiplier: 1.42, damagePerLevel: 0.11, cooldownRounds: 3, maxLevel: 5, duplicateFragments: 4 },
  { id: 'earth_guardian_arts', name: '厚土镇岳功', description: '引地脉护体，擅长持久作战。', style: 'armor_break', styleName: '镇岳破甲', armorPenetration: 0.18, armorPenetrationPerLevel: 0.045, damageMultiplier: 1.28, damagePerLevel: 0.1, cooldownRounds: 2, maxLevel: 5, duplicateFragments: 4 },
  { id: 'wind_chase_blade', name: '逐风追云诀', description: '身随风动，连续出手不留破绽。', style: 'critical_burst', styleName: '逐风连斩', critRateBonus: 0.09, critRateBonusPerLevel: 0.03, damageMultiplier: 1.36, damagePerLevel: 0.12, cooldownRounds: 2, maxLevel: 5, duplicateFragments: 4 },
  { id: 'void_return_method', name: '虚空回元法', description: '借虚空回响撕裂护体真气。', style: 'armor_break', styleName: '虚空蚀甲', armorPenetration: 0.3, armorPenetrationPerLevel: 0.05, damageMultiplier: 1.24, damagePerLevel: 0.12, cooldownRounds: 4, maxLevel: 5, duplicateFragments: 5 }
)

TECHNIQUES.push(
  { id: 'jade_phoenix_heart', name: '\u7389\u51e4\u5b9a\u9b42\u7bc7', description: '\u4ee5\u51e4\u706b\u6e29\u517b\u795e\u9b42\uff0c\u5728\u6301\u4e45\u6218\u4e2d\u7a33\u5b9a\u8f93\u51fa\u3002', style: 'critical_burst', styleName: '\u51e4\u706b\u51b3\u88c2', critRateBonus: 0.11, critRateBonusPerLevel: 0.028, damageMultiplier: 1.48, damagePerLevel: 0.12, cooldownRounds: 3, maxLevel: 5, duplicateFragments: 5 },
  { id: 'origin_sand_domain', name: '\u9053\u6e90\u9547\u57df\u7bc7', description: '\u4ee5\u539a\u91cd\u9053\u57df\u538b\u5236\u654c\u4eba\u62a4\u4f53\u3002', style: 'armor_break', styleName: '\u9053\u57df\u7834\u969c', armorPenetration: 0.32, armorPenetrationPerLevel: 0.05, damageMultiplier: 1.3, damagePerLevel: 0.12, cooldownRounds: 4, maxLevel: 5, duplicateFragments: 5 },
  { id: 'heavenly_thunder_gate', name: '\u5929\u96f7\u5f00\u95e8\u7bc7', description: '\u5f15\u5929\u96f7\u5165\u4f53\uff0c\u4ee5\u7206\u53d1\u6362\u53d6\u9ad8\u9891\u51fa\u624b\u3002', style: 'critical_burst', styleName: '\u5929\u96f7\u8fde\u73af', critRateBonus: 0.14, critRateBonusPerLevel: 0.025, damageMultiplier: 1.56, damagePerLevel: 0.13, cooldownRounds: 4, maxLevel: 5, duplicateFragments: 6 }
)

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
