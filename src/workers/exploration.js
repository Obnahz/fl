import { resolveExploration } from '../plugins/explorationRules.js'

self.onmessage = ({ data }) => {
  const { type, playerData, location, requestId } = data
  if (type !== 'explore') return

  try {
    const result = resolveExploration({
      player: playerData,
      location,
      rolls: {
        danger: Math.random(),
        dangerType: Math.random(),
        enemy: Math.random(),
        boss: Math.random(),
        combat: Array.from({ length: 16 }, () => ({
          dodge: Math.random(),
          crit: Math.random(),
          variance: Math.random()
        })),
        special: Math.random(),
        specialType: Math.random(),
        reward: Math.random(),
        amount: Math.random(),
        bonus: Math.random()
      }
    })
    self.postMessage({ type: 'exploration_result', requestId, locationId: location.id, ...result })
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId,
      locationId: location.id,
      message: error.message || '历练判定失败'
    })
  }
}
