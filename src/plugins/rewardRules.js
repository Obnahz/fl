import {
  getTechniqueById,
  normalizeStoredSkillIds,
  normalizeTechniqueFragments,
  normalizeTechniqueLevels
} from './techniques.js'

const RESOURCE_REWARD_KEYS = [
  'spirit',
  'spiritStones',
  'reinforceStones',
  'refinementStones',
  'sectContribution'
]

const normalizeResourceAmount = value => {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0
}

export const applyResourceSettlement = ({ resources = {}, reward = {} } = {}) => {
  const next = Object.fromEntries(
    RESOURCE_REWARD_KEYS.map(key => [key, Math.max(0, Number(resources[key]) || 0)])
  )
  const applied = {}

  for (const key of RESOURCE_REWARD_KEYS) {
    const amount = normalizeResourceAmount(reward[key])
    if (!amount) continue
    next[key] += amount
    applied[key] = amount
  }

  return { resources: next, applied }
}

export const applySkillReward = ({
  skillId,
  unlockedSkills,
  techniqueLevels,
  techniqueFragments,
  duplicateFragments = 0
} = {}) => {
  const current = normalizeStoredSkillIds(unlockedSkills)
  const levels = normalizeTechniqueLevels(techniqueLevels)
  const fragments = normalizeTechniqueFragments(techniqueFragments)
  const technique = getTechniqueById(skillId)
  if (!technique) {
    return {
      valid: false,
      unlocked: false,
      fragmentsGained: 0,
      technique: null,
      unlockedSkills: current,
      techniqueLevels: levels,
      techniqueFragments: fragments
    }
  }
  if (current.includes(technique.id)) {
    const gained = Math.max(0, Math.floor(Number(duplicateFragments) || 0))
    return {
      valid: true,
      unlocked: false,
      fragmentsGained: gained,
      technique,
      unlockedSkills: current,
      techniqueLevels: levels,
      techniqueFragments: gained
        ? { ...fragments, [technique.id]: (fragments[technique.id] || 0) + gained }
        : fragments
    }
  }
  return {
    valid: true,
    unlocked: true,
    fragmentsGained: 0,
    technique,
    unlockedSkills: [...current, technique.id],
    techniqueLevels: { ...levels, [technique.id]: 1 },
    techniqueFragments: fragments
  }
}
