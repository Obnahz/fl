<template>
  <n-card title="修炼">
    <n-space vertical>
      <n-alert type="info" show-icon>
        <template #icon>
          <n-icon>
            <book-outline />
          </n-icon>
        </template>
        通过打坐修炼来提升修为，积累足够的修为后可以尝试突破境界。
      </n-alert>
      <DailyTasks />
      <n-space vertical>
        <n-button type="primary" size="large" block @click="cultivate" :disabled="playerStore.spirit < cultivationCost || isBatchCultivationPending">
          打坐修炼 (消耗 {{ cultivationCost }} 灵力)
        </n-button>
        <n-button
          :type="isAutoCultivating ? 'warning' : 'success'"
          size="large"
          block
          :disabled="(canBreakthrough() && !isAutoCultivating) || isBatchCultivationPending"
          @click="toggleAutoCultivation"
        >
          {{ isAutoCultivating ? '停止自动修炼' : '开始自动修炼' }}
        </n-button>
        <n-button
          type="default"
          size="large"
          block
          @click="cultivateUntilBreakthrough"
          :loading="isBatchCultivationPending"
          :disabled="canBreakthrough() || playerStore.spirit < calculateBreakthroughCost() || isBatchCultivationPending"
        >
          闭关至圆满
        </n-button>
        <n-text depth="3" v-if="!canBreakthrough()">
          预计消耗 {{ cultivationEstimate.totalCost }} 灵力，修炼 {{ cultivationEstimate.times }} 次；剩余灵力 {{
            Math.max(0, playerStore.spirit - cultivationEstimate.totalCost).toFixed(1)
          }}
        </n-text>
        <n-button
          type="warning"
          size="large"
          block
          @click="attemptBreakthrough"
          :disabled="!canBreakthrough() || isBatchCultivationPending"
        >
          冲关突破（成功率 {{ breakthroughChance }}%）
        </n-button>
        <n-alert type="info" :show-icon="false">
          当前采用 {{ playerStore.stageStrategy.name }}：{{ playerStore.stageStrategy.description }}
        </n-alert>
      </n-space>
      <n-divider>修炼详情</n-divider>
      <n-descriptions bordered :column="detailsColumns">
        <n-descriptions-item label="灵力获取速率">{{ baseGainRate * playerStore.spiritRate }} / 秒</n-descriptions-item>
        <n-descriptions-item label="修炼效率">{{ displayedCultivationGain }} 修为 / 次</n-descriptions-item>
        <n-descriptions-item label="突破所需修为">
          {{ playerStore.maxCultivation }}
        </n-descriptions-item>
      </n-descriptions>
      <log-panel ref="logRef" title="修炼日志" />
    </n-space>
  </n-card>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { NIcon } from 'naive-ui'
  import { BookOutline } from '@vicons/ionicons5'
  import LogPanel from '../components/LogPanel.vue'
  import DailyTasks from '../components/DailyTasks.vue'
  import {
    calculateCultivationBatch,
    getBreakthroughChance,
    getCultivationCost,
    getCultivationGain
  } from '../plugins/gameRules'

  const playerStore = usePlayerStore()
  const logRef = ref(null)
  const viewportWidth = ref(window.innerWidth)

  // 修炼相关数值
  const baseGainRate = 1 // 基础灵力获取率
  const baseCultivationCost = 10 // 基础修炼消耗的灵力
  const baseCultivationGain = 1 // 基础修炼获得的修为
  const autoGainInterval = 1000 // 自动获取灵力的间隔（毫秒）
  const extraCultivationChance = 0.3 // 获得额外修为的基础概率

  // 计算当前境界的修炼消耗
  const getCurrentCultivationCost = () => {
    return getCultivationCost(playerStore.level, playerStore.maxCultivation)
  }

  // 计算当前境界的修炼获得
  const getCurrentCultivationGain = () => {
    return getCultivationGain(playerStore.level, playerStore.maxCultivation)
  }

  // 计算当前修炼消耗（作为计算属性）
  const cultivationCost = computed(() => {
    return getCurrentCultivationCost()
  })

  // 计算当前修炼获得（作为计算属性）
  const cultivationGain = computed(() => {
    return getCurrentCultivationGain()
  })

  const displayedCultivationGain = computed(() => {
    return Number((cultivationGain.value * playerStore.effectiveCultivationRate).toFixed(2))
  })

  const cultivationEstimate = computed(() =>
    calculateCultivationBatch({
      level: playerStore.level,
      spirit: Number.MAX_SAFE_INTEGER,
      cultivation: playerStore.cultivation,
      maxCultivation: playerStore.maxCultivation,
      luck: playerStore.luck,
      effectiveCultivationRate: playerStore.effectiveCultivationRate,
      rolls: []
    })
  )

  const breakthroughChance = computed(() => {
    return Math.round(Math.min(0.98, getBreakthroughChance({ level: playerStore.level, luck: playerStore.luck }) + playerStore.stageStrategy.chanceBonus) * 100)
  })
  const detailsColumns = computed(() => (viewportWidth.value < 640 ? 1 : 3))

  // 计算突破所需的总灵力
  const calculateBreakthroughCost = () => {
    return cultivationEstimate.value.totalCost
  }

  // 自动修炼状态
  const isAutoCultivating = ref(false)
  const cultivationTimer = ref(null)
  const isBatchCultivationPending = ref(false)

  // 显示消息并处理重复
  const showMessage = (type, content) => {
    return logRef.value?.addLog(type, content)
  }

  // 计算实际获得的修为
  const calculateCultivationGain = () => {
    let gain = cultivationGain.value
    // 根据幸运值计算是否获得额外修为
    if (Math.random() < extraCultivationChance * playerStore.luck) {
      gain *= 2
      showMessage('success', '福缘不错，获得双倍修为！')
    }
    return gain
  }

  // 检查是否可以突破
  const canBreakthrough = () => {
    return playerStore.cultivation >= playerStore.maxCultivation
  }

  // 修炼Worker
  const cultivationWorker = new Worker(new URL('../workers/cultivation.js', import.meta.url), { type: 'module' })

  // 处理Worker消息
  cultivationWorker.onmessage = ({ data }) => {
    if (data.type === 'error') {
      isBatchCultivationPending.value = false
      showMessage('error', data.message)
      return
    }
    if (data.type === 'success') {
      isBatchCultivationPending.value = false
      const { spiritCost, cultivationGain, doubleGainTimes } = data.result
      // 扣除灵力
      playerStore.spirit -= spiritCost
      // 增加修为
      playerStore.cultivate(cultivationGain, { source: 'batch', spiritCost, attempts: data.result.times })
      if (doubleGainTimes > 0) {
        showMessage('success', `福缘不错，获得${doubleGainTimes}次双倍修为！`)
      }
      const settledGain = cultivationGain * playerStore.effectiveCultivationRate
      showMessage(
        'success',
        `闭关完成：修炼${data.result.times}次，消耗${spiritCost}灵力，获得${settledGain.toFixed(2)}修为。`
      )
      if (canBreakthrough()) showMessage('success', '修为已经圆满，可以冲关突破！')
    }
  }

  // 一键修炼（直到突破）
  const cultivateUntilBreakthrough = () => {
    if (isBatchCultivationPending.value) return
    try {
      // 检查是否已经达到突破条件
      if (!canBreakthrough()) {
        isBatchCultivationPending.value = true
        // 发送数据到Worker进行计算
        cultivationWorker.postMessage({
          type: 'cultivateUntilBreakthrough',
          playerData: {
            level: playerStore.level,
            spirit: playerStore.spirit,
            cultivation: playerStore.cultivation,
            maxCultivation: playerStore.maxCultivation,
            luck: playerStore.luck,
            effectiveCultivationRate: playerStore.effectiveCultivationRate
          }
        })
      } else {
        isBatchCultivationPending.value = false
        showMessage('info', '修为已经圆满，请点击冲关突破。')
      }
    } catch (error) {
      isBatchCultivationPending.value = false
      console.error('一键修炼出错：', error)
      showMessage('error', '修炼失败！')
    }
  }

  // 手动修炼
  const cultivate = () => {
    if (isBatchCultivationPending.value) return
    try {
      const currentCost = getCurrentCultivationCost()
      if (playerStore.spirit >= currentCost) {
        playerStore.spirit -= currentCost
      const gain = calculateCultivationGain()
      playerStore.cultivate(gain, { source: 'manual', spiritCost: currentCost })
      showMessage('success', `修炼成功：消耗${currentCost}灵力，获得${(gain * playerStore.effectiveCultivationRate).toFixed(2)}修为。`)
      } else {
        showMessage('error', '灵力不足！')
      }
    } catch (error) {
      console.error('修炼出错：', error)
      showMessage('error', '修炼失败！')
    }
  }

  // 切换自动修炼
  const toggleAutoCultivation = () => {
    if (isBatchCultivationPending.value) return
    try {
      isAutoCultivating.value = !isAutoCultivating.value
      if (isAutoCultivating.value) {
        if (cultivationTimer.value) return
        cultivationTimer.value = setInterval(() => {
          const currentCost = getCurrentCultivationCost()
          if (playerStore.spirit >= currentCost) {
            playerStore.spirit -= currentCost
            playerStore.cultivate(cultivationGain.value, { source: 'auto', spiritCost: currentCost })
            if (canBreakthrough()) {
              toggleAutoCultivation()
              showMessage('success', '修为已经圆满，自动修炼已停止。')
            }
          }
        }, autoGainInterval)
      } else {
        if (cultivationTimer.value) {
          clearInterval(cultivationTimer.value)
          cultivationTimer.value = null
        }
      }
    } catch (error) {
      console.error('切换自动修炼出错：', error)
      logRef.value?.addLog('error', '切换失败！')
      isAutoCultivating.value = false
    }
  }

  const attemptBreakthrough = () => {
    if (isBatchCultivationPending.value) return
    const result = playerStore.tryBreakthrough()
    if (!result.ready) {
      showMessage('info', '修为尚未圆满。')
    } else if (result.atFinalRealm) {
      showMessage('info', '已至大道尽头，无境可破。')
    } else if (result.success) {
      showMessage('success', `冲关成功，踏入${playerStore.realm}！`)
    } else {
      showMessage('warning', `冲关失败，心境受损，失去${result.loss}点修为。`)
    }
  }

  const updateViewportWidth = () => {
    viewportWidth.value = window.innerWidth
  }

  onMounted(() => window.addEventListener('resize', updateViewportWidth))

  // 组件卸载时清理定时器
  onUnmounted(() => {
    window.removeEventListener('resize', updateViewportWidth)
    cultivationWorker.terminate()
    isBatchCultivationPending.value = false
    try {
      if (cultivationTimer.value) {
        clearInterval(cultivationTimer.value)
        cultivationTimer.value = null
      }
      isAutoCultivating.value = false
    } catch (error) {
      console.error('清理定时器出错：', error)
    }
  })
</script>
