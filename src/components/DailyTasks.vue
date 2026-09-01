<template>
  <n-card class="daily-card" title="今日修行" size="small">
    <template #header-extra>
      <n-tag size="small" type="info">活跃 {{ dailyState.activity }} / 3</n-tag>
    </template>

    <n-space vertical :size="12">
      <div v-if="recommendedTask" class="recommendation" role="status">
        <div>
          <n-text depth="3">下一步</n-text>
          <strong>{{ recommendedTask.title }}</strong>
          <n-text depth="3">{{ recommendedTask.description }}</n-text>
        </div>
        <n-button size="small" type="primary" @click="goToTask(recommendedTask)">
          前往
        </n-button>
      </div>

      <div v-for="task in dailyState.tasks" :key="task.id" class="task-row">
        <div class="task-main">
          <div class="task-heading">
            <strong>{{ task.title }}</strong>
            <n-tag v-if="task.claimed" size="small" type="success">已领取</n-tag>
            <n-tag v-else-if="task.completed" size="small" type="warning">可领取</n-tag>
          </div>
          <n-text depth="3">{{ task.description }}</n-text>
          <n-progress
            type="line"
            :percentage="Math.round((task.progress / task.target) * 100)"
            :show-indicator="false"
            :height="6"
          />
          <n-text depth="3" class="task-progress">{{ task.progress }} / {{ task.target }}</n-text>
        </div>
        <n-button
          v-if="task.completed && !task.claimed"
          size="small"
          secondary
          type="success"
          @click="claimTask(task.id)"
        >
          领取
        </n-button>
        <n-button v-else size="small" secondary @click="goToTask(task)">前往</n-button>
      </div>

      <n-divider style="margin: 0" />
      <div class="chest-row">
        <n-text>活跃宝箱</n-text>
        <n-space :size="6" wrap>
          <n-button
            v-for="threshold in thresholds"
            :key="threshold"
            size="small"
            :type="dailyState.claimedChestThresholds.includes(threshold) ? 'default' : 'warning'"
            :disabled="dailyState.activity < threshold || dailyState.claimedChestThresholds.includes(threshold)"
            @click="claimChest(threshold)"
          >
            {{ threshold }} 格
          </n-button>
        </n-space>
      </div>
    </n-space>
  </n-card>
</template>

<script setup>
  import { computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useMessage } from 'naive-ui'
  import { ACTIVITY_THRESHOLDS } from '../plugins/tasks'
  import { usePlayerStore } from '../stores/player'

  const router = useRouter()
  const message = useMessage()
  const playerStore = usePlayerStore()
  const thresholds = ACTIVITY_THRESHOLDS

  const dailyState = computed(() => playerStore.dailyState)
  const recommendedTask = computed(() => playerStore.dailyRecommendedTask)

  const routeByTask = {
    cultivation: '/cultivation',
    exploration: '/exploration',
    alchemy: '/alchemy',
    dungeon: '/dungeon',
    equipment: '/inventory'
  }

  const goToTask = task => router.push(routeByTask[task.event] || '/cultivation')

  const claimTask = taskId => {
    const result = playerStore.claimDailyTask(taskId)
    if (result.success) message.success('今日修行奖励已领取')
  }

  const claimChest = threshold => {
    const result = playerStore.claimDailyChest(threshold)
    if (result.success) message.success('活跃宝箱已开启')
  }

  onMounted(() => playerStore.syncDailyState())
</script>

<style scoped>
  .daily-card { border-color: color-mix(in srgb, var(--gold) 50%, var(--line)); }
  .recommendation, .task-row, .chest-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .recommendation { padding: 10px 12px; border-left: 3px solid var(--gold); background: color-mix(in srgb, var(--jade-pale) 34%, var(--surface)); }
  .recommendation > div, .task-main { min-width: 0; display: grid; gap: 4px; }
  .recommendation strong { display: block; }
  .task-row { padding: 10px 0; border-bottom: 1px solid var(--line); }
  .task-row:last-of-type { border-bottom: 0; }
  .task-heading { display: flex; align-items: center; gap: 8px; }
  .task-progress { font-size: 12px; }
  .chest-row { flex-wrap: wrap; }
  @media (max-width: 520px) {
    .recommendation, .task-row { align-items: stretch; }
    .recommendation, .task-row { flex-direction: column; }
    .recommendation .n-button, .task-row .n-button { align-self: flex-start; }
  }
</style>
