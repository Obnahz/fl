<template>
  <main class="tasks-page">
    <section class="tasks-heading" aria-labelledby="tasks-title">
      <div>
        <n-text depth="3">每日一省，循序精进</n-text>
        <h1 id="tasks-title">今日修行</h1>
      </div>
      <n-text depth="3">目标会在本地日期变化后自动更新，已领取奖励不会重复发放。</n-text>
    </section>
    <DailyTasks />
    <SevenDayGoals />
  </main>
</template>

<script setup>
  import DailyTasks from '../components/DailyTasks.vue'
  import SevenDayGoals from '../components/SevenDayGoals.vue'
</script>

<style scoped>
  .tasks-page { display: grid; gap: 16px; }
  .tasks-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; }
  .tasks-heading h1 { margin-top: 4px; color: var(--jade-deep); font-family: KaiTi, STKaiti, serif; font-size: 26px; }
  .tasks-heading > .n-text { max-width: 34rem; text-align: right; }
  @media (max-width: 640px) {
    .tasks-heading { align-items: start; flex-direction: column; }
    .tasks-heading > .n-text { text-align: left; }
  }
</style>
