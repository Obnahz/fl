import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createMarketState,
  getMarketOffers,
  normalizeMarketState,
  purchaseMarketOffer,
  refreshMarket
} from '../src/plugins/market.js'

test('market offers are deterministic for the same date', () => {
  const first = getMarketOffers(createMarketState('2026-08-29'), '2026-08-29').map(item => item.id)
  const second = getMarketOffers(createMarketState('2026-08-29'), '2026-08-29').map(item => item.id)
  assert.deepEqual(first, second)
  assert.equal(first.length, 6)
})

test('market purchase spends spirit stones and settles the listed reward', () => {
  const state = createMarketState('2026-08-29')
  const offer = getMarketOffers(state, '2026-08-29').find(item => item.reward.spirit)
  const result = purchaseMarketOffer(state, offer.id, offer.price, '2026-08-29')
  assert.equal(result.success, true)
  assert.equal(result.price, offer.price)
  assert.deepEqual(result.settlement.reward, offer.reward)
  assert.equal(result.state.purchases[offer.id], 1)
})

test('market rejects insufficient funds and sold-out purchases without mutating state', () => {
  const state = createMarketState('2026-08-29')
  const offer = getMarketOffers(state, '2026-08-29')[0]
  const insufficient = purchaseMarketOffer(state, offer.id, offer.price - 1, '2026-08-29')
  assert.equal(insufficient.success, false)
  assert.deepEqual(insufficient.state, state)

  let purchasedState = state
  for (let index = 0; index < offer.purchaseLimit; index++) {
    purchasedState = purchaseMarketOffer(purchasedState, offer.id, offer.price, '2026-08-29').state
  }
  const soldOut = purchaseMarketOffer(purchasedState, offer.id, offer.price, '2026-08-29')
  assert.equal(soldOut.reason, 'purchase_limit')
  assert.deepEqual(soldOut.state, purchasedState)
})

test('market state resets purchases when the day changes', () => {
  const state = { dateKey: '2026-08-29', purchases: { spirit_small: 2 } }
  const next = normalizeMarketState(state, '2026-08-30')
  assert.equal(next.dateKey, '2026-08-30')
  assert.deepEqual(next.purchases, {})
})

test('market supports one paid refresh without resetting daily purchases', () => {
  const state = createMarketState('2026-08-29')
  const firstOffer = getMarketOffers(state, '2026-08-29')[0]
  const purchased = purchaseMarketOffer(state, firstOffer.id, firstOffer.price, '2026-08-29').state
  const refreshed = refreshMarket(purchased, 200, '2026-08-29')
  assert.equal(refreshed.success, true)
  assert.equal(refreshed.price, 120)
  assert.equal(refreshed.state.refreshCount, 1)
  assert.equal(refreshed.state.purchases[firstOffer.id], 1)
  assert.notDeepEqual(
    getMarketOffers(purchased, '2026-08-29').map(item => item.id),
    getMarketOffers(refreshed.state, '2026-08-29').map(item => item.id)
  )

  const blocked = refreshMarket(refreshed.state, 200, '2026-08-29')
  assert.equal(blocked.reason, 'refresh_limit')
})
