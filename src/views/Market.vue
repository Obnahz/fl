<template>
  <n-layout-content class="market-page">
    <header class="page-heading">
      <div>
        <n-text depth="3">灵石交易，货真价实</n-text>
        <h1 id="market-title">坊市</h1>
      </div>
      <n-space align="center">
        <n-statistic label="灵石" :value="playerStore.spiritStones" />
        <n-text depth="3">今日货架 · {{ todayLabel }}</n-text>
        <n-button
          secondary
          :disabled="playerStore.marketState.refreshCount >= 1 || playerStore.spiritStones < 120"
          @click="refreshOffers"
        >
          <template #icon><n-icon><ReloadOutlined /></n-icon></template>
          刷新货架 · 120 灵石
        </n-button>
      </n-space>
    </header>

    <n-alert type="info" show-icon>
      货物每日轮换，价格固定且购买次数有限。优先购买能解决当前瓶颈的资粮。
    </n-alert>

    <n-grid responsive="screen" cols="1 s:2 l:3" :x-gap="12" :y-gap="12" class="offer-grid">
      <n-grid-item v-for="offer in offers" :key="offer.id">
        <n-card size="small" :class="['offer-card', { sold: offer.remaining === 0 }]">
          <template #header>
            <div class="offer-heading">
              <strong>{{ offer.name }}</strong>
              <n-tag size="small" :type="offer.remaining ? 'warning' : 'default'">
                {{ offer.remaining ? `余 ${offer.remaining}` : '已售罄' }}
              </n-tag>
            </div>
          </template>
          <div class="offer-body">
            <n-text depth="3">{{ offer.description }}</n-text>
            <n-text depth="3">获得：{{ formatReward(offer.reward) }}</n-text>
            <n-button
              type="primary"
              block
              :disabled="offer.remaining === 0 || playerStore.spiritStones < offer.price || buyingId === offer.id"
              :loading="buyingId === offer.id"
              @click="buyOffer(offer)"
            >
              {{ playerStore.spiritStones < offer.price ? `需要 ${offer.price} 灵石` : `购买 · ${offer.price} 灵石` }}
            </n-button>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>
  </n-layout-content>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useMessage } from 'naive-ui'
  import { ReloadOutlined } from '@ant-design/icons-vue'
  import { usePlayerStore } from '../stores/player'
  import { getDateKey } from '../plugins/tasks'

  const playerStore = usePlayerStore()
  const message = useMessage()
  const buyingId = ref(null)
  const todayLabel = getDateKey()
  const offers = computed(() => playerStore.getMarketOffers(todayLabel))

  const formatReward = reward => Object.entries(reward)
    .map(([key, amount]) => ({ spirit: '灵力', reinforceStones: '强化石', refinementStones: '洗炼石' }[key] || key) + ` ×${amount}`)
    .join('、')

  const buyOffer = offer => {
    if (buyingId.value) return
    buyingId.value = offer.id
    try {
      const result = playerStore.buyMarketOffer(offer.id, todayLabel)
      if (result.success) message.success(`已购买${offer.name}，获得${formatReward(result.settlement.reward)}`)
      else if (result.reason === 'insufficient_spirit_stones') message.error(`灵石不足，需要 ${result.price} 灵石`)
      else if (result.reason === 'purchase_limit') message.warning('该商品今日已售罄')
      else message.error('商品已下架，请刷新货架')
    } finally {
      buyingId.value = null
    }
  }

  const refreshOffers = () => {
    const result = playerStore.refreshMarket(todayLabel)
    if (result.success) message.success('货架已刷新，今日购买次数保留')
    else if (result.reason === 'refresh_limit') message.info('今日额外刷新次数已用完')
    else message.error(`灵石不足，需要 ${result.price} 灵石`)
  }
</script>

<style scoped>
  .market-page { display: grid; gap: 16px; }
  .page-heading, .offer-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  h1 { margin: 4px 0 0; }
  .offer-grid { margin-top: 4px; }
  .offer-body { display: grid; gap: 12px; }
  .offer-card.sold { opacity: .68; }
  @media (max-width: 640px) { .page-heading { align-items: flex-start; flex-direction: column; } }
</style>
