const createEmptySnapshot = () => ({
  manual: { attempts: 0, spiritSpent: 0, rawGain: 0, effectiveGain: 0 },
  auto: { attempts: 0, spiritSpent: 0, rawGain: 0, effectiveGain: 0 },
  batch: { attempts: 0, spiritSpent: 0, rawGain: 0, effectiveGain: 0 },
  insufficient: 0
})

let snapshot = createEmptySnapshot()

export const recordCultivationTelemetry = ({ source = 'manual', attempts = 1, spiritSpent = 0, rawGain = 0, effectiveGain = 0 } = {}) => {
  const bucket = snapshot[source] || snapshot.manual
  bucket.attempts += Math.max(0, Number(attempts) || 0)
  bucket.spiritSpent += Math.max(0, Number(spiritSpent) || 0)
  bucket.rawGain += Math.max(0, Number(rawGain) || 0)
  bucket.effectiveGain += Math.max(0, Number(effectiveGain) || 0)
  return getCultivationTelemetry()
}

export const recordCultivationInsufficient = () => {
  snapshot.insufficient += 1
  return getCultivationTelemetry()
}

export const getCultivationTelemetry = () => JSON.parse(JSON.stringify(snapshot))

export const resetCultivationTelemetry = () => {
  snapshot = createEmptySnapshot()
}
