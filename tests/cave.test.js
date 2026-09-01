import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CAVE_FACILITIES,
  CAVE_OFFLINE_CAP_SECONDS,
  changeCaveFacility,
  claimCaveRewards,
  createCaveState,
  getCaveFacilityById,
  normalizeCaveState,
  settleCaveOffline
} from '../src/plugins/cave.js'

test('cave duty offers two distinct facilities that produce existing resources', () => {
  assert.deepEqual(CAVE_FACILITIES.map(facility => facility.id), ['spirit_array', 'forge_platform'])
  assert.equal(new Set(CAVE_FACILITIES.map(facility => facility.rewardKey)).size, 2)
  for (const facility of CAVE_FACILITIES) {
    assert.equal(getCaveFacilityById(facility.id), facility)
    assert.ok(facility.name.length > 0)
  }
})

test('legacy and corrupted cave states normalize to a safe single active duty', () => {
  const fallbackAt = Date.parse('2026-08-28T08:00:00.000Z')
  assert.deepEqual(normalizeCaveState(null, fallbackAt), createCaveState(fallbackAt))

  const normalized = normalizeCaveState({
    activeFacilityId: 'missing',
    lastSettledAt: -1,
    pendingReward: { spirit: -10, reinforceStones: 2.9, unknown: 99 },
    productionRemainders: { spirit_array: Infinity, forge_platform: 0.5 },
    claimSequence: -3
  }, fallbackAt)

  assert.deepEqual(normalized, {
    activeFacilityId: 'spirit_array',
    lastSettledAt: fallbackAt,
    pendingReward: { spirit: 0, reinforceStones: 2 },
    productionRemainders: { spirit_array: 0, forge_platform: 0.5 },
    lastSettlement: null,
    claimSequence: 0
  })
})

test('normalizing a saved cave state preserves a valid last settlement summary', () => {
  const state = normalizeCaveState({
    activeFacilityId: 'forge_platform',
    lastSettledAt: 2_000,
    pendingReward: { spirit: 0, reinforceStones: 2 },
    productionRemainders: { spirit_array: 0, forge_platform: 0.5 },
    lastSettlement: {
      facilityId: 'forge_platform',
      elapsedSeconds: 3_600,
      reward: { reinforceStones: 2 },
      settledAt: 2_000
    },
    claimSequence: 1
  }, 1_000)

  assert.deepEqual(state.lastSettlement, {
    facilityId: 'forge_platform',
    elapsedSeconds: 3_600,
    reward: { reinforceStones: 2 },
    settledAt: 2_000
  })
})

test('spirit array settles capped offline time into a pending reward without granting twice', () => {
  const startedAt = Date.parse('2026-08-28T00:00:00.000Z')
  const afterTwelveHours = startedAt + 12 * 60 * 60 * 1000
  const first = settleCaveOffline(createCaveState(startedAt), {
    now: afterTwelveHours,
    spiritRate: 2
  })
  const duplicate = settleCaveOffline(first.state, {
    now: afterTwelveHours,
    spiritRate: 2
  })

  assert.equal(first.elapsedSeconds, CAVE_OFFLINE_CAP_SECONDS)
  assert.equal(first.capped, true)
  assert.equal(first.checkedAt, afterTwelveHours)
  assert.deepEqual(first.reward, { spirit: CAVE_OFFLINE_CAP_SECONDS * 2 })
  assert.deepEqual(first.state.pendingReward, { spirit: CAVE_OFFLINE_CAP_SECONDS * 2, reinforceStones: 0 })
  assert.deepEqual(duplicate.reward, {})
  assert.deepEqual(duplicate.state.pendingReward, { spirit: CAVE_OFFLINE_CAP_SECONDS * 2, reinforceStones: 0 })
})

test('offline settlement rejects corrupted production multipliers', () => {
  const startedAt = 1_000
  const result = settleCaveOffline(createCaveState(startedAt), {
    now: startedAt + 1_000,
    spiritRate: Infinity
  })

  assert.deepEqual(result.reward, { spirit: 1 })
  assert.equal(result.capped, false)
})

test('frequent settlements preserve sub-second elapsed time', () => {
  const first = settleCaveOffline(createCaveState(0), { now: 1_500, spiritRate: 1 })
  const second = settleCaveOffline(first.state, { now: 3_000, spiritRate: 1 })

  assert.equal(first.reward.spirit, 1)
  assert.equal(first.state.lastSettledAt, 1_000)
  assert.equal(second.reward.spirit, 2)
  assert.equal(second.state.pendingReward.spirit, 3)
})

test('forge platform preserves fractional production across settlements', () => {
  const startedAt = Date.parse('2026-08-28T08:00:00.000Z')
  const first = settleCaveOffline({
    ...createCaveState(startedAt),
    activeFacilityId: 'forge_platform'
  }, { now: startedAt + 1799 * 1000 })
  const second = settleCaveOffline(first.state, { now: startedAt + 1800 * 1000 })

  assert.deepEqual(first.reward, {})
  assert.ok(first.state.productionRemainders.forge_platform > 0.99)
  assert.deepEqual(second.reward, { reinforceStones: 1 })
  assert.equal(second.state.productionRemainders.forge_platform, 0)
})

test('switching cave duty settles the old facility and preserves pending rewards', () => {
  const startedAt = Date.parse('2026-08-28T08:00:00.000Z')
  const result = changeCaveFacility(createCaveState(startedAt), 'forge_platform', {
    now: startedAt + 60 * 1000,
    spiritRate: 2
  })

  assert.equal(result.success, true)
  assert.equal(result.state.activeFacilityId, 'forge_platform')
  assert.deepEqual(result.state.pendingReward, { spirit: 120, reinforceStones: 0 })
  assert.equal(changeCaveFacility(result.state, 'forge_platform', { now: startedAt }).reason, 'same_facility')
  assert.equal(changeCaveFacility(result.state, 'missing', { now: startedAt }).reason, 'invalid_facility')
})

test('claiming cave rewards emits one settlement and clears pending resources', () => {
  const state = {
    ...createCaveState(1000),
    pendingReward: { spirit: 300, reinforceStones: 2 }
  }
  const claimed = claimCaveRewards(state, 2000)
  const duplicate = claimCaveRewards(claimed.state, 3000)

  assert.equal(claimed.success, true)
  assert.deepEqual(claimed.settlement, {
    id: 'cave:1:2000',
    source: 'cave',
    reward: { spirit: 300, reinforceStones: 2 }
  })
  assert.deepEqual(claimed.state.pendingReward, { spirit: 0, reinforceStones: 0 })
  assert.equal(duplicate.success, false)
  assert.equal(duplicate.reason, 'nothing_to_claim')
})
