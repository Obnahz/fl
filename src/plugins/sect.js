export const MAX_SECT_LEVEL = 5
export const MAX_SECT_CONTRIBUTION = 999999
export const DIRECTION_SWITCH_COST = 60
export const DIRECTION_SWITCH_COOLDOWN_MS = 24 * 60 * 60 * 1000
export const SHOP_DAILY_REFRESH_LIMIT = 1

const SHOP_OFFER_COUNT = 3
export const SHOP_REFRESH_COST = 30

export const COMMISSION_DEFINITIONS = {
  short: {
    name: '\u5c71\u95e8\u5de1\u5b88',
    durationMs: 10 * 60 * 1000,
    cost: { spirit: 120 },
    reward: { sectContribution: 25 }
  },
  timed: {
    name: '\u7075\u7530\u7167\u6599',
    durationMs: 45 * 60 * 1000,
    cost: { spirit: 300, spiritStones: 20 },
    reward: { sectContribution: 40 }
  },
  challenge: {
    name: '\u8bd5\u5251\u6311\u6218',
    durationMs: 2 * 60 * 60 * 1000,
    cost: { spirit: 600, spiritStones: 50 },
    reward: { sectContribution: 55 }
  }
}

export const SECT_SHOP_ITEMS = [
  { id: 'spirit_bundle', name: '\u805a\u7075\u6563', contributionCost: 25, purchaseLimit: 2, reward: { spirit: 300 } },
  { id: 'stone_pouch', name: '\u7075\u77f3\u888b', contributionCost: 35, purchaseLimit: 2, reward: { spiritStones: 100 } },
  { id: 'reinforce_bundle', name: '\u953b\u5668\u77f3\u5323', contributionCost: 60, purchaseLimit: 1, reward: { reinforceStones: 10 } },
  { id: 'refinement_bundle', name: '\u6d17\u70bc\u77f3\u5323', contributionCost: 75, purchaseLimit: 1, reward: { refinementStones: 10 } }
]

export const SECTS = [
  {
    id: 'azure_cloud',
    name: '\u9752\u4e91\u5b97',
    description: '\u6ce8\u91cd\u5410\u7eb3\u4e0e\u6839\u57fa\uff0c\u4fee\u884c\u8fdb\u5883\u7a33\u5065\u3002',
    bonuses: { spiritRate: 1.03 }
  },
  {
    id: 'wandering_sword',
    name: '\u6e38\u5251\u95e8',
    description: '\u4ee5\u5386\u7ec3\u78e8\u783a\u9053\u5fc3\uff0c\u64c5\u957f\u5728\u6218\u6597\u4e2d\u7d2f\u79ef\u8d44\u6e90\u3002',
    bonuses: { combatRewardRate: 1.03 }
  },
  {
    id: 'verdant_cauldron',
    name: '\u4e39\u971e\u8c37',
    description: '\u4e39\u9053\u4e0e\u836f\u7406\u5e76\u91cd\uff0c\u6536\u96c6\u7075\u836f\u65f6\u66f4\u6709\u5fc3\u5f97\u3002',
    bonuses: { herbYieldRate: 1.04 }
  }
]

export const CULTIVATION_DIRECTIONS = [
  {
    id: 'cultivation',
    name: '\u9759\u4fee',
    description: '\u4e13\u6ce8\u65e5\u5e38\u4fee\u70bc\u4e0e\u4fee\u4e3a\u79ef\u7d2f\u3002',
    bonuses: { cultivationRate: 1.06 }
  },
  {
    id: 'exploration',
    name: '\u5386\u7ec3',
    description: '\u4e13\u6ce8\u4e0b\u5c71\u5386\u7ec3\u7684\u8d44\u6e90\u6536\u83b7\u3002',
    bonuses: { explorationRewardRate: 1.06 }
  },
  {
    id: 'alchemy',
    name: '\u4e39\u9053',
    description: '\u4e13\u6ce8\u70bc\u4e39\u65f6\u7684\u706b\u5019\u4e0e\u6210\u529f\u7387\u3002',
    bonuses: { alchemySuccessRate: 1.05 }
  },
  {
    id: 'dungeon',
    name: '\u79d8\u5883',
    description: '\u4e13\u6ce8\u79d8\u5883\u6311\u6218\u4e2d\u7684\u989d\u5916\u6536\u83b7\u3002',
    bonuses: { dungeonRewardRate: 1.06 }
  }
]

const SECT_UPGRADE_COSTS = [120, 300, 650, 1200]

export const getSectById = id => SECTS.find(sect => sect.id === id) || null

export const getCultivationDirectionById = id =>
  CULTIVATION_DIRECTIONS.find(direction => direction.id === id) || null

export const createSectState = () => ({
  sectId: null,
  level: 0,
  contribution: 0,
  directionId: null,
  directionChangedAt: null
})

const normalizeInteger = (value, minimum, maximum) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return minimum
  return Math.min(maximum, Math.max(minimum, Math.floor(number)))
}

const normalizeTimestamp = value => {
  if (value === null || value === undefined || value === '') return null
  const timestamp = typeof value === 'string' ? Date.parse(value) : Number(value)
  return Number.isFinite(timestamp) && timestamp >= 0 ? Math.floor(timestamp) : null
}

const isObject = value => value && typeof value === 'object' && !Array.isArray(value)

const normalizeDateKey = value => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const timestamp = Date.parse(`${value}T00:00:00.000Z`)
    if (Number.isFinite(timestamp)) return value
  }
  return new Date().toISOString().slice(0, 10)
}

const cloneReward = reward => Object.fromEntries(
  Object.entries(isObject(reward) ? reward : {})
    .map(([key, amount]) => [key, normalizeInteger(amount, 0, MAX_SECT_CONTRIBUTION)])
    .filter(([, amount]) => amount > 0)
)

const normalizeCommission = (value, id) => {
  if (!isObject(value) || !COMMISSION_DEFINITIONS[id]) return null
  const startedAt = normalizeTimestamp(value.startedAt)
  const completesAt = normalizeTimestamp(value.completesAt)
  if (startedAt === null || completesAt === null || completesAt < startedAt) return null
  return {
    id,
    startedAt,
    completesAt,
    claimed: value.claimed === true,
    claimedAt: value.claimed === true ? normalizeTimestamp(value.claimedAt) : null
  }
}

const getDateSeed = dateKey => Array.from(dateKey).reduce(
  (seed, character) => (seed * 31 + character.charCodeAt(0)) >>> 0,
  0
)

export const createSectOperationsState = (dateKey = new Date().toISOString().slice(0, 10)) => ({
  commissions: {},
  shop: {
    dateKey: normalizeDateKey(dateKey),
    rotation: 0,
    refreshCount: 0,
    purchases: {}
  }
})

export const normalizeSectOperationsState = (value, dateKey) => {
  const source = isObject(value) ? value : {}
  const sourceShop = isObject(source.shop) ? source.shop : {}
  const activeDateKey = normalizeDateKey(dateKey ?? sourceShop.dateKey)
  const commissions = {}

  for (const id of Object.keys(COMMISSION_DEFINITIONS)) {
    const commission = normalizeCommission(isObject(source.commissions) ? source.commissions[id] : null, id)
    if (commission) commissions[id] = commission
  }

  if (sourceShop.dateKey !== activeDateKey) {
    return createSectOperationsState(activeDateKey)
  }

  const purchases = {}
  for (const item of SECT_SHOP_ITEMS) {
    const count = normalizeInteger(
      isObject(sourceShop.purchases) ? sourceShop.purchases[item.id] : 0,
      0,
      item.purchaseLimit
    )
    if (count > 0) purchases[item.id] = count
  }

  return {
    commissions,
    shop: {
      dateKey: activeDateKey,
      rotation: normalizeInteger(sourceShop.rotation, 0, Number.MAX_SAFE_INTEGER),
      refreshCount: normalizeInteger(sourceShop.refreshCount, 0, SHOP_DAILY_REFRESH_LIMIT),
      purchases
    }
  }
}

export const getCommissionStatus = (commission, now = Date.now()) => {
  if (!isObject(commission)) return 'available'
  if (commission.claimed === true) return 'claimed'
  const completesAt = normalizeTimestamp(commission.completesAt)
  if (completesAt === null) return 'available'
  const checkedAt = normalizeTimestamp(now) ?? Date.now()
  return checkedAt >= completesAt ? 'claimable' : 'active'
}

export const startSectCommission = (state, commissionId, resources, now = Date.now()) => {
  const next = normalizeSectOperationsState(state)
  const definition = COMMISSION_DEFINITIONS[commissionId]
  if (!definition) return { state: next, success: false, reason: 'invalid_commission', cost: {} }
  if (next.commissions[commissionId]) {
    return { state: next, success: false, reason: 'already_started', cost: { ...definition.cost } }
  }

  const available = isObject(resources) ? resources : {}
  const canAfford = Object.entries(definition.cost).every(([key, amount]) =>
    normalizeInteger(available[key], 0, MAX_SECT_CONTRIBUTION) >= amount
  )
  if (!canAfford) {
    return { state: next, success: false, reason: 'insufficient_resources', cost: { ...definition.cost } }
  }

  const startedAt = normalizeTimestamp(now) ?? Date.now()
  const commission = {
    id: commissionId,
    startedAt,
    completesAt: startedAt + definition.durationMs,
    claimed: false,
    claimedAt: null
  }
  return {
    state: { ...next, commissions: { ...next.commissions, [commissionId]: commission } },
    success: true,
    reason: null,
    cost: { ...definition.cost },
    commission
  }
}

export const claimSectCommission = (state, commissionId, now = Date.now()) => {
  const next = normalizeSectOperationsState(state)
  const definition = COMMISSION_DEFINITIONS[commissionId]
  if (!definition) return { state: next, success: false, reason: 'invalid_commission', settlement: null }
  const commission = next.commissions[commissionId]
  if (!commission) return { state: next, success: false, reason: 'not_started', settlement: null }
  const status = getCommissionStatus(commission, now)
  if (status === 'claimed') return { state: next, success: false, reason: 'already_claimed', settlement: null }
  if (status !== 'claimable') return { state: next, success: false, reason: 'not_ready', settlement: null }

  const claimedAt = normalizeTimestamp(now) ?? Date.now()
  const claimed = { ...commission, claimed: true, claimedAt }
  return {
    state: { ...next, commissions: { ...next.commissions, [commissionId]: claimed } },
    success: true,
    reason: null,
    settlement: {
      id: `commission:${commissionId}:${commission.startedAt}`,
      source: 'commission',
      reward: cloneReward(definition.reward)
    }
  }
}

export const getSectShopOffers = (state, dateKey) => {
  const next = normalizeSectOperationsState(state, dateKey)
  const start = (getDateSeed(next.shop.dateKey) + next.shop.rotation) % SECT_SHOP_ITEMS.length
  return Array.from({ length: Math.min(SHOP_OFFER_COUNT, SECT_SHOP_ITEMS.length) }, (_, offset) => {
    const item = SECT_SHOP_ITEMS[(start + offset) % SECT_SHOP_ITEMS.length]
    return { ...item, reward: cloneReward(item.reward) }
  })
}

export const refreshSectShop = (state, contribution, dateKey) => {
  const next = normalizeSectOperationsState(state, dateKey)
  if (next.shop.refreshCount >= SHOP_DAILY_REFRESH_LIMIT) {
    return { state: next, success: false, reason: 'refresh_limit', contributionCost: SHOP_REFRESH_COST }
  }
  if (normalizeInteger(contribution, 0, MAX_SECT_CONTRIBUTION) < SHOP_REFRESH_COST) {
    return { state: next, success: false, reason: 'insufficient_contribution', contributionCost: SHOP_REFRESH_COST }
  }
  return {
    state: {
      ...next,
      shop: {
        ...next.shop,
        rotation: next.shop.rotation + 1,
        refreshCount: next.shop.refreshCount + 1
      }
    },
    success: true,
    reason: null,
    contributionCost: SHOP_REFRESH_COST
  }
}

export const purchaseSectShopItem = (state, itemId, contribution, dateKey) => {
  const next = normalizeSectOperationsState(state, dateKey)
  const item = getSectShopOffers(next, next.shop.dateKey).find(offer => offer.id === itemId)
  if (!item) return { state: next, success: false, reason: 'item_unavailable', contributionCost: 0, settlement: null }
  const purchased = next.shop.purchases[item.id] || 0
  if (purchased >= item.purchaseLimit) {
    return { state: next, success: false, reason: 'purchase_limit', contributionCost: item.contributionCost, settlement: null }
  }
  if (normalizeInteger(contribution, 0, MAX_SECT_CONTRIBUTION) < item.contributionCost) {
    return { state: next, success: false, reason: 'insufficient_contribution', contributionCost: item.contributionCost, settlement: null }
  }

  const purchaseNumber = purchased + 1
  return {
    state: {
      ...next,
      shop: {
        ...next.shop,
        purchases: { ...next.shop.purchases, [item.id]: purchaseNumber }
      }
    },
    success: true,
    reason: null,
    contributionCost: item.contributionCost,
    settlement: {
      id: `sect_shop:${next.shop.dateKey}:${item.id}:${purchaseNumber}`,
      source: 'sect_shop',
      reward: cloneReward(item.reward)
    }
  }
}

export const normalizeSectState = value => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const sectId = source.sectId ?? source.sect ?? null
  if (!getSectById(sectId)) return createSectState()

  const directionId = source.directionId ?? source.cultivationDirection ?? null
  const validDirectionId = getCultivationDirectionById(directionId) ? directionId : null
  const changedAt = validDirectionId ? normalizeTimestamp(source.directionChangedAt) : null

  return {
    sectId,
    level: normalizeInteger(source.level ?? source.sectLevel ?? 1, 1, MAX_SECT_LEVEL),
    contribution: normalizeInteger(
      source.contribution ?? source.sectContribution ?? 0,
      0,
      MAX_SECT_CONTRIBUTION
    ),
    directionId: validDirectionId,
    directionChangedAt: changedAt
  }
}

export const joinSect = (state, sectId) => {
  const next = normalizeSectState(state)
  if (!getSectById(sectId)) return { state: next, success: false, reason: 'invalid_sect' }
  if (next.sectId) return { state: next, success: false, reason: 'already_joined' }
  return {
    state: { ...createSectState(), sectId, level: 1 },
    success: true,
    reason: null
  }
}

export const addSectContribution = (state, amount) => {
  const next = normalizeSectState(state)
  if (!next.sectId) return next
  const gained = normalizeInteger(amount, 0, MAX_SECT_CONTRIBUTION)
  return {
    ...next,
    contribution: Math.min(MAX_SECT_CONTRIBUTION, next.contribution + gained)
  }
}

export const getSectUpgradeCost = level => {
  const normalizedLevel = normalizeInteger(level, 1, MAX_SECT_LEVEL)
  return normalizedLevel >= MAX_SECT_LEVEL ? null : SECT_UPGRADE_COSTS[normalizedLevel - 1]
}

export const upgradeSect = state => {
  const next = normalizeSectState(state)
  if (!next.sectId) return { state: next, success: false, reason: 'not_joined', cost: null }
  const cost = getSectUpgradeCost(next.level)
  if (cost === null) return { state: next, success: false, reason: 'max_level', cost: null }
  if (next.contribution < cost) {
    return { state: next, success: false, reason: 'insufficient_contribution', cost }
  }
  return {
    state: { ...next, level: next.level + 1, contribution: next.contribution - cost },
    success: true,
    reason: null,
    cost
  }
}

export const changeCultivationDirection = (state, directionId, now = Date.now()) => {
  const next = normalizeSectState(state)
  const direction = getCultivationDirectionById(directionId)
  if (!next.sectId) return { state: next, success: false, reason: 'not_joined', cost: 0 }
  if (!direction) return { state: next, success: false, reason: 'invalid_direction', cost: 0 }
  if (next.directionId === direction.id) {
    return { state: next, success: false, reason: 'same_direction', cost: 0 }
  }

  const changedAt = normalizeTimestamp(now) ?? Date.now()
  const firstSelection = next.directionId === null
  if (!firstSelection && next.directionChangedAt !== null) {
    const elapsed = Math.max(0, changedAt - next.directionChangedAt)
    if (elapsed < DIRECTION_SWITCH_COOLDOWN_MS) {
      return {
        state: next,
        success: false,
        reason: 'cooldown',
        cost: DIRECTION_SWITCH_COST,
        remainingCooldownMs: DIRECTION_SWITCH_COOLDOWN_MS - elapsed
      }
    }
  }
  if (!firstSelection && next.contribution < DIRECTION_SWITCH_COST) {
    return {
      state: next,
      success: false,
      reason: 'insufficient_contribution',
      cost: DIRECTION_SWITCH_COST
    }
  }

  const cost = firstSelection ? 0 : DIRECTION_SWITCH_COST
  return {
    state: {
      ...next,
      contribution: next.contribution - cost,
      directionId: direction.id,
      directionChangedAt: changedAt
    },
    success: true,
    reason: null,
    cost,
    remainingCooldownMs: DIRECTION_SWITCH_COOLDOWN_MS
  }
}

export const getActiveSectBonuses = state => {
  const next = normalizeSectState(state)
  const sect = getSectById(next.sectId)
  if (!sect) return {}
  const direction = getCultivationDirectionById(next.directionId)
  return direction ? { ...sect.bonuses, ...direction.bonuses } : { ...sect.bonuses }
}

const normalizeRewardRate = value => {
  const rate = Number(value)
  return Number.isFinite(rate) && rate >= 1 ? Math.min(2, rate) : 1
}

export const getSectRewardMultiplier = (bonuses = {}, { source, rewardType } = {}) => {
  const scalableRewardTypes = new Set([
    'spirit',
    'spirit_stone',
    'spirit_stones',
    'herb',
    'cultivation',
    'pill_fragment'
  ])
  if (!scalableRewardTypes.has(rewardType)) return 1
  let multiplier = 1
  if (source === 'exploration' || source === 'exploration_combat') {
    multiplier *= normalizeRewardRate(bonuses.explorationRewardRate)
  }
  if (source === 'exploration_combat' || source === 'dungeon') {
    multiplier *= normalizeRewardRate(bonuses.combatRewardRate)
  }
  if (source === 'dungeon') {
    multiplier *= normalizeRewardRate(bonuses.dungeonRewardRate)
  }
  if (rewardType === 'herb') {
    multiplier *= normalizeRewardRate(bonuses.herbYieldRate)
  }
  return multiplier
}

export const applySectRewardBonus = (reward, bonuses, { source, roll = Math.random() } = {}) => {
  const sourceReward = isObject(reward) ? reward : {}
  const baseAmount = normalizeInteger(sourceReward.amount, 0, MAX_SECT_CONTRIBUTION)
  const multiplier = getSectRewardMultiplier(bonuses, {
    source,
    rewardType: sourceReward.type
  })
  const scaledAmount = baseAmount * multiplier
  const wholeAmount = Math.floor(scaledAmount)
  const remainder = scaledAmount - wholeAmount
  const normalizedRoll = Math.min(0.999999, Math.max(0, Number.isFinite(Number(roll)) ? Number(roll) : 0.5))

  return {
    ...sourceReward,
    amount: wholeAmount + (normalizedRoll + 1e-12 < remainder ? 1 : 0),
    baseAmount,
    multiplier
  }
}
