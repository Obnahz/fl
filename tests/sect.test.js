import test from 'node:test'
import assert from 'node:assert/strict'

import {
  COMMISSION_DEFINITIONS,
  CULTIVATION_DIRECTIONS,
  DIRECTION_SWITCH_COOLDOWN_MS,
  DIRECTION_SWITCH_COST,
  MAX_SECT_LEVEL,
  SECTS,
  SECT_SHOP_ITEMS,
  SHOP_DAILY_REFRESH_LIMIT,
  addSectContribution,
  applySectRewardBonus,
  changeCultivationDirection,
  claimSectCommission,
  createSectOperationsState,
  createSectState,
  getCommissionStatus,
  getActiveSectBonuses,
  getCultivationDirectionById,
  getSectShopOffers,
  getSectById,
  getSectRewardMultiplier,
  getSectUpgradeCost,
  joinSect,
  normalizeSectOperationsState,
  normalizeSectState,
  purchaseSectShopItem,
  refreshSectShop,
  startSectCommission,
  upgradeSect
} from '../src/plugins/sect.js'

test('sect shop reinforcement reward stays useful beside commissions', () => {
  const bundle = SECT_SHOP_ITEMS.find(item => item.id === 'reinforce_bundle')
  assert.deepEqual(
    { cost: bundle.contributionCost, amount: bundle.reward.reinforceStones },
    { cost: 60, amount: 15 }
  )
})

test('sect catalog offers three distinct single-player growth choices', () => {
  assert.equal(SECTS.length, 3)
  assert.equal(new Set(SECTS.map(sect => sect.id)).size, 3)

  for (const sect of SECTS) {
    assert.equal(getSectById(sect.id), sect)
    assert.ok(sect.name.length > 0)
    assert.ok(sect.description.length > 0)
    assert.ok(Object.values(sect.bonuses).some(value => value > 1))
  }

  assert.notDeepEqual(SECTS[0].bonuses, SECTS[1].bonuses)
  assert.notDeepEqual(SECTS[1].bonuses, SECTS[2].bonuses)
})

test('a player joins exactly one sect and receives its base growth bonuses', () => {
  const initial = createSectState()
  const joined = joinSect(initial, SECTS[0].id)
  const secondJoin = joinSect(joined.state, SECTS[1].id)

  assert.equal(joined.success, true)
  assert.equal(joined.state.sectId, SECTS[0].id)
  assert.equal(joined.state.level, 1)
  assert.deepEqual(getActiveSectBonuses(joined.state), SECTS[0].bonuses)
  assert.equal(secondJoin.success, false)
  assert.equal(secondJoin.reason, 'already_joined')
  assert.equal(secondJoin.state.sectId, SECTS[0].id)
  assert.equal(joinSect(initial, 'missing_sect').reason, 'invalid_sect')
})

test('contribution gains are sanitized and sect upgrades consume bounded costs', () => {
  let state = joinSect(createSectState(), SECTS[0].id).state
  const firstCost = getSectUpgradeCost(1)

  state = addSectContribution(state, firstCost + 9)
  assert.equal(state.contribution, firstCost + 9)
  assert.equal(addSectContribution(state, -100).contribution, firstCost + 9)

  const upgraded = upgradeSect(state)
  assert.equal(upgraded.success, true)
  assert.equal(upgraded.state.level, 2)
  assert.equal(upgraded.state.contribution, 9)
  assert.equal(upgradeSect(upgraded.state).reason, 'insufficient_contribution')

  const capped = upgradeSect({ ...state, level: MAX_SECT_LEVEL, contribution: 999999 })
  assert.equal(capped.success, false)
  assert.equal(capped.reason, 'max_level')
  assert.equal(capped.state.level, MAX_SECT_LEVEL)
  assert.equal(getSectUpgradeCost(MAX_SECT_LEVEL), null)
})

test('cultivation directions provide small distinct bonuses in a single active slot', () => {
  assert.ok(CULTIVATION_DIRECTIONS.length >= 3)
  assert.equal(new Set(CULTIVATION_DIRECTIONS.map(direction => direction.id)).size, CULTIVATION_DIRECTIONS.length)

  for (const direction of CULTIVATION_DIRECTIONS) {
    assert.equal(getCultivationDirectionById(direction.id), direction)
    const values = Object.values(direction.bonuses)
    assert.ok(values.every(value => value > 1 && value <= 1.08))
  }

  const joined = joinSect(createSectState(), SECTS[0].id).state
  const selected = changeCultivationDirection(joined, CULTIVATION_DIRECTIONS[0].id, 1000)
  assert.equal(selected.success, true)
  assert.equal(selected.cost, 0)
  assert.equal(selected.state.directionId, CULTIVATION_DIRECTIONS[0].id)
  assert.deepEqual(getActiveSectBonuses(selected.state), {
    ...SECTS[0].bonuses,
    ...CULTIVATION_DIRECTIONS[0].bonuses
  })
})

test('direction switching requires contribution and cooldown without stacking old bonuses', () => {
  const joined = joinSect(createSectState(), SECTS[0].id).state
  const funded = addSectContribution(joined, DIRECTION_SWITCH_COST + 10)
  const first = changeCultivationDirection(funded, CULTIVATION_DIRECTIONS[0].id, 1000)
  const duringCooldown = changeCultivationDirection(
    first.state,
    CULTIVATION_DIRECTIONS[1].id,
    1000 + DIRECTION_SWITCH_COOLDOWN_MS - 1
  )
  const switched = changeCultivationDirection(
    first.state,
    CULTIVATION_DIRECTIONS[1].id,
    1000 + DIRECTION_SWITCH_COOLDOWN_MS
  )

  assert.equal(duringCooldown.success, false)
  assert.equal(duringCooldown.reason, 'cooldown')
  assert.equal(switched.success, true)
  assert.equal(switched.cost, DIRECTION_SWITCH_COST)
  assert.equal(switched.state.contribution, 10)
  assert.equal(switched.state.directionId, CULTIVATION_DIRECTIONS[1].id)

  const bonuses = getActiveSectBonuses(switched.state)
  for (const key of Object.keys(CULTIVATION_DIRECTIONS[0].bonuses)) {
    if (!(key in CULTIVATION_DIRECTIONS[1].bonuses) && !(key in SECTS[0].bonuses)) {
      assert.equal(key in bonuses, false)
    }
  }
})

test('direction changes reject invalid, unjoined, duplicate and underfunded requests', () => {
  const direction = CULTIVATION_DIRECTIONS[0].id
  assert.equal(changeCultivationDirection(createSectState(), direction, 1000).reason, 'not_joined')

  const joined = joinSect(createSectState(), SECTS[0].id).state
  assert.equal(changeCultivationDirection(joined, 'missing_direction', 1000).reason, 'invalid_direction')

  const selected = changeCultivationDirection(joined, direction, 1000)
  assert.equal(changeCultivationDirection(selected.state, direction, 999999999).reason, 'same_direction')

  const cooldownElapsed = 1000 + DIRECTION_SWITCH_COOLDOWN_MS
  const underfunded = changeCultivationDirection(selected.state, CULTIVATION_DIRECTIONS[1].id, cooldownElapsed)
  assert.equal(underfunded.reason, 'insufficient_contribution')
})

test('sect state normalization safely migrates legacy fields and clamps corrupted values', () => {
  const migrated = normalizeSectState({
    sect: SECTS[1].id,
    sectLevel: 999,
    sectContribution: -20,
    cultivationDirection: CULTIVATION_DIRECTIONS[1].id,
    directionChangedAt: '2026-08-28T08:00:00.000Z'
  })

  assert.deepEqual(migrated, {
    sectId: SECTS[1].id,
    level: MAX_SECT_LEVEL,
    contribution: 0,
    directionId: CULTIVATION_DIRECTIONS[1].id,
    directionChangedAt: Date.parse('2026-08-28T08:00:00.000Z')
  })

  assert.deepEqual(normalizeSectState({
    sectId: 'missing_sect',
    level: 4,
    contribution: 500,
    directionId: CULTIVATION_DIRECTIONS[0].id
  }), createSectState())

  assert.deepEqual(normalizeSectState({
    sectId: SECTS[0].id,
    level: 0,
    contribution: Infinity,
    directionId: 'missing_direction',
    directionChangedAt: -1
  }), {
    sectId: SECTS[0].id,
    level: 1,
    contribution: 0,
    directionId: null,
    directionChangedAt: null
  })
})

test('sect commissions expose three explicit cost, duration and reward choices', () => {
  assert.deepEqual(Object.keys(COMMISSION_DEFINITIONS).sort(), ['challenge', 'short', 'timed'])

  for (const commission of Object.values(COMMISSION_DEFINITIONS)) {
    assert.ok(commission.name.length > 0)
    assert.ok(commission.durationMs > 0)
    assert.ok(Object.keys(commission.cost).length > 0)
    assert.ok(commission.reward.sectContribution > 0)
  }
})

test('a commission validates costs, records time and becomes claimable only after its duration', () => {
  const now = Date.parse('2026-08-28T08:00:00.000Z')
  const initial = createSectOperationsState('2026-08-28')
  const missingResources = startSectCommission(initial, 'short', { spirit: 0 }, now)
  const started = startSectCommission(initial, 'short', { spirit: 1000, spiritStones: 1000 }, now)
  const definition = COMMISSION_DEFINITIONS.short

  assert.equal(missingResources.success, false)
  assert.equal(missingResources.reason, 'insufficient_resources')
  assert.equal(started.success, true)
  assert.deepEqual(started.cost, definition.cost)
  assert.equal(started.commission.startedAt, now)
  assert.equal(started.commission.completesAt, now + definition.durationMs)
  assert.equal(getCommissionStatus(started.commission, now), 'active')
  assert.equal(getCommissionStatus(started.commission, now + definition.durationMs), 'claimable')
})

test('a completed commission emits one settlement and cannot be claimed twice', () => {
  const now = Date.parse('2026-08-28T08:00:00.000Z')
  const started = startSectCommission(
    createSectOperationsState('2026-08-28'),
    'timed',
    { spirit: 1000, spiritStones: 1000 },
    now
  )
  const early = claimSectCommission(started.state, 'timed', now)
  const claimed = claimSectCommission(
    started.state,
    'timed',
    now + COMMISSION_DEFINITIONS.timed.durationMs
  )
  const duplicate = claimSectCommission(claimed.state, 'timed', now + COMMISSION_DEFINITIONS.timed.durationMs)

  assert.equal(early.reason, 'not_ready')
  assert.equal(claimed.success, true)
  assert.equal(claimed.settlement.source, 'commission')
  assert.deepEqual(claimed.settlement.reward, COMMISSION_DEFINITIONS.timed.reward)
  assert.equal(getCommissionStatus(claimed.state.commissions.timed, now), 'claimed')
  assert.equal(duplicate.success, false)
  assert.equal(duplicate.reason, 'already_claimed')
})

test('daily rollover reopens commissions without carrying claimed rewards forward', () => {
  const now = Date.parse('2026-08-28T08:00:00.000Z')
  const started = startSectCommission(
    createSectOperationsState('2026-08-28'),
    'short',
    { spirit: 1000, spiritStones: 1000 },
    now
  )
  const claimed = claimSectCommission(
    started.state,
    'short',
    now + COMMISSION_DEFINITIONS.short.durationMs
  )
  const nextDay = normalizeSectOperationsState(claimed.state, '2026-08-29')

  assert.deepEqual(nextDay.commissions, {})
  assert.equal(getCommissionStatus(nextDay.commissions.short, now), 'available')
})

test('sect reward multipliers only combine bonuses that match the reward source', () => {
  const bonuses = {
    combatRewardRate: 1.03,
    herbYieldRate: 1.04,
    explorationRewardRate: 1.06,
    dungeonRewardRate: 1.06,
    cultivationRate: 9
  }

  assert.equal(getSectRewardMultiplier(bonuses, { source: 'exploration', rewardType: 'spirit_stone' }), 1.06)
  assert.equal(getSectRewardMultiplier(bonuses, { source: 'exploration', rewardType: 'herb' }), 1.06 * 1.04)
  assert.equal(getSectRewardMultiplier(bonuses, { source: 'exploration_combat', rewardType: 'spirit_stone' }), 1.06 * 1.03)
  assert.equal(getSectRewardMultiplier(bonuses, { source: 'dungeon', rewardType: 'spirit_stones' }), 1.06 * 1.03)
  assert.equal(getSectRewardMultiplier(bonuses, { source: 'alchemy', rewardType: 'spirit_stone' }), 1)
  assert.equal(getSectRewardMultiplier(bonuses, { source: 'exploration', rewardType: 'equipment' }), 1)
})

test('small integer rewards preserve fractional sect bonuses through a deterministic roll', () => {
  const reward = { type: 'herb', amount: 1 }
  const bonuses = { herbYieldRate: 1.04 }
  const bonus = applySectRewardBonus(reward, bonuses, { source: 'exploration', roll: 0.03 })
  const noBonus = applySectRewardBonus(reward, bonuses, { source: 'exploration', roll: 0.04 })

  assert.deepEqual(bonus, { type: 'herb', amount: 2, baseAmount: 1, multiplier: 1.04 })
  assert.deepEqual(noBonus, { type: 'herb', amount: 1, baseAmount: 1, multiplier: 1.04 })
  assert.deepEqual(reward, { type: 'herb', amount: 1 })
})

test('sect reward bonuses scale a reward once and ignore invalid amounts', () => {
  assert.deepEqual(
    applySectRewardBonus(
      { type: 'spirit_stone', amount: 100 },
      { explorationRewardRate: 1.06, combatRewardRate: 1.03 },
      { source: 'exploration_combat', roll: 0.99 }
    ),
    { type: 'spirit_stone', amount: 109, baseAmount: 100, multiplier: 1.06 * 1.03 }
  )
  assert.deepEqual(
    applySectRewardBonus({ type: 'spirit_stone', amount: -5 }, { explorationRewardRate: 2 }, { source: 'exploration' }),
    { type: 'spirit_stone', amount: 0, baseAmount: 0, multiplier: 2 }
  )
})

test('sect shop refreshes deterministically with a daily cap and preserves daily purchase counts', () => {
  const dateKey = '2026-08-28'
  let state = createSectOperationsState(dateKey)
  const firstOffers = getSectShopOffers(state, dateKey).map(item => item.id)
  const refreshed = refreshSectShop(state, 999, dateKey)

  assert.equal(refreshed.success, true)
  assert.ok(refreshed.contributionCost > 0)
  assert.notDeepEqual(getSectShopOffers(refreshed.state, dateKey).map(item => item.id), firstOffers)

  state = refreshed.state
  for (let count = 1; count < SHOP_DAILY_REFRESH_LIMIT; count += 1) {
    state = refreshSectShop(state, 999, dateKey).state
  }
  const capped = refreshSectShop(state, 999, dateKey)
  assert.equal(capped.success, false)
  assert.equal(capped.reason, 'refresh_limit')

  const nextDay = normalizeSectOperationsState(state, '2026-08-29')
  assert.equal(nextDay.shop.refreshCount, 0)
  assert.deepEqual(nextDay.shop.purchases, {})
})

test('sect shop purchases enforce contribution and stock limits while emitting settlements', () => {
  const dateKey = '2026-08-28'
  const initial = createSectOperationsState(dateKey)
  const offer = getSectShopOffers(initial, dateKey)[0]
  const underfunded = purchaseSectShopItem(initial, offer.id, 0, dateKey)

  assert.equal(SECT_SHOP_ITEMS.some(item => item.id === offer.id), true)
  assert.equal(underfunded.reason, 'insufficient_contribution')

  let state = initial
  let purchased
  for (let count = 0; count < offer.purchaseLimit; count += 1) {
    purchased = purchaseSectShopItem(state, offer.id, 999, dateKey)
    assert.equal(purchased.success, true)
    assert.equal(purchased.settlement.source, 'sect_shop')
    assert.deepEqual(purchased.settlement.reward, offer.reward)
    state = purchased.state
  }

  const soldOut = purchaseSectShopItem(state, offer.id, 999, dateKey)
  assert.equal(soldOut.success, false)
  assert.equal(soldOut.reason, 'purchase_limit')
})
