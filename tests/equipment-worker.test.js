import test from 'node:test'
import assert from 'node:assert/strict'

import { getEquipmentSalvageStones } from '../src/workers/equipment.js'

test('equipment salvage scales by quality without extreme jumps', () => {
  assert.deepEqual(
    ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].map(quality =>
      getEquipmentSalvageStones({ quality })
    ),
    [1, 2, 4, 7, 11, 16]
  )
  assert.equal(getEquipmentSalvageStones({ quality: 'unknown' }), 1)
})
