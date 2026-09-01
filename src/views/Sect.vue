<template>
  <n-layout-content class="sect-page">
    <header class="page-heading">
      <div>
        <n-text depth="3">山门传承，因材授道</n-text>
        <h1 id="sect-title">宗门</h1>
      </div>
      <n-text depth="3">择一门庭安身修行，以宗门贡献精进传承、承接委托并兑换修行资粮。</n-text>
    </header>

    <template v-if="!joinedSect">
      <section class="selection-section" aria-labelledby="selection-title">
        <div class="section-heading">
          <div>
            <n-text depth="3">一入山门，此志不移</n-text>
            <h2 id="selection-title">选择宗门</h2>
          </div>
          <n-tag type="warning" size="small">选择后不可更改</n-tag>
        </div>

        <n-grid responsive="screen" cols="1 s:3" :x-gap="12" :y-gap="12">
          <n-grid-item v-for="sect in SECTS" :key="sect.id">
            <n-card size="small" class="selection-card">
              <template #header>
                <div class="card-heading">
                  <div>
                    <n-text depth="3">门派传承</n-text>
                    <strong>{{ sect.name }}</strong>
                  </div>
                  <n-tag type="success" size="small">{{ formatBonuses(sect.bonuses) }}</n-tag>
                </div>
              </template>
              <div class="selection-body">
                <n-text depth="3">{{ sect.description }}</n-text>
                <n-popconfirm
                  :positive-text="`拜入${sect.name}`"
                  negative-text="再想想"
                  @positive-click="handleChooseSect(sect)"
                >
                  <template #trigger>
                    <n-button type="primary" block>
                      <template #icon><n-icon><TeamOutlined /></n-icon></template>
                      拜入{{ sect.name }}
                    </n-button>
                  </template>
                  宗门一经选择便不可更改，确定拜入{{ sect.name }}？
                </n-popconfirm>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </section>
    </template>

    <template v-else>
      <section class="sect-summary" aria-label="宗门总览">
        <div>
          <n-text depth="3">所属宗门</n-text>
          <strong>{{ joinedSect.name }}</strong>
        </div>
        <div>
          <n-text depth="3">宗门位阶</n-text>
          <strong>第 {{ playerStore.sectState.level }} / {{ MAX_SECT_LEVEL }} 阶</strong>
        </div>
        <div>
          <n-text depth="3">宗门贡献</n-text>
          <strong>{{ playerStore.sectState.contribution }}</strong>
        </div>
        <div>
          <n-text depth="3">修行方向</n-text>
          <strong>{{ activeDirection?.name || '尚未选择' }}</strong>
        </div>
      </section>

      <section class="overview-panel" aria-labelledby="overview-title">
        <div class="overview-copy">
          <n-text depth="3">{{ joinedSect.description }}</n-text>
          <h2 id="overview-title">{{ joinedSect.name }}传承</h2>
          <div class="bonus-line">
            <n-tag type="success" size="small">宗门加成</n-tag>
            <span>{{ formatBonuses(joinedSect.bonuses) }}</span>
          </div>
        </div>
        <div class="upgrade-block">
          <div class="progress-heading">
            <span>{{ upgradeCost === null ? '传承已臻圆满' : `升阶需 ${upgradeCost} 贡献` }}</span>
            <strong>{{ upgradeCost === null ? '100%' : `${upgradePercentage}%` }}</strong>
          </div>
          <n-progress
            type="line"
            :percentage="upgradePercentage"
            :show-indicator="false"
            :color="upgradeCost === null ? '#2f855a' : '#b7791f'"
          />
          <n-button
            type="primary"
            :disabled="upgradeCost === null"
            @click="handleUpgradeSect"
          >
            <template #icon><n-icon><ArrowUpOutlined /></n-icon></template>
            {{ upgradeCost === null ? '已达最高位阶' : '提升宗门位阶' }}
          </n-button>
        </div>
      </section>

      <section class="content-section" aria-labelledby="directions-title">
        <div class="section-heading">
          <div>
            <n-text depth="3">专精一途，增益不会叠加</n-text>
            <h2 id="directions-title">修行方向</h2>
          </div>
          <n-text depth="3" class="section-note">{{ directionSwitchNote }}</n-text>
        </div>

        <n-grid responsive="screen" cols="1 s:2 l:4" :x-gap="12" :y-gap="12">
          <n-grid-item v-for="direction in CULTIVATION_DIRECTIONS" :key="direction.id">
            <n-card
              size="small"
              :class="['direction-card', { active: direction.id === playerStore.sectState.directionId }]"
            >
              <template #header>
                <div class="card-heading">
                  <div>
                    <n-text depth="3">{{ direction.id === playerStore.sectState.directionId ? '当前专精' : '修行专精' }}</n-text>
                    <strong>{{ direction.name }}</strong>
                  </div>
                  <n-tag :type="direction.id === playerStore.sectState.directionId ? 'success' : 'default'" size="small">
                    {{ formatBonuses(direction.bonuses) }}
                  </n-tag>
                </div>
              </template>
              <div class="direction-body">
                <n-text depth="3">{{ direction.description }}</n-text>
                <n-button
                  :type="direction.id === playerStore.sectState.directionId ? 'default' : 'primary'"
                  secondary
                  block
                  :disabled="direction.id === playerStore.sectState.directionId"
                  @click="handleDirectionChange(direction)"
                >
                  <template #icon><n-icon><CompassOutlined /></n-icon></template>
                  {{ directionButtonLabel(direction.id) }}
                </n-button>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </section>

      <section class="content-section" aria-labelledby="commissions-title">
        <div class="section-heading">
          <div>
            <n-text depth="3">每日各可承接一次</n-text>
            <h2 id="commissions-title">宗门委托</h2>
          </div>
          <n-text depth="3" class="section-note">资源在承接时扣除，完成后领取贡献。</n-text>
        </div>

        <n-grid responsive="screen" cols="1 m:3" :x-gap="12" :y-gap="12">
          <n-grid-item v-for="commission in commissions" :key="commission.id">
            <n-card size="small" :class="['commission-card', `status-${commission.status}`]">
              <template #header>
                <div class="card-heading">
                  <div>
                    <n-text depth="3">{{ commission.durationLabel }}</n-text>
                    <strong>{{ commission.name }}</strong>
                  </div>
                  <n-tag :type="commissionTagType(commission.status)" size="small">
                    {{ commissionStatusLabel(commission) }}
                  </n-tag>
                </div>
              </template>

              <div class="commission-body">
                <dl class="resource-list">
                  <div>
                    <dt>承接消耗</dt>
                    <dd>{{ formatResources(commission.cost) }}</dd>
                  </div>
                  <div>
                    <dt>完成奖励</dt>
                    <dd>{{ formatResources(commission.reward) }}</dd>
                  </div>
                </dl>
                <n-button
                  :type="commission.status === 'claimable' ? 'primary' : 'default'"
                  :secondary="commission.status !== 'claimable'"
                  block
                  :disabled="commission.status === 'active' || commission.status === 'claimed'"
                  @click="handleCommission(commission)"
                >
                  <template #icon>
                    <n-icon>
                      <CheckCircleOutlined v-if="commission.status === 'claimable' || commission.status === 'claimed'" />
                      <ClockCircleOutlined v-else />
                    </n-icon>
                  </template>
                  {{ commissionActionLabel(commission) }}
                </n-button>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </section>

      <section class="content-section" aria-labelledby="shop-title">
        <div class="section-heading shop-heading">
          <div>
            <n-text depth="3">每日轮换，购买次数当日计算</n-text>
            <h2 id="shop-title">贡献商店</h2>
          </div>
          <div class="shop-refresh">
            <n-text depth="3">今日刷新 {{ shopState.refreshCount }} / {{ SHOP_DAILY_REFRESH_LIMIT }} · 消耗 {{ SHOP_REFRESH_COST }} 贡献</n-text>
            <n-button
              secondary
              :disabled="shopState.refreshCount >= SHOP_DAILY_REFRESH_LIMIT"
              @click="handleRefreshShop"
            >
              <template #icon><n-icon><ReloadOutlined /></n-icon></template>
              刷新货架
            </n-button>
          </div>
        </div>

        <n-grid responsive="screen" cols="1 s:3" :x-gap="12" :y-gap="12">
          <n-grid-item v-for="offer in shopOffers" :key="offer.id">
            <n-card size="small" class="shop-card">
              <template #header>
                <div class="card-heading">
                  <div>
                    <n-text depth="3">宗门资粮</n-text>
                    <strong>{{ offer.name }}</strong>
                  </div>
                  <n-tag :type="offer.remaining === 0 ? 'default' : 'warning'" size="small">
                    剩余 {{ offer.remaining }} / {{ offer.purchaseLimit }}
                  </n-tag>
                </div>
              </template>
              <div class="shop-body">
                <div class="shop-reward">
                  <n-text depth="3">内含</n-text>
                  <strong>{{ formatResources(offer.reward) }}</strong>
                </div>
                <n-button
                  type="primary"
                  secondary
                  block
                  :disabled="offer.remaining === 0"
                  @click="handleBuyOffer(offer)"
                >
                  <template #icon><n-icon><ShoppingCartOutlined /></n-icon></template>
                  {{ offer.remaining === 0 ? '今日已购完' : `${offer.contributionCost} 贡献兑换` }}
                </n-button>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </section>
    </template>
  </n-layout-content>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useMessage } from 'naive-ui'
  import {
    ArrowUpOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CompassOutlined,
    ReloadOutlined,
    ShoppingCartOutlined,
    TeamOutlined
  } from '@ant-design/icons-vue'
  import {
    COMMISSION_DEFINITIONS,
    CULTIVATION_DIRECTIONS,
    DIRECTION_SWITCH_COOLDOWN_MS,
    DIRECTION_SWITCH_COST,
    MAX_SECT_LEVEL,
    SECTS,
    SHOP_DAILY_REFRESH_LIMIT,
    SHOP_REFRESH_COST,
    getCommissionStatus,
    getCultivationDirectionById,
    getSectById,
    getSectShopOffers,
    getSectUpgradeCost
  } from '../plugins/sect'
  import { getDateKey } from '../plugins/tasks'
  import { usePlayerStore } from '../stores/player'

  const RESOURCE_LABELS = {
    spirit: '灵力',
    spiritStones: '灵石',
    reinforceStones: '强化石',
    refinementStones: '洗练石',
    sectContribution: '宗门贡献'
  }
  const BONUS_LABELS = {
    spiritRate: '灵力获取',
    cultivationRate: '修行速度',
    combatRewardRate: '战斗收益',
    herbYieldRate: '灵草收获',
    explorationRewardRate: '历练收益',
    alchemySuccessRate: '炼丹成功',
    dungeonRewardRate: '秘境收益'
  }

  const message = useMessage()
  const playerStore = usePlayerStore()
  const now = ref(Date.now())
  const activeDateKey = ref(getDateKey())
  let timerId = null

  const joinedSect = computed(() => getSectById(playerStore.sectState.sectId))
  const activeDirection = computed(() => getCultivationDirectionById(playerStore.sectState.directionId))
  const upgradeCost = computed(() => getSectUpgradeCost(playerStore.sectState.level))
  const upgradePercentage = computed(() => {
    if (upgradeCost.value === null) return 100
    return Math.min(100, Math.round((playerStore.sectState.contribution / upgradeCost.value) * 100))
  })
  const directionCooldownMs = computed(() => {
    if (!playerStore.sectState.directionId || playerStore.sectState.directionChangedAt === null) return 0
    return Math.max(0, playerStore.sectState.directionChangedAt + DIRECTION_SWITCH_COOLDOWN_MS - now.value)
  })
  const directionSwitchNote = computed(() => {
    if (!playerStore.sectState.directionId) return '首次选择免费'
    if (directionCooldownMs.value > 0) return `距下次切换还有 ${formatRemaining(directionCooldownMs.value)}`
    return `切换消耗 ${DIRECTION_SWITCH_COST} 宗门贡献`
  })
  const commissions = computed(() => Object.entries(COMMISSION_DEFINITIONS).map(([id, definition]) => {
    const state = playerStore.sectOperationsState.commissions?.[id]
    const status = getCommissionStatus(state, now.value)
    return {
      id,
      ...definition,
      state,
      status,
      durationLabel: `约需 ${formatDuration(definition.durationMs)}`,
      remainingMs: status === 'active' ? Math.max(0, state.completesAt - now.value) : 0
    }
  }))
  const shopState = computed(() => playerStore.sectOperationsState.shop || {
    refreshCount: 0,
    purchases: {}
  })
  const shopOffers = computed(() => getSectShopOffers(playerStore.sectOperationsState, activeDateKey.value).map(offer => {
    const purchased = shopState.value.purchases?.[offer.id] || 0
    return { ...offer, purchased, remaining: Math.max(0, offer.purchaseLimit - purchased) }
  }))

  const formatRemaining = milliseconds => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (hours > 0) return `${hours}时${minutes}分`
    if (minutes > 0) return `${minutes}分${seconds}秒`
    return `${seconds}秒`
  }
  const formatDuration = milliseconds => {
    const minutes = Math.round(milliseconds / 60000)
    if (minutes >= 60) return `${Math.floor(minutes / 60)}小时${minutes % 60 ? `${minutes % 60}分` : ''}`
    return `${minutes}分钟`
  }
  const formatResources = resources => Object.entries(resources || {})
    .map(([key, amount]) => `${RESOURCE_LABELS[key] || key} ${amount}`)
    .join(' · ')
  const formatBonuses = bonuses => Object.entries(bonuses || {})
    .map(([key, multiplier]) => `${BONUS_LABELS[key] || key} +${Math.round((multiplier - 1) * 100)}%`)
    .join(' · ')

  const directionButtonLabel = directionId => {
    if (directionId === playerStore.sectState.directionId) return '当前方向'
    if (!playerStore.sectState.directionId) return '选择方向（免费）'
    if (directionCooldownMs.value > 0) return `冷却中 ${formatRemaining(directionCooldownMs.value)}`
    return `${DIRECTION_SWITCH_COST} 贡献切换`
  }
  const commissionTagType = status => ({ available: 'default', active: 'warning', claimable: 'success', claimed: 'default' }[status])
  const commissionStatusLabel = commission => {
    if (commission.status === 'active') return `进行中 ${formatRemaining(commission.remainingMs)}`
    return { available: '可承接', claimable: '可领取', claimed: '已完成' }[commission.status]
  }
  const commissionActionLabel = commission => {
    if (commission.status === 'active') return `剩余 ${formatRemaining(commission.remainingMs)}`
    return { available: '承接委托', claimable: '领取奖励', claimed: '今日已完成' }[commission.status]
  }

  const showFailure = (reason, context = {}) => {
    const contributionCost = context.cost ?? context.contributionCost
    const messages = {
      invalid_sect: '该宗门不存在，请重新选择。',
      already_joined: '你已拜入宗门，无法再次选择。',
      not_joined: '请先选择并加入一个宗门。',
      max_level: '宗门位阶已达最高。',
      insufficient_contribution: `宗门贡献不足${contributionCost ? `，需要 ${contributionCost}` : ''}。`,
      invalid_direction: '该修行方向不存在。',
      same_direction: '这已经是当前修行方向。',
      cooldown: `修行方向尚在冷却，还需 ${formatRemaining(context.remainingCooldownMs || 0)}。`,
      invalid_commission: '该宗门委托不存在。',
      already_started: '这项委托今日已经承接。',
      insufficient_resources: `修行资源不足${context.cost ? `，需要 ${formatResources(context.cost)}` : ''}。`,
      challenge_unavailable: '当前境界没有可用的试剑对手。',
      challenge_failed: '试剑未能取胜，消耗已扣除，整顿后再来。',
      not_started: '这项委托尚未承接。',
      not_ready: '委托尚未完成，请稍候。',
      already_claimed: '这项委托奖励已经领取。',
      refresh_limit: '今日商店刷新次数已用完。',
      item_unavailable: '该物品已不在当前货架。',
      purchase_limit: '该物品今日购买次数已达上限。'
    }
    message.warning(messages[reason] || '操作未能完成，请稍后重试。')
  }

  const handleChooseSect = sect => {
    const result = playerStore.chooseSect(sect.id)
    if (result.success) message.success(`已拜入${sect.name}`)
    else showFailure(result.reason, result)
  }
  const handleUpgradeSect = () => {
    const result = playerStore.upgradePlayerSect()
    if (result.success) message.success(`宗门位阶提升至第 ${result.state.level} 阶`)
    else showFailure(result.reason, result)
  }
  const handleDirectionChange = direction => {
    const result = playerStore.changeSectDirection(direction.id, now.value)
    if (result.success) {
      message.success(result.cost > 0 ? `已切换为${direction.name}，消耗 ${result.cost} 贡献` : `已选择${direction.name}`)
    } else {
      showFailure(result.reason, result)
    }
  }
  const handleCommission = commission => {
    if (commission.status === 'claimable') {
      const result = playerStore.claimSectCommission(commission.id, now.value)
      if (result.success) message.success(`${commission.name}奖励已领取：${formatResources(result.settlement.reward)}`)
      else showFailure(result.reason, result)
      return
    }
    const result = playerStore.startSectCommission(commission.id, now.value)
    if (result.success) message.success(`${commission.name}已承接，预计 ${formatDuration(commission.durationMs)} 后完成`)
    else showFailure(result.reason, result)
  }
  const handleRefreshShop = () => {
    const result = playerStore.refreshPlayerSectShop(activeDateKey.value)
    if (result.success) message.success(`货架已刷新，消耗 ${result.contributionCost} 宗门贡献`)
    else showFailure(result.reason, result)
  }
  const handleBuyOffer = offer => {
    const result = playerStore.buySectShopItem(offer.id, activeDateKey.value)
    if (result.success) message.success(`已兑换${offer.name}：${formatResources(result.settlement.reward)}`)
    else showFailure(result.reason, result)
  }

  const syncDailyState = () => {
    const nextDateKey = getDateKey()
    if (nextDateKey !== activeDateKey.value) activeDateKey.value = nextDateKey
    playerStore.syncSectOperations(nextDateKey)
  }

  onMounted(() => {
    syncDailyState()
    timerId = window.setInterval(() => {
      now.value = Date.now()
      if (getDateKey() !== activeDateKey.value) syncDailyState()
    }, 1000)
  })
  onBeforeUnmount(() => window.clearInterval(timerId))
</script>

<style scoped>
  .sect-page {
    display: grid;
    gap: 18px;
  }

  .page-heading,
  .section-heading,
  .card-heading,
  .progress-heading,
  .shop-refresh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .page-heading {
    align-items: flex-end;
  }

  .page-heading > .n-text {
    max-width: 38rem;
    text-align: right;
  }

  h1,
  h2 {
    margin: 0;
    color: var(--jade-deep);
    font-family: KaiTi, STKaiti, serif;
    letter-spacing: 0;
  }

  h1 {
    margin-top: 2px;
    font-size: 26px;
  }

  h2 {
    margin-top: 2px;
    font-size: 20px;
  }

  .selection-section,
  .content-section {
    display: grid;
    gap: 12px;
  }

  .sect-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 14px 0;
    border-top: 1px solid var(--n-border-color);
    border-bottom: 1px solid var(--n-border-color);
  }

  .sect-summary > div {
    min-width: 0;
    padding-left: 12px;
    border-left: 3px solid var(--jade);
  }

  .sect-summary strong,
  .sect-summary .n-text,
  .card-heading strong,
  .card-heading .n-text {
    display: block;
  }

  .sect-summary strong {
    margin-top: 2px;
    font-size: 18px;
  }

  .overview-panel {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr);
    gap: 20px;
    padding: 16px;
    border: 1px solid var(--line);
    border-left: 3px solid var(--gold);
    border-radius: 6px;
    background: color-mix(in srgb, var(--surface) 86%, var(--jade-pale));
  }

  .overview-copy,
  .upgrade-block,
  .selection-body,
  .direction-body,
  .commission-body,
  .shop-body {
    display: grid;
    gap: 12px;
  }

  .bonus-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    color: var(--ink);
  }

  .progress-heading {
    font-size: 13px;
  }

  .progress-heading strong {
    font-variant-numeric: tabular-nums;
  }

  .selection-card,
  .direction-card,
  .commission-card,
  .shop-card {
    height: 100%;
    border-left: 3px solid transparent !important;
  }

  .selection-card {
    border-left-color: var(--gold) !important;
  }

  .direction-card.active,
  .commission-card.status-claimable {
    border-left-color: var(--jade) !important;
  }

  .commission-card.status-active {
    border-left-color: var(--gold) !important;
  }

  .card-heading {
    flex-wrap: wrap;
  }

  .card-heading > div {
    min-width: 0;
  }

  .card-heading strong {
    margin-top: 2px;
    font-size: 17px;
  }

  .card-heading .n-tag {
    max-width: 100%;
  }

  .section-note {
    max-width: 34rem;
    text-align: right;
  }

  .resource-list {
    display: grid;
    gap: 8px;
    margin: 0;
  }

  .resource-list > div {
    display: grid;
    grid-template-columns: 74px minmax(0, 1fr);
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }

  .resource-list dt {
    color: var(--muted);
    font-size: 12px;
  }

  .resource-list dd {
    margin: 0;
    text-align: right;
  }

  .shop-heading {
    align-items: flex-end;
  }

  .shop-refresh {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .shop-reward {
    min-height: 48px;
  }

  .shop-reward .n-text,
  .shop-reward strong {
    display: block;
  }

  .shop-reward strong {
    margin-top: 3px;
  }

  @media (max-width: 760px) {
    .page-heading,
    .section-heading,
    .shop-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .page-heading > .n-text,
    .section-note {
      text-align: left;
    }

    .sect-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .overview-panel {
      grid-template-columns: 1fr;
    }

    .shop-refresh {
      align-items: flex-start;
      justify-content: flex-start;
    }
  }

  @media (max-width: 420px) {
    .sect-summary {
      grid-template-columns: 1fr;
    }

    .overview-panel {
      padding: 12px;
    }

    .shop-refresh,
    .shop-refresh .n-button {
      width: 100%;
    }
  }
</style>
