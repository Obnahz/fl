export const MARKET_DAILY_OFFER_COUNT = 6
export const MARKET_DAILY_REFRESH_LIMIT = 1
export const MARKET_REFRESH_COST = 120

const MARKET_CATALOG = [
  { id: 'spirit_small', name: '聚灵散', description: '补充 300 点灵力。', price: 80, purchaseLimit: 2, reward: { spirit: 300 } },
  { id: 'spirit_large', name: '灵泉玉瓶', description: '补充 800 点灵力。', price: 180, purchaseLimit: 1, reward: { spirit: 800 } },
  { id: 'reinforce_bundle', name: '强化石匣', description: '获得 10 枚强化石。', price: 120, purchaseLimit: 2, reward: { reinforceStones: 10 } },
  { id: 'refinement_bundle', name: '洗炼石匣', description: '获得 10 枚洗炼石。', price: 120, purchaseLimit: 2, reward: { refinementStones: 10 } },
  { id: 'spirit_reserve', name: '凝气玉符', description: '获得 1500 点灵力，为下一次闭关准备。', price: 300, purchaseLimit: 1, reward: { spirit: 1500 } },
  { id: 'reinforce_large', name: '百炼石箱', description: '获得 30 枚强化石。', price: 300, purchaseLimit: 1, reward: { reinforceStones: 30 } },
  { id: 'refinement_large', name: '天工石箱', description: '获得 30 枚洗炼石。', price: 300, purchaseLimit: 1, reward: { refinementStones: 30 } },
  { id: 'spirit_stones', name: '回灵玉髓', description: '获得 2500 点灵力，适合冲击境界。', price: 450, purchaseLimit: 1, reward: { spirit: 2500 } }
]

const isObject = value => value && typeof value === 'object' && !Array.isArray(value)

const normalizeDateKey = value => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return new Date().toISOString().slice(0, 10)
}

const normalizeInteger = (value, minimum, maximum) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return minimum
  return Math.min(maximum, Math.max(minimum, Math.floor(number)))
}

const getDateSeed = dateKey => Array.from(dateKey).reduce(
  (seed, character) => (seed * 31 + character.charCodeAt(0)) >>> 0,
  0
)

export const createMarketState = (dateKey = new Date().toISOString().slice(0, 10)) => ({
  dateKey: normalizeDateKey(dateKey),
  rotation: 0,
  refreshCount: 0,
  purchases: {}
})

export const normalizeMarketState = (value, dateKey) => {
  const activeDateKey = normalizeDateKey(dateKey ?? value?.dateKey)
  if (!isObject(value) || value.dateKey !== activeDateKey) return createMarketState(activeDateKey)

  const purchases = {}
  for (const item of MARKET_CATALOG) {
    const count = normalizeInteger(value.purchases?.[item.id], 0, item.purchaseLimit)
    if (count > 0) purchases[item.id] = count
  }
  return {
    dateKey: activeDateKey,
    rotation: normalizeInteger(value.rotation, 0, Number.MAX_SAFE_INTEGER),
    refreshCount: normalizeInteger(value.refreshCount, 0, MARKET_DAILY_REFRESH_LIMIT),
    purchases
  }
}

export const getMarketOffers = (state, dateKey) => {
  const normalized = normalizeMarketState(state, dateKey)
  const start = (getDateSeed(normalized.dateKey) + normalized.rotation) % MARKET_CATALOG.length
  return Array.from({ length: MARKET_DAILY_OFFER_COUNT }, (_, index) =>
    MARKET_CATALOG[(start + index) % MARKET_CATALOG.length]
  ).map(item => ({
    ...item,
    purchased: normalized.purchases[item.id] || 0,
    remaining: Math.max(0, item.purchaseLimit - (normalized.purchases[item.id] || 0))
  }))
}

export const refreshMarket = (state, spiritStones, dateKey) => {
  const normalized = normalizeMarketState(state, dateKey)
  if (normalized.refreshCount >= MARKET_DAILY_REFRESH_LIMIT) {
    return { state: normalized, success: false, reason: 'refresh_limit', price: MARKET_REFRESH_COST }
  }
  if (normalizeInteger(spiritStones, 0, Number.MAX_SAFE_INTEGER) < MARKET_REFRESH_COST) {
    return { state: normalized, success: false, reason: 'insufficient_spirit_stones', price: MARKET_REFRESH_COST }
  }
  return {
    state: {
      ...normalized,
      rotation: normalized.rotation + 1,
      refreshCount: normalized.refreshCount + 1
    },
    success: true,
    reason: null,
    price: MARKET_REFRESH_COST
  }
}

export const purchaseMarketOffer = (state, offerId, spiritStones, dateKey) => {
  const normalized = normalizeMarketState(state, dateKey)
  const offer = getMarketOffers(normalized, normalized.dateKey).find(item => item.id === offerId)
  if (!offer) return { state: normalized, success: false, reason: 'offer_unavailable', price: 0, settlement: null }
  if (offer.remaining <= 0) {
    return { state: normalized, success: false, reason: 'purchase_limit', price: offer.price, settlement: null }
  }
  if (normalizeInteger(spiritStones, 0, Number.MAX_SAFE_INTEGER) < offer.price) {
    return { state: normalized, success: false, reason: 'insufficient_spirit_stones', price: offer.price, settlement: null }
  }

  return {
    state: {
      ...normalized,
      purchases: { ...normalized.purchases, [offer.id]: offer.purchased + 1 }
    },
    success: true,
    reason: null,
    price: offer.price,
    settlement: { id: `market:${normalized.dateKey}:${offer.id}:${offer.purchased + 1}`, reward: { ...offer.reward } }
  }
}

export const getMarketCatalog = () => MARKET_CATALOG.map(item => ({ ...item, reward: { ...item.reward } }))
