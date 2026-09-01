export const CAVE_OFFLINE_CAP_SECONDS = 8 * 60 * 60

export const CAVE_FACILITIES = [
  {
    id: 'spirit_array',
    name: '聚灵阵',
    description: '将离线时光转化为灵力，收益随当前吐纳效率变化。',
    rewardKey: 'spirit'
  },
  {
    id: 'forge_platform',
    name: '炼器台',
    description: '缓慢打磨强化石，适合准备装备强化时值守。',
    rewardKey: 'reinforceStones'
  }
]

export const getCaveFacilityById = id => CAVE_FACILITIES.find(facility => facility.id === id) || null

const normalizeTimestamp = (value, fallback) => {
  const timestamp = Number(value)
  return Number.isFinite(timestamp) && timestamp >= 0 ? Math.floor(timestamp) : fallback
}

const normalizeCount = value => {
  const count = Number(value)
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
}

const normalizeRemainder = value => {
  const remainder = Number(value)
  return Number.isFinite(remainder) && remainder >= 0 && remainder < 1 ? remainder : 0
}

const emptyPendingReward = () => ({ spirit: 0, reinforceStones: 0 })

const normalizeLastSettlement = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const facility = getCaveFacilityById(value.facilityId)
  if (!facility) return null

  const elapsedSeconds = Math.min(CAVE_OFFLINE_CAP_SECONDS, normalizeCount(value.elapsedSeconds))
  const settledAt = normalizeTimestamp(value.settledAt, 0)
  const amount = normalizeCount(value.reward?.[facility.rewardKey])

  return {
    facilityId: facility.id,
    elapsedSeconds,
    reward: amount > 0 ? { [facility.rewardKey]: amount } : {},
    settledAt
  }
}

export const createCaveState = (now = Date.now()) => ({
  activeFacilityId: 'spirit_array',
  lastSettledAt: normalizeTimestamp(now, Date.now()),
  pendingReward: emptyPendingReward(),
  productionRemainders: {
    spirit_array: 0,
    forge_platform: 0
  },
  lastSettlement: null,
  claimSequence: 0
})

export const normalizeCaveState = (value, fallbackAt = Date.now()) => {
  const fallbackTimestamp = normalizeTimestamp(fallbackAt, Date.now())
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const facility = getCaveFacilityById(source.activeFacilityId) || CAVE_FACILITIES[0]
  const pending = source.pendingReward && typeof source.pendingReward === 'object'
    ? source.pendingReward
    : {}
  const remainders = source.productionRemainders && typeof source.productionRemainders === 'object'
    ? source.productionRemainders
    : {}

  return {
    activeFacilityId: facility.id,
    lastSettledAt: normalizeTimestamp(source.lastSettledAt, fallbackTimestamp),
    pendingReward: {
      spirit: normalizeCount(pending.spirit),
      reinforceStones: normalizeCount(pending.reinforceStones)
    },
    productionRemainders: {
      spirit_array: normalizeRemainder(remainders.spirit_array),
      forge_platform: normalizeRemainder(remainders.forge_platform)
    },
    lastSettlement: normalizeLastSettlement(source.lastSettlement),
    claimSequence: normalizeCount(source.claimSequence)
  }
}

const getProductionRate = (facilityId, spiritRate) => {
  if (facilityId === 'forge_platform') return 1 / (30 * 60)
  const rate = Number(spiritRate)
  return Number.isFinite(rate) && rate > 0 ? rate : 1
}

export const settleCaveOffline = (state, { now = Date.now(), spiritRate = 1 } = {}) => {
  const next = normalizeCaveState(state, now)
  const checkedAt = Math.max(next.lastSettledAt, normalizeTimestamp(now, next.lastSettledAt))
  const elapsedMilliseconds = checkedAt - next.lastSettledAt
  const elapsedSeconds = Math.min(
    CAVE_OFFLINE_CAP_SECONDS,
    Math.max(0, Math.floor(elapsedMilliseconds / 1000))
  )
  if (elapsedSeconds === 0) return { state: next, reward: {}, elapsedSeconds: 0 }

  const settledAt = elapsedMilliseconds >= CAVE_OFFLINE_CAP_SECONDS * 1000
    ? checkedAt
    : next.lastSettledAt + elapsedSeconds * 1000

  const facility = getCaveFacilityById(next.activeFacilityId)
  const rate = getProductionRate(facility.id, spiritRate)
  const rawProduction = elapsedSeconds * rate + next.productionRemainders[facility.id]
  const amount = Math.floor(rawProduction + 1e-12)
  const remainder = Math.max(0, rawProduction - amount)
  const reward = amount > 0 ? { [facility.rewardKey]: amount } : {}
  const pendingReward = {
    ...next.pendingReward,
    [facility.rewardKey]: next.pendingReward[facility.rewardKey] + amount
  }

  return {
    state: {
      ...next,
      lastSettledAt: settledAt,
      pendingReward,
      productionRemainders: {
        ...next.productionRemainders,
        [facility.id]: remainder < 1e-12 ? 0 : remainder
      },
      lastSettlement: {
        facilityId: facility.id,
        elapsedSeconds,
        reward,
        settledAt
      }
    },
    reward,
    elapsedSeconds
  }
}

export const changeCaveFacility = (state, facilityId, options = {}) => {
  const next = normalizeCaveState(state, options.now)
  const facility = getCaveFacilityById(facilityId)
  if (!facility) return { state: next, success: false, reason: 'invalid_facility', settlement: null }
  if (next.activeFacilityId === facility.id) {
    return { state: next, success: false, reason: 'same_facility', settlement: null }
  }

  const settled = settleCaveOffline(next, options)
  return {
    state: { ...settled.state, activeFacilityId: facility.id },
    success: true,
    reason: null,
    settlement: settled.state.lastSettlement
  }
}

export const claimCaveRewards = (state, now = Date.now()) => {
  const next = normalizeCaveState(state, now)
  const reward = Object.fromEntries(
    Object.entries(next.pendingReward).filter(([, amount]) => amount > 0)
  )
  if (!Object.keys(reward).length) {
    return { state: next, success: false, reason: 'nothing_to_claim', settlement: null }
  }

  const claimedAt = normalizeTimestamp(now, Date.now())
  const claimSequence = next.claimSequence + 1
  return {
    state: {
      ...next,
      pendingReward: emptyPendingReward(),
      claimSequence
    },
    success: true,
    reason: null,
    settlement: {
      id: `cave:${claimSequence}:${claimedAt}`,
      source: 'cave',
      reward
    }
  }
}
