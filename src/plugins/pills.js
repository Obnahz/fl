import { getQualityInfo, getQualityPowerMultiplier, normalizeQuality, rollQuality } from './quality.js'

// 丹药品阶
export const pillGrades = {
  grade1: { name: '一品', difficulty: 1, successRate: 0.9 },
  grade2: { name: '二品', difficulty: 1.2, successRate: 0.8 },
  grade3: { name: '三品', difficulty: 1.5, successRate: 0.7 },
  grade4: { name: '四品', difficulty: 2, successRate: 0.6 },
  grade5: { name: '五品', difficulty: 2.5, successRate: 0.5 },
  grade6: { name: '六品', difficulty: 3, successRate: 0.4 },
  grade7: { name: '七品', difficulty: 4, successRate: 0.3 },
  grade8: { name: '八品', difficulty: 5, successRate: 0.2 },
  grade9: { name: '九品', difficulty: 6, successRate: 0.1 }
}

// 丹药类型
export const pillTypes = {
  spirit: { name: '灵力类', effectMultiplier: 1 },
  cultivation: { name: '修炼类', effectMultiplier: 1.2 },
  attribute: { name: '属性类', effectMultiplier: 1.5 },
  special: { name: '特殊类', effectMultiplier: 2 }
}

export const PILL_EFFECT_CAPS = {
  spiritRate: 0.75,
  cultivationRate: 1.5,
  cultivationEfficiency: 1,
  combatBoost: 0.6,
  allAttributes: 0.6,
  spiritCap: 1,
  autoHeal: 0.25,
  spiritRecovery: 0.8,
  comprehension: 0.6,
  fireAttribute: 0.75,
  resistanceBoost: 0.6
}

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, Number(value) || 0))

// 根据品阶计算所需残页数量
const getFragmentsNeeded = grade => {
  const gradeNumber = parseInt(grade.replace('grade', ''))
  return 5 * gradeNumber + 5 // 一品10个，二品15个，以此类推
}

// 丹方配置
export const pillRecipes = [
  {
    id: 'spirit_gathering',
    name: '聚灵丹',
    description: '提升灵力恢复速度的丹药',
    grade: 'grade1',
    type: 'spirit',
    materials: [
      { herb: 'spirit_grass', count: 2 },
      { herb: 'cloud_flower', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade1'),
    baseEffect: {
      type: 'spiritRate',
      value: 0.2,
      duration: 3600
    }
  },
  {
    id: 'cultivation_boost',
    name: '聚气丹',
    description: '提升修炼速度的丹药',
    grade: 'grade2',
    type: 'cultivation',
    materials: [
      { herb: 'cloud_flower', count: 2 },
      { herb: 'thunder_root', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade2'),
    baseEffect: {
      type: 'cultivationRate',
      value: 0.3,
      duration: 1800
    }
  },
  {
    id: 'thunder_power',
    name: '雷灵丹',
    description: '提升战斗属性的丹药',
    grade: 'grade3',
    type: 'attribute',
    materials: [
      { herb: 'thunder_root', count: 2 },
      { herb: 'dragon_breath_herb', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade3'),
    baseEffect: {
      type: 'combatBoost',
      value: 0.4,
      duration: 900
    }
  },
  {
    id: 'immortal_essence',
    name: '仙灵丹',
    description: '全属性提升的神奇丹药',
    grade: 'grade4',
    type: 'special',
    materials: [
      { herb: 'dragon_breath_herb', count: 2 },
      { herb: 'immortal_jade_grass', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade4'),
    baseEffect: {
      type: 'allAttributes',
      value: 0.5,
      duration: 600
    }
  },
  {
    id: 'five_elements_pill',
    name: '五行丹',
    description: '融合五行之力的神奇丹药，全面提升修炼者素质',
    grade: 'grade5',
    type: 'attribute',
    materials: [
      { herb: 'five_elements_grass', count: 2 },
      { herb: 'phoenix_feather_herb', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade5'),
    baseEffect: {
      type: 'allAttributes',
      value: 0.8,
      duration: 1200
    }
  },
  {
    id: 'celestial_essence_pill',
    name: '天元丹',
    description: '凝聚天地精华的极品丹药，大幅提升修炼速度',
    grade: 'grade6',
    type: 'cultivation',
    materials: [
      { herb: 'celestial_dew_grass', count: 2 },
      { herb: 'moonlight_orchid', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade6'),
    baseEffect: {
      type: 'cultivationRate',
      value: 1.0,
      duration: 1800
    }
  },
  {
    id: 'sun_moon_pill',
    name: '日月丹',
    description: '融合日月精华的丹药，能大幅提升灵力上限',
    grade: 'grade7',
    type: 'spirit',
    materials: [
      { herb: 'sun_essence_flower', count: 2 },
      { herb: 'moonlight_orchid', count: 2 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade7'),
    baseEffect: {
      type: 'spiritCap',
      value: 1.5,
      duration: 2400
    }
  },
  {
    id: 'phoenix_rebirth_pill',
    name: '涅槃丹',
    description: '蕴含不死凤凰之力的神丹，能在战斗中自动恢复生命',
    grade: 'grade8',
    type: 'special',
    materials: [
      { herb: 'phoenix_feather_herb', count: 3 },
      { herb: 'celestial_dew_grass', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade8'),
    baseEffect: {
      type: 'autoHeal',
      value: 0.1,
      duration: 3600
    }
  },
  {
    id: 'spirit_recovery',
    name: '回灵丹',
    description: '快速恢复灵力的丹药',
    grade: 'grade2',
    type: 'spirit',
    materials: [
      { herb: 'dark_yin_grass', count: 2 },
      { herb: 'frost_lotus', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade2'),
    baseEffect: {
      type: 'spiritRecovery',
      value: 0.4,
      duration: 1200
    }
  },
  {
    id: 'essence_condensation',
    name: '凝元丹',
    description: '提升修炼效率的高级丹药',
    grade: 'grade3',
    type: 'cultivation',
    materials: [
      { herb: 'nine_leaf_lingzhi', count: 2 },
      { herb: 'purple_ginseng', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade3'),
    baseEffect: {
      type: 'cultivationEfficiency',
      value: 0.5,
      duration: 1500
    }
  },
  {
    id: 'mind_clarity',
    name: '清心丹',
    description: '提升心境和悟性的丹药',
    grade: 'grade3',
    type: 'special',
    materials: [
      { herb: 'frost_lotus', count: 2 },
      { herb: 'fire_heart_flower', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade3'),
    baseEffect: {
      type: 'comprehension',
      value: 0.3,
      duration: 2400
    }
  },
  {
    id: 'fire_essence',
    name: '火元丹',
    description: '提升火属性修炼速度的丹药',
    grade: 'grade4',
    type: 'attribute',
    materials: [
      { herb: 'fire_heart_flower', count: 2 },
      { herb: 'dragon_breath_herb', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade4'),
    baseEffect: {
      type: 'fireAttribute',
      value: 0.6,
      duration: 1800
    }
  }
]

pillRecipes.push(
  { id: 'azure_meridian_pill', name: '青冥通脉丹', description: '提升修炼效率并加快灵力恢复。', grade: 'grade4', type: 'cultivation', materials: [{ herb: 'azure_lotus', count: 2 }, { herb: 'void_moss', count: 1 }], fragmentsNeeded: getFragmentsNeeded('grade4'), baseEffect: { type: 'cultivationEfficiency', value: 0.42, duration: 2100 } },
  { id: 'chaos_guard_pill', name: '混沌护元丹', description: '短时间内提升战斗抗性。', grade: 'grade5', type: 'special', materials: [{ herb: 'chaos_orchid', count: 1 }, { herb: 'golden_sun_root', count: 2 }], fragmentsNeeded: getFragmentsNeeded('grade5'), baseEffect: { type: 'resistanceBoost', value: 0.18, duration: 1800 } }
)
pillRecipes.push(
  { id: 'soul_focusing_pill', name: '凝魂悟道丹', description: '提升悟性，缩短功法成长周期。', grade: 'grade6', type: 'special', materials: [{ herb: 'soul_lotus', count: 2 }, { herb: 'starvine', count: 1 }], fragmentsNeeded: getFragmentsNeeded('grade6'), baseEffect: { type: 'comprehension', value: 0.24, duration: 2400 } },
  { id: 'nine_sun_pill', name: '九阳淬体丹', description: '大幅强化战斗体魄。', grade: 'grade7', type: 'attribute', materials: [{ herb: 'nine_sun_fruit', count: 1 }, { herb: 'earthheart_root', count: 2 }], fragmentsNeeded: getFragmentsNeeded('grade7'), baseEffect: { type: 'allAttributes', value: 0.2, duration: 1800 } },
  { id: 'star_recovery_pill', name: '星回灵丹', description: '持续恢复灵力并提高灵力上限。', grade: 'grade5', type: 'spirit', materials: [{ herb: 'starvine', count: 2 }, { herb: 'nine_sun_fruit', count: 1 }], fragmentsNeeded: getFragmentsNeeded('grade5'), baseEffect: { type: 'spiritRecovery', value: 0.3, duration: 2400 } }
)

// 计算丹药实际效果（基于玩家境界）
pillRecipes.push(
  { id: 'jade_phoenix_pill', name: '\u7389\u51e4\u5b9a\u9b42\u4e39', description: '\u7a33\u56fa\u795e\u9b42\u5e76\u63d0\u5347\u609f\u6027\u3002', grade: 'grade6', type: 'special', materials: [{ herb: 'jade_phoenix_grass', count: 2 }, { herb: 'soul_lotus', count: 1 }], fragmentsNeeded: getFragmentsNeeded('grade6'), baseEffect: { type: 'comprehension', value: 0.3, duration: 2700 } },
  { id: 'origin_tempering_pill', name: '\u9053\u6e90\u6dcb\u4f53\u4e39', description: '\u63d0\u5347\u5168\u5c5e\u6027\uff0c\u9002\u5408\u9ad8\u9636\u6218\u6597\u3002', grade: 'grade7', type: 'attribute', materials: [{ herb: 'origin_sand', count: 2 }, { herb: 'earthheart_root', count: 1 }], fragmentsNeeded: getFragmentsNeeded('grade7'), baseEffect: { type: 'allAttributes', value: 0.24, duration: 2100 } },
  { id: 'thunder_meridian_pill', name: '\u5929\u96f7\u901a\u8109\u4e39', description: '\u4ee5\u5929\u96f7\u4e4b\u529b\u5927\u5e45\u63d0\u5347\u4fee\u70bc\u6548\u7387\u3002', grade: 'grade8', type: 'cultivation', materials: [{ herb: 'heavenly_thunder_bloom', count: 2 }, { herb: 'azure_lotus', count: 1 }], fragmentsNeeded: getFragmentsNeeded('grade8'), baseEffect: { type: 'cultivationEfficiency', value: 0.58, duration: 2400 } },
  { id: 'daluo_guard_pill', name: '\u5927\u7f57\u62a4\u9053\u4e39', description: '\u77ed\u65f6\u95f4\u5185\u5927\u5e45\u63d0\u5347\u6218\u6597\u6297\u6027\u3002', grade: 'grade9', type: 'special', materials: [{ herb: 'daluo_fruit', count: 1 }, { herb: 'chaos_orchid', count: 2 }], fragmentsNeeded: getFragmentsNeeded('grade9'), baseEffect: { type: 'resistanceBoost', value: 0.28, duration: 2100 } }
)

export const calculatePillEffect = (recipe, playerLevel) => {
  const grade = pillGrades[recipe.grade]
  const type = pillTypes[recipe.type]
  const normalizedLevel = Math.max(1, Math.floor(Number(playerLevel) || 1))
  const levelMultiplier = Math.min(2, 1 + (normalizedLevel - 1) * 0.03)
  const effectType = recipe.baseEffect.type
  const cap = PILL_EFFECT_CAPS[effectType] ?? 1
  return {
    type: effectType,
    value: clamp(recipe.baseEffect.value * type.effectMultiplier * levelMultiplier, 0, cap),
    duration: Math.min(8 * 60 * 60, Math.max(1, Math.floor(Number(recipe.baseEffect.duration) || 1))),
    successRate: grade.successRate
  }
}

export const createQualityPillEffect = (recipe, playerLevel, qualityRoll = Math.random()) => {
  const quality = rollQuality(playerLevel, qualityRoll)
  const baseEffect = calculatePillEffect(recipe, playerLevel)
  const cap = PILL_EFFECT_CAPS[baseEffect.type] ?? 1
  return {
    quality,
    qualityInfo: getQualityInfo(quality),
    effect: {
      ...baseEffect,
      value: clamp(baseEffect.value * getQualityPowerMultiplier(quality, playerLevel), 0, cap)
    }
  }
}

export const normalizePillQuality = pill => {
  const quality = normalizeQuality(pill?.quality)
  return { ...pill, quality, qualityInfo: getQualityInfo(quality) }
}

export const normalizeActivePillEffects = (effects, now = Date.now()) => {
  const checkedAt = Number.isFinite(Number(now)) ? Number(now) : Date.now()
  if (!Array.isArray(effects)) return []
  return effects
    .filter(effect => effect && Number(effect.endTime) > checkedAt)
    .map(effect => {
      const cap = PILL_EFFECT_CAPS[effect.type] ?? 1
      return { ...effect, value: clamp(effect.value, 0, cap), endTime: Number(effect.endTime) }
    })
}

export const getActivePillBonuses = (effects, now = Date.now()) =>
  normalizeActivePillEffects(effects, now).reduce((bonuses, effect) => {
    bonuses[effect.type] = (bonuses[effect.type] || 0) + effect.value
    return bonuses
  }, {})

// 尝试合成丹药
export const tryCreatePill = (recipe, herbs, player, fragments = 0, luck = 1, roll = Math.random()) => {
  // 检查材料是否足够
  for (const material of recipe.materials) {
    const herbCount = herbs.filter(h => h.id === material.herb).length
    if (herbCount < material.count) {
      return { success: false, message: '材料不足' }
    }
  }
  // 检查丹方是否完整（只有在未掌握完整丹方时才检查残页数量）
  if (!player.pillRecipes.includes(recipe.id) && fragments < recipe.fragmentsNeeded) {
    return { success: false, message: '丹方不完整' }
  }
  // 计算成功率（受幸运值影响）
  const grade = pillGrades[recipe.grade]
  const successRate = clamp(grade.successRate * Math.max(0, Number(luck) || 0), 0.05, 0.95)
  const normalizedRoll = clamp(roll, 0, 0.999999)
  if (normalizedRoll >= successRate) {
    return { success: false, message: '炼制失败', successRate }
  }
  return { success: true, message: '炼制成功', successRate }
}
