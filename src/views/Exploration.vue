<template>
  <n-layout>
    <n-layout-content>
      <n-card title="历练" :bordered="true">
        <n-space vertical>
          <n-alert type="info" show-icon>
            <template #icon>
              <n-icon>
                <compass-outline />
              </n-icon>
            </template>
            探索各处秘境，寻找机缘造化。小心谨慎，危险与机遇并存。
          </n-alert>
          <section class="vitality-panel" aria-label="伤势状态">
            <div class="vitality-heading">
              <div>
                <n-text depth="3">气血</n-text>
                <strong>{{ playerStore.currentHealth }} / {{ maxHealth }}</strong>
              </div>
              <n-button secondary :disabled="playerStore.currentHealth >= maxHealth" @click="recoverHealth">
                调息疗伤（{{ recoveryCost }} 灵力）
              </n-button>
            </div>
            <n-progress
              type="line"
              :percentage="healthPercentage"
              :color="healthPercentage > 50 ? '#2f855a' : healthPercentage > 25 ? '#b7791f' : '#c53030'"
              :show-indicator="false"
            />
          </section>
          <section class="technique-panel" aria-label="当前功法">
            <div>
              <n-text depth="3">当前功法</n-text>
              <strong>{{ activeTechnique ? `${activeTechnique.name} · 第${activeTechnique.level}层` : '尚未领悟' }}</strong>
              <n-space v-if="activeTechnique" :size="6" wrap>
                <n-tag :type="techniqueStyleType(activeTechnique.style)" size="small">
                  {{ activeTechnique.styleName }}
                </n-tag>
                <n-tag size="small">{{ activeTechnique.effectText }}</n-tag>
              </n-space>
            </div>
            <n-text depth="3">
              {{ activeTechnique?.description || '历练途中可寻得功法传承。' }}
            </n-text>
          </section>
          <section class="equipment-fortune" aria-label="装备机缘保底">
            <div class="fortune-heading">
              <div>
                <n-text depth="3">装备机缘</n-text>
                <strong>{{ playerStore.equipmentPity }} / 8</strong>
              </div>
              <n-text depth="3">
                {{ playerStore.equipmentPity >= 8 ? '下次普通收获必得装备' : `再积累 ${8 - playerStore.equipmentPity} 次普通收获触发保底` }}
              </n-text>
            </div>
            <n-progress type="line" :percentage="equipmentPityPercentage" color="#b7791f" :show-indicator="false" />
          </section>
          <section v-if="lastCombatResult" class="combat-result" aria-label="最近战斗">
            <div class="combat-result-heading">
              <div>
                <n-text depth="3">最近战斗</n-text>
                <strong>{{ lastCombatResult.enemy.name }}</strong>
              </div>
              <n-tag :type="combatOutcomeType(lastCombatResult.outcome)" size="small">
                {{ combatOutcomeText(lastCombatResult.outcome) }}
              </n-tag>
              <n-tag v-if="lastCombatResult.enemy.type === 'boss'" type="error" size="small">首领</n-tag>
            </div>
            <n-grid responsive="screen" cols="2 s:4" :x-gap="12" :y-gap="8">
              <n-grid-item>
                <n-statistic label="回合" :value="lastCombatResult.rounds" />
              </n-grid-item>
              <n-grid-item>
                <n-statistic label="剩余气血" :value="lastCombatResult.playerHealthAfter" />
              </n-grid-item>
              <n-grid-item>
                <n-statistic label="造成伤害" :value="combatDamageDealt" />
              </n-grid-item>
              <n-grid-item>
                <n-statistic label="承受伤害" :value="combatDamageTaken" />
              </n-grid-item>
            </n-grid>
            <n-collapse class="combat-log">
              <n-collapse-item title="逐回合战报" name="combat-log">
                <div
                  v-for="(entry, index) in lastCombatResult.log"
                  :key="`${entry.round}-${entry.side}-${index}`"
                  class="combat-log-entry"
                >
                  <span>第 {{ entry.round }} 回合</span>
                  <strong>{{ formatCombatEntry(entry) }}</strong>
                </div>
              </n-collapse-item>
            </n-collapse>
          </section>
          <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="12">
            <n-grid-item v-for="location in availableLocations" :key="location.id">
              <n-card :title="location.name" size="small">
                <n-space vertical>
                  <n-text depth="3">{{ location.description }}</n-text>
                  <n-space justify="space-between">
                    <n-text>消耗灵力：{{ location.spiritCost }}</n-text>
                    <n-text>最低境界：{{ getRealmName(location.minLevel).name }}</n-text>
                  </n-space>
                  <n-space align="center">
                    <n-tag size="small" :type="riskType(location.dangerChance)">
                      危险度 {{ Math.round(location.dangerChance * 100) }}%
                    </n-tag>
                    <n-text depth="3">可能遭遇妖兽或灵气逆行</n-text>
                  </n-space>
                  <div class="enemy-preview">
                    <n-text depth="3">附近妖兽</n-text>
                    <n-space :size="6">
                      <n-tag
                        v-for="enemy in getEnemiesForLocation(location.id)"
                        :key="enemy.id"
                        size="small"
                        :type="enemy.type === 'elite' ? 'warning' : 'default'"
                      >
                        {{ enemy.name }} · {{ enemy.maxHealth }} 气血
                      </n-tag>
                    </n-space>
                    <div v-if="getBossForLocation(location.id)" class="boss-preview">
                      <n-tag type="error" size="small">首领</n-tag>
                      <n-text>
                        {{ getBossForLocation(location.id).name }} · 低概率现身 ·
                        {{ getBossForLocation(location.id).maxHealth }} 气血
                      </n-text>
                    </div>
                  </div>
                  <n-space>
                    <n-button
                      type="primary"
                      @click="exploreLocation(location)"
                      :loading="isResolving && pendingExploration?.locationId === location.id"
                      :disabled="
                        playerStore.currentHealth <= 0 ||
                        playerStore.spirit < location.spiritCost ||
                        isAutoExploring ||
                        isResolving
                      "
                    >
                      探索
                    </n-button>
                    <n-button
                      :type="exploringLocations[location.id] ? 'warning' : 'success'"
                      @click="
                        exploringLocations[location.id] ? stopAutoExploration(location) : startAutoExploration(location)
                      "
                      :disabled="
                        playerStore.spirit < location.spiritCost ||
                        playerStore.currentHealth <= 0 ||
                        isResolving ||
                        (isAutoExploring && !exploringLocations[location.id])
                      "
                    >
                      {{ exploringLocations[location.id] ? '停止' : '自动' }}
                    </n-button>
                  </n-space>
                </n-space>
              </n-card>
            </n-grid-item>
          </n-grid>
          <n-divider>探索统计</n-divider>
          <n-descriptions :column="statisticsColumns" bordered>
            <n-descriptions-item label="探索次数">
              {{ playerStore.explorationCount }}
            </n-descriptions-item>
            <n-descriptions-item label="灵石数量">
              {{ playerStore.spiritStones }}
            </n-descriptions-item>
            <n-descriptions-item label="灵草数量">
              {{ playerStore.herbs.length }}
            </n-descriptions-item>
            <n-descriptions-item label="丹方残页">
              {{ Object.values(playerStore.pillFragments || {}).reduce((a, b) => a + b, 0) }}
            </n-descriptions-item>
          </n-descriptions>
        </n-space>
      </n-card>
      <n-space justify="end" style="margin-bottom: 8px">
        <n-button size="small" @click="clearLogPanel" type="error" secondary>清空日志</n-button>
      </n-space>
      <log-panel ref="logRef" title="探索日志" />
    </n-layout-content>
  </n-layout>
</template>

<script setup>
  import { ref } from 'vue'
  import { usePlayerStore } from '../stores/player'
  import { CompassOutline } from '@vicons/ionicons5'
  import { getRealmName } from '../plugins/realm'
  import { locations } from '../plugins/locations'
  import { getBossForLocation, getEnemiesForLocation } from '../plugins/enemies'
  import { selectTechniqueForCombat } from '../plugins/techniques'
  import { handleReward } from '../plugins/events'
  import { getRecoveryCost } from '../plugins/explorationRules'
  import LogPanel from '../components/LogPanel.vue'

  const logRef = ref(null)
  const playerStore = usePlayerStore()
  const viewportWidth = ref(window.innerWidth)
  // 探索相关数值
  const explorationInterval = 3000 // 探索间隔（毫秒）
  const exploringLocations = ref({}) // 记录每个地点的探索状态
  const explorationTimers = ref({}) // 记录每个地点的定时器
  const isAutoExploring = ref(false) // 是否有地点正在自动探索
  const autoExploringLocationId = ref(null) // 正在自动探索的地点ID
  const explorationWorker = ref(null)
  const isResolving = ref(false)
  const pendingExploration = ref(null)
  const lastCombatResult = ref(null)

  // 初始化 Web Worker
  const initWorker = () => {
    explorationWorker.value = new Worker(new URL('../workers/exploration.js', import.meta.url), { type: 'module' })
    explorationWorker.value.onmessage = ({ data }) => {
      if (data.type === 'exploration_result') {
        handleExplorationResult(data)
      } else if (data.type === 'error') {
        refundPendingExploration(data.requestId)
        showMessage('error', data.message)
      }
    }
  }

  // 处理探索结果
  const handleExplorationResult = result => {
    if (!pendingExploration.value || pendingExploration.value.requestId !== result.requestId) return
    if (result.kind === 'blocked') {
      refundPendingExploration(result.requestId)
      showMessage('warning', result.reason === 'injured' ? '伤势过重，请先调息疗伤。' : '灵力不足。')
      return
    }
    pendingExploration.value = null
    isResolving.value = false
    playerStore.explorationCount++
    playerStore.equipmentPity = result.equipmentPityAfter ?? playerStore.equipmentPity

    if (result.kind === 'combat') {
      const healthBefore = playerStore.currentHealth
      playerStore.currentHealth = Math.max(0, Math.min(maxHealth.value, result.playerHealthAfter))
      lastCombatResult.value = { ...result, playerHealthBefore: healthBefore }
      playerStore.eventTriggered++

      if (result.outcome === 'victory') {
        showMessage('success', `[斩妖]击败${result.enemy.name}，历经${result.rounds}回合，损失${healthBefore - playerStore.currentHealth}点气血。`)
        result.rewards.forEach(reward => handleReward(reward, playerStore, showMessage))
      } else {
        stopAllExploration()
        const reason = result.outcome === 'round_limit' ? '久战未决，只得暂退' : '不敌妖兽，负伤退走'
        showMessage('error', `[遇敌]${reason}。当前剩余${playerStore.currentHealth}点气血。`)
      }

      if (playerStore.currentHealth <= 0) {
        showMessage('warning', '伤势过重，必须调息后才能继续历练。')
      }
    } else if (result.kind === 'danger') {
      const damage = playerStore.takeDamage(result.damage)
      if (result.cultivationLoss > 0) {
        playerStore.cultivation = Math.max(0, playerStore.cultivation - result.cultivationLoss)
      }
      showMessage(
        'error',
        `[${result.name}]${result.description} 损失${damage}点气血${result.cultivationLoss ? `与${result.cultivationLoss}点修为` : ''}`
      )
      if (playerStore.currentHealth <= 0) {
        stopAllExploration()
        showMessage('warning', '伤势过重，必须调息后才能继续历练。')
      }
    } else if (result.kind === 'special') {
      showMessage('info', `[${result.name}]${result.description}`)
      handleReward(result.reward, playerStore, showMessage)
      if (result.bonusReward) handleReward(result.bonusReward, playerStore, showMessage)
      if (result.heal > 0) {
        const healed = playerStore.heal(result.heal)
        if (healed > 0) showMessage('success', `[灵泉洗脉]恢复${healed}点气血`)
      }
      playerStore.eventTriggered++
    } else if (result.kind === 'reward') {
      if (result.multiplier > 1) showMessage('success', '福缘加持，本次收获提升五成。')
      if (result.guaranteed) showMessage('success', '装备机缘圆满，本次普通收获触发保底。')
      handleReward(result.reward, playerStore, showMessage)
    }
    playerStore.saveData()
  }

  // 探索指定地点
  const exploreLocation = location => {
    if (isResolving.value) return
    if (playerStore.currentHealth <= 0) {
      showMessage('warning', '伤势过重，请先调息疗伤。')
      return
    }
    if (playerStore.spirit < location.spiritCost) {
      showMessage('error', '灵力不足！')
      return
    }
    const requestId = `${Date.now()}_${location.id}`
    const spiritBefore = playerStore.spirit
    playerStore.spirit -= location.spiritCost
    pendingExploration.value = { requestId, locationId: location.id, spiritCost: location.spiritCost }
    isResolving.value = true
    explorationWorker.value.postMessage({
      type: 'explore',
      requestId,
      playerData: {
        name: playerStore.name,
        luck: playerStore.luck,
        spirit: spiritBefore,
        currentHealth: playerStore.currentHealth,
        maxHealth: maxHealth.value,
        defense: playerStore.baseAttributes.defense + (playerStore.activeEquipmentSetBonuses.defense || 0),
        baseAttributes: JSON.parse(JSON.stringify(playerStore.baseAttributes)),
        combatAttributes: JSON.parse(JSON.stringify(playerStore.combatAttributes)),
        specialAttributes: JSON.parse(JSON.stringify(playerStore.specialAttributes)),
        setBonuses: JSON.parse(JSON.stringify(playerStore.activeEquipmentSetBonuses)),
        petBonus: JSON.parse(JSON.stringify(playerStore.getPetBonus)),
        baseIncludesPet: Boolean(playerStore.activePet),
        activeEffects: JSON.parse(JSON.stringify(playerStore.activeEffects)),
        unlockedSkills: [...playerStore.unlockedSkills],
        activeTechniqueId: playerStore.activeTechniqueId,
        techniqueLevels: { ...playerStore.techniqueLevels },
        equipmentPity: playerStore.equipmentPity
      },
      location: JSON.parse(JSON.stringify(location))
    })
  }

  // 组件挂载时初始化 Worker
  onMounted(() => {
    window.addEventListener('resize', updateViewportWidth)
    initWorker()
  })

  // 组件卸载时清理 Worker 和定时器
  onUnmounted(() => {
    window.removeEventListener('resize', updateViewportWidth)
    if (pendingExploration.value) playerStore.spirit += pendingExploration.value.spiritCost
    pendingExploration.value = null
    isResolving.value = false
    if (explorationWorker.value) {
      explorationWorker.value.terminate()
    }
    Object.values(explorationTimers.value).forEach(timer => clearInterval(timer))
    explorationTimers.value = {}
    exploringLocations.value = {}
  })

  // 获取可用地点列表
  const availableLocations = computed(() => {
    return locations.filter(loc => playerStore.level >= loc.minLevel)
  })
  const statisticsColumns = computed(() => (viewportWidth.value < 640 ? 1 : 2))
  const maxHealth = computed(() => Math.max(1, playerStore.baseAttributes.health))
  const healthPercentage = computed(() => Math.round((playerStore.currentHealth / maxHealth.value) * 100))
  const recoveryCost = computed(() => getRecoveryCost(maxHealth.value))
  const equipmentPityPercentage = computed(() => Math.round((playerStore.equipmentPity / 8) * 100))
  const activeTechnique = computed(() =>
    selectTechniqueForCombat(
      playerStore.unlockedSkills,
      playerStore.activeTechniqueId,
      playerStore.techniqueLevels
    )
  )
  const combatDamageDealt = computed(() =>
    (lastCombatResult.value?.log || [])
      .filter(entry => entry.side === 'player')
      .reduce((total, entry) => total + entry.damage, 0)
  )
  const combatDamageTaken = computed(() =>
    Math.max(0, (lastCombatResult.value?.playerHealthBefore || 0) - (lastCombatResult.value?.playerHealthAfter || 0))
  )

  const updateViewportWidth = () => {
    viewportWidth.value = window.innerWidth
  }

  // 显示消息并处理重复
  const showMessage = (type, content) => {
    return logRef.value?.addLog(type, content)
  }

  const refundPendingExploration = requestId => {
    if (!pendingExploration.value || pendingExploration.value.requestId !== requestId) return
    playerStore.spirit += pendingExploration.value.spiritCost
    pendingExploration.value = null
    isResolving.value = false
  }

  const recoverHealth = () => {
    const result = playerStore.recoverHealth()
    if (result.success) {
      showMessage('success', `调息完成，消耗${result.cost}点灵力，恢复${result.heal}点气血。`)
    } else if (result.reason === 'spirit') {
      showMessage('error', `灵力不足，调息需要${result.cost}点灵力。`)
    }
  }

  const riskType = chance => (chance >= 0.28 ? 'error' : chance >= 0.2 ? 'warning' : 'success')
  const combatOutcomeType = outcome => (outcome === 'victory' ? 'success' : outcome === 'defeat' ? 'error' : 'warning')
  const combatOutcomeText = outcome => (outcome === 'victory' ? '胜利' : outcome === 'defeat' ? '战败' : '暂退')
  const techniqueStyleType = style =>
    style === 'armor_break' ? 'warning' : style === 'critical_burst' ? 'error' : 'default'
  const formatCombatEntry = entry => {
    const action = entry.actionType === 'technique' ? `施展${entry.techniqueName}` : '出手'
    if (entry.isDodged) return `${entry.attacker}${action}，被${entry.target}避开`
    const effect = entry.effectText ? `，触发${entry.effectText}` : ''
    return `${entry.attacker}${action}，对${entry.target}造成${entry.damage}点伤害${entry.isCritical ? '（暴击）' : ''}${effect}`
  }

  // 开始自动探索
  const startAutoExploration = location => {
    if (exploringLocations.value[location.id] || isAutoExploring.value) return
    isAutoExploring.value = true
    autoExploringLocationId.value = location.id
    exploringLocations.value[location.id] = true
    explorationTimers.value[location.id] = setInterval(() => {
      if (playerStore.spirit >= location.spiritCost && playerStore.currentHealth > 0) {
        exploreLocation(location)
      } else {
        stopAutoExploration(location)
        showMessage('warning', '灵力不足，自动探索已停止！')
      }
    }, explorationInterval)
  }

  // 停止自动探索
  const stopAutoExploration = location => {
    if (explorationTimers.value[location.id]) {
      clearInterval(explorationTimers.value[location.id])
      delete explorationTimers.value[location.id]
    }
    exploringLocations.value[location.id] = false
    isAutoExploring.value = false
    autoExploringLocationId.value = null
  }

  const stopAllExploration = () => {
    Object.values(explorationTimers.value).forEach(timer => clearInterval(timer))
    explorationTimers.value = {}
    exploringLocations.value = {}
    isAutoExploring.value = false
    autoExploringLocationId.value = null
  }

  // 组件卸载时清理所有定时器
  onUnmounted(() => {
    Object.values(explorationTimers.value).forEach(timer => clearInterval(timer))
    explorationTimers.value = {}
    exploringLocations.value = {}
  })

  const clearLogPanel = () => {
    logRef.value?.clearLogs()
  }
</script>

<style scoped>
  .n-space {
    width: 100%;
  }

  .n-card {
    margin-bottom: 12px;
  }

  .n-collapse {
    margin-top: 12px;
  }

  .vitality-panel {
    padding: 12px;
    border: 1px solid var(--n-border-color);
    border-radius: 6px;
  }

  .equipment-fortune {
    padding: 12px;
    border: 1px solid var(--n-border-color);
    border-radius: 6px;
  }

  .technique-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--n-border-color);
    border-left: 3px solid #2f855a;
    border-radius: 6px;
  }

  .technique-panel strong,
  .technique-panel .n-text {
    display: block;
  }

  .combat-result {
    padding: 12px;
    border: 1px solid var(--n-border-color);
    border-left: 3px solid #b7791f;
    border-radius: 6px;
  }

  .combat-result-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .combat-result-heading strong,
  .combat-result-heading .n-text {
    display: block;
  }

  .enemy-preview {
    display: grid;
    gap: 6px;
  }

  .boss-preview {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .combat-log-entry {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 8px;
    padding: 7px 0;
    border-bottom: 1px solid var(--n-border-color);
  }

  .combat-log-entry:last-child {
    border-bottom: 0;
  }

  .fortune-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .fortune-heading strong,
  .fortune-heading .n-text {
    display: block;
  }

  .vitality-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .vitality-heading strong,
  .vitality-heading .n-text {
    display: block;
  }

  @media (max-width: 520px) {
    .vitality-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .fortune-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .combat-result-heading {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .technique-panel {
      align-items: flex-start;
      flex-direction: column;
    }

    .combat-log-entry {
      grid-template-columns: 1fr;
      gap: 2px;
    }
  }
</style>
