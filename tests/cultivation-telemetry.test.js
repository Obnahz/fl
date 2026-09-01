import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getCultivationTelemetry,
  recordCultivationInsufficient,
  recordCultivationTelemetry,
  resetCultivationTelemetry
} from '../src/plugins/cultivationTelemetry.js'

test('修炼遥测按入口记录次数、成本和收益且不写入存档', () => {
  resetCultivationTelemetry()
  recordCultivationTelemetry({ source: 'batch', attempts: 4, spiritSpent: 40, rawGain: 5, effectiveGain: 6.25 })
  recordCultivationTelemetry({ source: 'manual', attempts: 1, spiritSpent: 10, rawGain: 1, effectiveGain: 1.2 })
  recordCultivationInsufficient()

  assert.deepEqual(getCultivationTelemetry(), {
    manual: { attempts: 1, spiritSpent: 10, rawGain: 1, effectiveGain: 1.2 },
    auto: { attempts: 0, spiritSpent: 0, rawGain: 0, effectiveGain: 0 },
    batch: { attempts: 4, spiritSpent: 40, rawGain: 5, effectiveGain: 6.25 },
    insufficient: 1
  })
})
