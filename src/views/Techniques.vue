<template>
  <n-layout-content class="techniques-page">
    <header class="page-heading">
      <div>
        <n-text depth="3">道法传承</n-text>
        <h1>功法</h1>
      </div>
      <n-text depth="3">选择一门功法出战，以首领传承残页逐层参悟。</n-text>
    </header>

    <section class="technique-summary" aria-label="功法总览">
      <div>
        <n-text depth="3">已领悟</n-text>
        <strong>{{ unlockedTechniques.length }} / {{ TECHNIQUES.length }}</strong>
      </div>
      <div>
        <n-text depth="3">当前出战</n-text>
        <strong>{{ activeTechnique?.name || '无' }}</strong>
      </div>
      <div>
        <n-text depth="3">功法残页</n-text>
        <strong>{{ totalFragments }}</strong>
      </div>
    </section>

    <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="12">
      <n-grid-item v-for="technique in unlockedTechniques" :key="technique.id">
        <n-card size="small" :class="['technique-card', { active: technique.id === playerStore.activeTechniqueId }]">
          <template #header>
            <div class="technique-card-heading">
              <div>
                <n-text depth="3">{{ technique.id === playerStore.activeTechniqueId ? '当前出战' : '已领悟' }}</n-text>
                <strong>{{ technique.name }}</strong>
                <n-tag :type="styleTagType(technique.style)" size="small">{{ technique.styleName }}</n-tag>
              </div>
              <n-tag :type="technique.id === playerStore.activeTechniqueId ? 'success' : 'default'" size="small">
                第 {{ technique.level }} / {{ technique.maxLevel }} 层
              </n-tag>
            </div>
          </template>

          <n-space vertical :size="12">
            <n-text depth="3">{{ technique.description }}</n-text>
            <div class="technique-stats">
              <div><span>伤害倍率</span><strong>{{ technique.damageMultiplier.toFixed(2) }}x</strong></div>
              <div><span>调息回合</span><strong>{{ technique.cooldownRounds }}</strong></div>
              <div><span>流派效果</span><strong>{{ technique.effectText }}</strong></div>
            </div>

            <div class="fragment-progress">
              <div class="fragment-heading">
                <n-text>残页 {{ fragmentCount(technique.id) }}</n-text>
                <n-text depth="3">
                  {{ technique.upgradeCost === null ? '已参悟圆满' : `升级需要 ${technique.upgradeCost}` }}
                </n-text>
              </div>
              <n-progress
                type="line"
                :percentage="fragmentPercentage(technique)"
                :show-indicator="false"
                :color="technique.upgradeCost === null ? '#2f855a' : '#b7791f'"
              />
            </div>

            <div class="technique-actions">
              <n-button
                secondary
                :disabled="technique.id === playerStore.activeTechniqueId"
                @click="activateTechnique(technique)"
              >
                <template #icon><n-icon><PlayCircleOutlined /></n-icon></template>
                设为出战
              </n-button>
              <n-button
                type="primary"
                :disabled="technique.upgradeCost === null || fragmentCount(technique.id) < technique.upgradeCost"
                @click="handleUpgrade(technique)"
              >
                <template #icon><n-icon><ArrowUpOutlined /></n-icon></template>
                参悟升级
              </n-button>
            </div>
          </n-space>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-empty v-if="!unlockedTechniques.length" description="尚未领悟功法" />
  </n-layout-content>
</template>

<script setup>
  import { computed } from 'vue'
  import { useMessage } from 'naive-ui'
  import { ArrowUpOutlined, PlayCircleOutlined } from '@ant-design/icons-vue'
  import { TECHNIQUES, getTechniqueAtLevel, getTechniqueUpgradeCost } from '../plugins/techniques'
  import { usePlayerStore } from '../stores/player'

  const message = useMessage()
  const playerStore = usePlayerStore()

  const unlockedTechniques = computed(() =>
    TECHNIQUES.filter(technique => playerStore.unlockedSkills.includes(technique.id)).map(technique => {
      const progress = getTechniqueAtLevel(technique.id, playerStore.techniqueLevels[technique.id])
      return {
        ...progress,
        upgradeCost: getTechniqueUpgradeCost(technique.id, progress.level)
      }
    })
  )
  const activeTechnique = computed(() =>
    unlockedTechniques.value.find(technique => technique.id === playerStore.activeTechniqueId) || unlockedTechniques.value[0]
  )
  const totalFragments = computed(() =>
    Object.values(playerStore.techniqueFragments || {}).reduce((total, amount) => total + amount, 0)
  )

  const fragmentCount = techniqueId => playerStore.techniqueFragments[techniqueId] || 0
  const styleTagType = style => (style === 'armor_break' ? 'warning' : style === 'critical_burst' ? 'error' : 'default')
  const fragmentPercentage = technique => {
    if (technique.upgradeCost === null) return 100
    return Math.min(100, Math.round((fragmentCount(technique.id) / technique.upgradeCost) * 100))
  }

  const activateTechnique = technique => {
    if (playerStore.setActiveTechnique(technique.id)) message.success(`${technique.name}已设为出战功法`)
  }

  const handleUpgrade = technique => {
    const result = playerStore.upgradeTechnique(technique.id)
    if (result.upgraded) {
      message.success(`${technique.name}参悟至第${result.level}层`)
    } else if (result.cost === null) {
      message.info(`${technique.name}已经参悟圆满`)
    } else {
      message.warning(`功法残页不足，还需要${result.cost - fragmentCount(technique.id)}枚`)
    }
  }
</script>

<style scoped>
  .techniques-page {
    display: grid;
    gap: 16px;
  }

  .page-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .page-heading h1 {
    margin: 2px 0 0;
    font-size: 24px;
    letter-spacing: 0;
  }

  .technique-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 14px 0;
    border-top: 1px solid var(--n-border-color);
    border-bottom: 1px solid var(--n-border-color);
  }

  .technique-summary > div {
    min-width: 0;
    padding-left: 12px;
    border-left: 3px solid #2f855a;
  }

  .technique-summary strong,
  .technique-summary .n-text,
  .technique-card-heading strong,
  .technique-card-heading .n-text {
    display: block;
  }

  .technique-summary strong {
    margin-top: 2px;
    font-size: 18px;
  }

  .technique-card {
    height: 100%;
    border-left: 3px solid transparent;
  }

  .technique-card.active {
    border-left-color: #2f855a;
  }

  .technique-card-heading,
  .fragment-heading,
  .technique-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .technique-card-heading {
    flex-wrap: wrap;
  }

  .technique-card-heading > div {
    min-width: 0;
  }

  .technique-card-heading .n-tag {
    margin-top: 5px;
  }

  .technique-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .technique-stats > div {
    padding: 8px;
    border: 1px solid var(--n-border-color);
    border-radius: 6px;
  }

  .technique-stats span,
  .technique-stats strong {
    display: block;
  }

  .technique-stats span {
    color: var(--n-text-color-3);
    font-size: 12px;
  }

  .fragment-progress {
    display: grid;
    gap: 6px;
  }

  @media (max-width: 520px) {
    .page-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .technique-summary {
      grid-template-columns: 1fr;
    }

    .technique-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .technique-actions .n-button {
      width: 100%;
    }

    .technique-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
