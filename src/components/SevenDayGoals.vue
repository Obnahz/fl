<template>
  <n-card title="七日问道" size="small">
    <template #header-extra>
      <n-text depth="3">第 {{ unlockedCount }} 日</n-text>
    </template>

    <div class="goal-list">
      <section
        v-for="goal in state.goals"
        :key="goal.day"
        class="goal-row"
        :class="{ locked: goal.day > unlockedCount }"
        :aria-label="'第' + goal.day + '日目标'"
      >
        <div class="day-mark">第 {{ goal.day }} 日</div>
        <div class="goal-main">
          <div class="goal-heading">
            <strong>{{ goal.title }}</strong>
            <n-tag v-if="goal.claimed" size="small" type="success">已领取</n-tag>
            <n-tag v-else-if="goal.completed" size="small" type="warning">可领取</n-tag>
            <n-tag v-else-if="goal.day > unlockedCount" size="small">未开放</n-tag>
          </div>
          <n-text depth="3">{{ goal.description }}</n-text>
          <n-progress
            type="line"
            :percentage="Math.round((goal.progress / goal.target) * 100)"
            :show-indicator="false"
            :height="6"
          />
          <n-text depth="3">{{ goal.progress }} / {{ goal.target }} · {{ rewardText(goal.reward) }}</n-text>
        </div>
        <n-button
          v-if="goal.completed && !goal.claimed"
          size="small"
          secondary
          type="success"
          @click="claim(goal.day)"
        >
          领取
        </n-button>
      </section>
    </div>
  </n-card>
</template>

<script setup>
  import { computed } from 'vue'
  import { useMessage } from 'naive-ui'
  import { getDateKey, getUnlockedSevenDayCount } from '../plugins/tasks'
  import { usePlayerStore } from '../stores/player'

  const playerStore = usePlayerStore()
  const message = useMessage()
  const state = computed(() => playerStore.sevenDayState)
  const unlockedCount = computed(() => getUnlockedSevenDayCount(state.value, getDateKey()))

  const rewardText = reward => {
    if (reward.cosmeticUnlock) return '称号：' + reward.cosmeticUnlock
    if (reward.spirit) return reward.spirit + ' 灵力'
    if (reward.spiritStones) return reward.spiritStones + ' 灵石'
    if (reward.reinforceStones) return reward.reinforceStones + ' 强化石'
    if (reward.refinementStones) return reward.refinementStones + ' 洗练石'
    return '修行奖励'
  }

  const claim = day => {
    const result = playerStore.claimSevenDayGoal(day)
    if (result.success) message.success('七日目标奖励已领取')
  }
</script>

<style scoped>
  .goal-list { display: grid; }
  .goal-row { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); }
  .goal-row:last-child { border-bottom: 0; }
  .goal-row.locked { opacity: .58; }
  .day-mark { color: var(--gold); font-weight: 700; }
  .goal-main { min-width: 0; display: grid; gap: 5px; }
  .goal-heading { display: flex; align-items: center; gap: 8px; }
  @media (max-width: 520px) {
    .goal-row { grid-template-columns: 60px minmax(0, 1fr); align-items: start; }
    .goal-row > .n-button { grid-column: 2; justify-self: start; }
  }
</style>
