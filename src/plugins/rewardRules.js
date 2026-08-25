import {
  getTechniqueById,
  normalizeStoredSkillIds,
  normalizeTechniqueFragments,
  normalizeTechniqueLevels
} from './techniques.js'

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
