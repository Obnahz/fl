export const STAGE_GOAL_VERSION = 1
export const STAGE_PREPARATION_KEYS = ['cultivation', 'exploration', 'alchemy', 'equipment', 'sect', 'cave', 'dungeon']

const finite = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const positive = value => Math.max(0, finite(value))

export const createStageGoal = (level = 1, createdAt = Date.now(), lastOutcome = null) => ({
  version: STAGE_GOAL_VERSION,
  id: `breakthrough-${Math.max(1, Math.floor(finite(level, 1)))}-${Math.floor(finite(createdAt, Date.now()))}`,
  kind: 'breakthrough',
  level: Math.max(1, Math.floor(finite(level, 1))),
  status: 'preparing',
  createdAt: finite(createdAt, Date.now()),
  preparations: Object.fromEntries(STAGE_PREPARATION_KEYS.map(key => [key, 0])),
  costs: Object.fromEntries(STAGE_PREPARATION_KEYS.map(key => [key, 0])),
  risks: Object.fromEntries(STAGE_PREPARATION_KEYS.map(key => [key, 0])),
  lastAction: null,
  outcome: null,
  lastOutcome: lastOutcome && typeof lastOutcome === 'object' ? { ...lastOutcome } : null
})

export const restartStageGoal = (stageGoal, level, createdAt = Date.now()) => {
  const state = normalizeStageGoal(stageGoal, level, createdAt)
  return createStageGoal(level, createdAt, state.outcome || state.lastOutcome)
}

export const normalizeStageGoal = (value, level = 1, now = Date.now()) => {
  const fallback = createStageGoal(level, now)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback

  const normalized = {
    ...fallback,
    ...value,
    version: STAGE_GOAL_VERSION,
    level: Math.max(1, Math.floor(finite(value.level, fallback.level))),
    status: ['preparing', 'ready', 'settled'].includes(value.status) ? value.status : 'preparing',
    createdAt: Math.max(0, finite(value.createdAt, fallback.createdAt)),
    preparations: { ...fallback.preparations },
    costs: { ...fallback.costs },
    risks: { ...fallback.risks },
    outcome: value.outcome && typeof value.outcome === 'object' ? { ...value.outcome } : null,
    lastOutcome: value.lastOutcome && typeof value.lastOutcome === 'object' ? { ...value.lastOutcome } : null,
    lastAction: typeof value.lastAction === 'string' ? value.lastAction : null
  }

  for (const key of STAGE_PREPARATION_KEYS) {
    normalized.preparations[key] = positive(value.preparations?.[key])
    normalized.costs[key] = positive(value.costs?.[key])
    normalized.risks[key] = positive(value.risks?.[key])
  }

  return normalized
}

export const recordStagePreparation = (stageGoal, key, { amount = 1, cost = 0, risk = 0, action = key } = {}) => {
  const state = normalizeStageGoal(stageGoal)
  if (!STAGE_PREPARATION_KEYS.includes(key) || state.status === 'settled') return state
  const next = {
    ...state,
    preparations: { ...state.preparations, [key]: state.preparations[key] + positive(amount) },
    costs: { ...state.costs, [key]: state.costs[key] + positive(cost) },
    risks: { ...state.risks, [key]: state.risks[key] + positive(risk) },
    lastAction: typeof action === 'string' ? action : key
  }
  const preparationCount = STAGE_PREPARATION_KEYS.reduce((total, item) => total + next.preparations[item], 0)
  return { ...next, status: preparationCount > 0 ? 'ready' : 'preparing' }
}

export const getStageGoalProgress = (stageGoal, { cultivation = 0, maxCultivation = 1 } = {}) => {
  const state = normalizeStageGoal(stageGoal)
  const cultivationProgress = Math.min(1, Math.max(0, finite(cultivation) / Math.max(1, finite(maxCultivation, 1))))
  const preparationProgress = Math.min(1, STAGE_PREPARATION_KEYS.reduce((total, key) => total + (state.preparations[key] > 0 ? 1 : 0), 0) / 2)
  return Math.round((cultivationProgress * 0.7 + preparationProgress * 0.3) * 100)
}

export const getStageStrategy = stageGoal => {
  const state = normalizeStageGoal(stageGoal)
  const used = key => (state.preparations[key] > 0 ? 1 : 0)
  const steady = used('cultivation') + used('cave') + used('sect')
  const venture = used('exploration') + used('alchemy') + used('equipment') + used('dungeon')
  if (steady <= 0 && venture <= 0) {
    return { id: 'unprepared', name: '尚未准备', chanceBonus: 0, lossMultiplier: 1, description: '按基础成功率突破' }
  }
  if (steady >= venture * 1.5) {
    return { id: 'steady', name: '稳修路线', chanceBonus: 0.03, lossMultiplier: 0.55, description: '成功率小幅提高，失败损失显著降低' }
  }
  if (venture >= steady * 1.5) {
    return { id: 'venture', name: '历练路线', chanceBonus: 0.09, lossMultiplier: 1.25, description: '成功率显著提高，但失败损失扩大' }
  }
  return { id: 'balanced', name: '均衡路线', chanceBonus: 0.06, lossMultiplier: 0.8, description: '兼顾成功率与失败保护' }
}

export const settleStageGoal = (stageGoal, { success = false, reason = '', settledAt = Date.now() } = {}) => {
  const state = normalizeStageGoal(stageGoal)
  if (state.status === 'settled') return state
  return {
    ...state,
    status: 'settled',
    outcome: {
      success: Boolean(success),
      reason: typeof reason === 'string' ? reason : '',
      settledAt: finite(settledAt, Date.now()),
      preparations: { ...state.preparations },
      costs: { ...state.costs },
      risks: { ...state.risks }
    }
  }
}

export const summarizeStageOutcome = stageGoal => {
  const state = normalizeStageGoal(stageGoal)
  const outcome = state.outcome || state.lastOutcome
  if (!outcome) return null
  const used = STAGE_PREPARATION_KEYS.filter(key => outcome.preparations[key] > 0)
  return {
    success: Boolean(outcome.success),
    reason: outcome.reason,
    usedPreparations: used,
    totalCost: Object.values(outcome.costs).reduce((total, value) => total + value, 0),
    totalRisk: Object.values(outcome.risks).reduce((total, value) => total + value, 0)
  }
}
