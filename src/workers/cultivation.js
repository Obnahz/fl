import { calculateCultivationBatch } from '../plugins/gameRules.js'

self.onmessage = ({ data }) => {
  const { type, playerData } = data
  if (type !== 'cultivateUntilBreakthrough') return

  try {
    const { level, spirit, cultivation, maxCultivation, luck, effectiveCultivationRate = 1 } = playerData
    const result = calculateCultivationBatch({
      level,
      spirit,
      cultivation,
      maxCultivation,
      luck,
      effectiveCultivationRate
    })

    if (!result.valid) {
      self.postMessage({
        type: 'error',
        message: `灵力不足！闭关需要${result.totalCost}灵力，当前灵力：${Number(spirit || 0).toFixed(1)}`
      })
      return
    }

    // 返回原始修为，由 playerStore.cultivate 统一应用有效修炼倍率。
    self.postMessage({
      type: 'success',
      result: {
        spiritCost: result.totalCost,
        cultivationGain: result.rawCultivationGain,
        doubleGainTimes: result.doubleGainTimes,
        times: result.times
      }
    })
  } catch (error) {
    self.postMessage({ type: 'error', message: '修炼计算出错' })
  }
}
