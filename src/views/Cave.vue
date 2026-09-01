<template>
  <n-layout-content class="cave-page">
    <header class="page-heading">
      <div>
        <n-text depth="3">一处值守，一脉积蓄</n-text>
        <h1 id="cave-title">洞府</h1>
      </div>
      <n-tag type="success" size="small">离线结算上限 8 小时</n-tag>
    </header>

    <section class="cave-summary" aria-label="洞府总览">
      <div>
        <n-text depth="3">当前值守</n-text>
        <strong>{{ activeFacility.name }}</strong>
      </div>
      <div>
        <n-text depth="3">待领取灵力</n-text>
        <strong>{{ pendingReward.spirit }}</strong>
      </div>
      <div>
        <n-text depth="3">待领取强化石</n-text>
        <strong>{{ pendingReward.reinforceStones }}</strong>
      </div>
    </section>

    <section class="duty-section" aria-labelledby="duty-title">
      <div class="section-heading">
        <div>
          <n-text depth="3">收益随选择改变</n-text>
          <h2 id="duty-title">值守安排</h2>
        </div>
        <n-text depth="3">切换前会先结算当前建筑。</n-text>
      </div>

      <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="12">
        <n-grid-item v-for="facility in CAVE_FACILITIES" :key="facility.id">
          <n-card
            size="small"
            :class="['facility-card', { active: facility.id === activeFacility.id }]"
          >
            <template #header>
              <div class="card-heading">
                <div>
                  <n-text depth="3">{{ facility.id === activeFacility.id ? '当前值守' : '可选建筑' }}</n-text>
                  <strong>{{ facility.name }}</strong>
                </div>
                <n-tag :type="facility.id === activeFacility.id ? 'success' : 'default'" size="small">
                  {{ facilityRewardLabel(facility) }}
                </n-tag>
              </div>
            </template>

            <div class="facility-body">
              <n-text depth="3">{{ facility.description }}</n-text>
              <n-button
                :type="facility.id === activeFacility.id ? 'default' : 'primary'"
                secondary
                block
                :disabled="facility.id === activeFacility.id"
                @click="handleDutyChange(facility)"
              >
                <template #icon><n-icon><SwapOutlined /></n-icon></template>
                {{ facility.id === activeFacility.id ? '正在值守' : `改派至${facility.name}` }}
              </n-button>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
    </section>

    <section class="settlement-section" aria-labelledby="settlement-title">
      <div class="section-heading settlement-heading">
        <div>
          <n-text depth="3">{{ settlementSource }}</n-text>
          <h2 id="settlement-title">待领取收益</h2>
        </div>
        <n-text depth="3">{{ settlementDuration }}</n-text>
      </div>

      <div class="reward-ledger">
        <div>
          <span>灵力</span>
          <strong>+{{ pendingReward.spirit }}</strong>
        </div>
        <div>
          <span>强化石</span>
          <strong>+{{ pendingReward.reinforceStones }}</strong>
        </div>
      </div>

      <div class="settlement-actions">
        <n-button type="primary" size="large" :disabled="!hasPendingReward" @click="handleClaim">
          <template #icon><n-icon><InboxOutlined /></n-icon></template>
          {{ hasPendingReward ? '收取全部' : '暂无可收取收益' }}
        </n-button>

        <div v-if="lastClaim" class="next-action" aria-live="polite">
          <div>
            <n-text depth="3">本次已收取</n-text>
            <strong>{{ formatReward(lastClaim) }}</strong>
          </div>
          <div class="next-action-buttons">
            <n-button v-for="action in nextActions" :key="action.path" secondary @click="router.push(action.path)">
              <template #icon><n-icon><ArrowRightOutlined /></n-icon></template>
              {{ action.label }}
            </n-button>
          </div>
        </div>
      </div>
    </section>
  </n-layout-content>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useMessage } from 'naive-ui'
  import { ArrowRightOutlined, InboxOutlined, SwapOutlined } from '@ant-design/icons-vue'
  import { CAVE_FACILITIES, getCaveFacilityById } from '../plugins/cave'
  import { usePlayerStore } from '../stores/player'

  const router = useRouter()
  const message = useMessage()
  const playerStore = usePlayerStore()
  const lastClaim = ref(null)

  const activeFacility = computed(() =>
    getCaveFacilityById(playerStore.caveState.activeFacilityId) || CAVE_FACILITIES[0]
  )
  const pendingReward = computed(() => ({
    spirit: Number(playerStore.caveState.pendingReward?.spirit) || 0,
    reinforceStones: Number(playerStore.caveState.pendingReward?.reinforceStones) || 0
  }))
  const hasPendingReward = computed(() => pendingReward.value.spirit > 0 || pendingReward.value.reinforceStones > 0)
  const lastSettlement = computed(() => playerStore.caveState.lastSettlement)
  const settlementFacility = computed(() => getCaveFacilityById(lastSettlement.value?.facilityId))
  const settlementSource = computed(() =>
    lastSettlement.value ? `最近由${settlementFacility.value?.name || '洞府'}产出` : `${activeFacility.value.name}正在积蓄`
  )
  const settlementDuration = computed(() =>
    lastSettlement.value ? `最近结算 ${formatDuration(lastSettlement.value.elapsedSeconds)}` : '尚无离线结算记录'
  )
  const nextActions = computed(() => [
    lastClaim.value?.spirit > 0 ? { path: '/cultivation', label: '前往修炼' } : null,
    lastClaim.value?.reinforceStones > 0 ? { path: '/inventory', label: '前往强化装备' } : null
  ].filter(Boolean))

  const formatDuration = seconds => {
    const totalMinutes = Math.max(0, Math.floor((Number(seconds) || 0) / 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0 && minutes > 0) return `${hours} 小时 ${minutes} 分钟`
    if (hours > 0) return `${hours} 小时`
    return `${minutes} 分钟`
  }

  const facilityRewardLabel = facility => facility.rewardKey === 'spirit'
    ? `每秒 ${formatRate(playerStore.effectiveSpiritRate)} 灵力`
    : '每 30 分钟 1 强化石'
  const formatRate = value => Number(value || 1).toFixed(Number.isInteger(value) ? 0 : 1)
  const formatReward = reward => [
    reward.spirit > 0 ? `${reward.spirit} 灵力` : '',
    reward.reinforceStones > 0 ? `${reward.reinforceStones} 强化石` : ''
  ].filter(Boolean).join('、')

  const handleDutyChange = facility => {
    const result = playerStore.changeCaveDuty(facility.id)
    if (result.success) message.success(`已改派至${facility.name}`)
  }

  const handleClaim = () => {
    const result = playerStore.claimCavePending()
    if (!result.success) {
      message.info('暂无可收取收益')
      return
    }
    lastClaim.value = result.settlement.reward
    message.success(`已收取${formatReward(lastClaim.value)}`)
  }

</script>

<style scoped>
  .cave-page {
    display: grid;
    gap: 20px;
  }

  .page-heading,
  .section-heading,
  .card-heading,
  .settlement-actions,
  .next-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .next-action-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .page-heading {
    align-items: flex-end;
  }

  h1,
  h2 {
    letter-spacing: 0;
  }

  h1 {
    margin: 2px 0 0;
    font-size: 24px;
  }

  h2 {
    margin: 2px 0 0;
    font-size: 18px;
  }

  .cave-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 14px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .cave-summary > div {
    min-width: 0;
    padding-left: 12px;
    border-left: 3px solid var(--jade);
  }

  .cave-summary strong,
  .cave-summary .n-text,
  .card-heading strong,
  .card-heading .n-text,
  .next-action strong,
  .next-action .n-text {
    display: block;
  }

  .cave-summary strong {
    margin-top: 2px;
    font-size: 18px;
  }

  .duty-section,
  .settlement-section,
  .facility-body,
  .settlement-actions {
    display: grid;
    gap: 12px;
  }

  .facility-card {
    height: 100%;
    border-left: 3px solid transparent;
  }

  .facility-card.active {
    border-left-color: var(--jade);
  }

  .card-heading > div,
  .next-action > div {
    min-width: 0;
  }

  .reward-ledger {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .reward-ledger > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
    padding: 14px 12px;
  }

  .reward-ledger > div + div {
    border-left: 1px solid var(--line);
  }

  .reward-ledger span {
    color: var(--muted);
  }

  .reward-ledger strong {
    font-size: 18px;
  }

  .settlement-actions > .n-button {
    justify-self: start;
    min-width: 180px;
  }

  .next-action {
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: color-mix(in srgb, var(--surface) 84%, transparent);
  }

  @media (max-width: 640px) {
    .page-heading,
    .section-heading,
    .next-action {
      align-items: flex-start;
      flex-direction: column;
    }

    .cave-summary,
    .reward-ledger {
      grid-template-columns: 1fr;
    }

    .reward-ledger > div + div {
      border-top: 1px solid var(--line);
      border-left: 0;
    }

    .settlement-actions > .n-button,
    .next-action-buttons,
    .next-action .n-button {
      width: 100%;
    }
  }
</style>
