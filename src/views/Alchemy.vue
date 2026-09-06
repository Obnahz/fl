<template>
  <n-card title="丹药炼制" :bordered="false">
    <div class="alchemy-summary">
      <div><span>已掌握丹方</span><strong>{{ unlockedRecipes.length }}</strong></div>
      <div><span>当前可炼</span><strong>{{ craftableRecipeCount }}</strong></div>
      <div><span>灵草库存</span><strong>{{ playerStore.herbs.length }}</strong></div>
      <div><span>成品丹药</span><strong>{{ pillInventoryCount }}</strong></div>
    </div>

    <div v-if="unlockedRecipes.length" class="alchemy-toolbar">
      <n-input v-model:value="recipeSearch" clearable placeholder="搜索丹方、效果或材料" />
      <n-select v-model:value="recipeFilter" :options="filterOptions" />
    </div>

    <div v-if="unlockedRecipes.length" class="alchemy-workspace">
      <div class="recipe-list" aria-label="丹方列表">
        <button
          v-for="recipe in visibleRecipes"
          :key="recipe.id"
          type="button"
          class="recipe-row"
          :class="{ selected: selectedRecipe?.id === recipe.id }"
          @click="selectRecipe(recipe)"
        >
          <span class="recipe-main">
            <span class="recipe-title">
              <strong>{{ recipe.name }}</strong>
              <n-tag size="small" :type="getCraftableCount(recipe) > 0 ? 'success' : 'default'">
                {{ getCraftableCount(recipe) > 0 ? `可炼 ${getCraftableCount(recipe)} 炉` : '材料不足' }}
              </n-tag>
            </span>
            <span class="recipe-meta">
              <span>{{ pillGrades[recipe.grade].name }}</span>
              <span>{{ pillTypes[recipe.type].name }}</span>
              <span>{{ getEffectLabel(recipe.baseEffect.type) }}</span>
            </span>
          </span>
          <span class="material-preview">
            <span
              v-for="material in recipe.materials"
              :key="material.herb"
              :class="{ missing: getHerbCount(material.herb) < material.count }"
            >
              {{ getHerbName(material.herb) }} {{ getHerbCount(material.herb) }}/{{ material.count }}
            </span>
          </span>
        </button>
        <n-empty v-if="visibleRecipes.length === 0" description="没有符合条件的丹方" />
      </div>

      <section v-if="selectedRecipe" class="craft-panel" aria-label="炼制详情">
        <div class="craft-heading">
          <div>
            <n-text depth="3">当前丹方</n-text>
            <h2>{{ selectedRecipe.name }}</h2>
          </div>
          <n-tag :type="canCraftSelected ? 'success' : 'warning'">
            {{ canCraftSelected ? `最多可炼 ${selectedMaxCraftable} 炉` : '材料不足' }}
          </n-tag>
        </div>

        <p class="recipe-description">{{ selectedRecipe.description }}</p>

        <div class="material-list">
          <div v-for="material in selectedRecipe.materials" :key="material.herb" class="material-row">
            <span>{{ getHerbName(material.herb) }}</span>
            <strong :class="{ shortage: getHerbCount(material.herb) < material.count }">
              {{ getHerbCount(material.herb) }} / {{ material.count }}
            </strong>
          </div>
        </div>

        <n-descriptions bordered :column="1" size="small">
          <n-descriptions-item label="实际效果">
            {{ getEffectLabel(currentEffect.type) }} +{{ (currentEffect.value * 100).toFixed(1) }}%
          </n-descriptions-item>
          <n-descriptions-item label="持续时间">
            {{ Math.floor(currentEffect.duration / 60) }} 分钟
          </n-descriptions-item>
          <n-descriptions-item label="单次成功率">
            {{ (currentEffect.successRate * 100).toFixed(1) }}%
          </n-descriptions-item>
        </n-descriptions>

        <div class="craft-actions">
          <n-input-number
            v-model:value="craftQuantity"
            :min="1"
            :max="Math.max(1, selectedMaxCraftable)"
            :disabled="!canCraftSelected"
          />
          <n-button class="craft-button" type="primary" :disabled="!canCraftSelected" @click="craftPills">
            {{ canCraftSelected ? `炼制 ${craftQuantity} 炉` : '材料不足' }}
          </n-button>
        </div>

        <log-panel ref="logRef" title="炼丹日志" />
      </section>

      <n-empty v-else class="craft-panel" description="选择一张丹方查看材料与效果" />
    </div>

    <n-empty v-else description="暂未掌握任何丹方" />
  </n-card>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { usePlayerStore } from '../stores/player'
  import { pillRecipes, pillGrades, pillTypes, calculatePillEffect } from '../plugins/pills'
  import { herbs } from '../plugins/herbs'
  import LogPanel from '../components/LogPanel.vue'

  const playerStore = usePlayerStore()
  const logRef = ref(null)
  const selectedRecipe = ref(null)
  const recipeSearch = ref('')
  const recipeFilter = ref('all')
  const craftQuantity = ref(1)

  const filterOptions = [
    { label: '全部丹方', value: 'all' },
    { label: '只看可炼', value: 'craftable' },
    { label: '只看缺材料', value: 'missing' }
  ]

  const herbCounts = computed(() => {
    const counts = {}
    for (const herb of playerStore.herbs) counts[herb.id] = (counts[herb.id] || 0) + 1
    return counts
  })

  const getHerbCount = herbId => herbCounts.value[herbId] || 0
  const getHerbName = herbId => herbs.find(herb => herb.id === herbId)?.name || herbId
  const getCraftableCount = recipe => Math.min(
    ...recipe.materials.map(material => Math.floor(getHerbCount(material.herb) / material.count))
  )

  const unlockedRecipes = computed(() => pillRecipes.filter(recipe => playerStore.pillRecipes.includes(recipe.id)))
  const craftableRecipeCount = computed(() => unlockedRecipes.value.filter(recipe => getCraftableCount(recipe) > 0).length)
  const pillInventoryCount = computed(() => playerStore.items.filter(item => item.type === 'pill').length)

  const visibleRecipes = computed(() => {
    const keyword = recipeSearch.value.trim().toLowerCase()
    return unlockedRecipes.value
      .filter(recipe => {
        const craftable = getCraftableCount(recipe) > 0
        if (recipeFilter.value === 'craftable' && !craftable) return false
        if (recipeFilter.value === 'missing' && craftable) return false
        if (!keyword) return true
        const materialNames = recipe.materials.map(material => getHerbName(material.herb)).join(' ')
        return `${recipe.name} ${recipe.description} ${materialNames}`.toLowerCase().includes(keyword)
      })
      .sort((a, b) => getCraftableCount(b) - getCraftableCount(a))
  })

  const selectedMaxCraftable = computed(() => selectedRecipe.value ? getCraftableCount(selectedRecipe.value) : 0)
  const canCraftSelected = computed(() => selectedMaxCraftable.value > 0)
  const currentEffect = computed(() => calculatePillEffect(selectedRecipe.value, playerStore.level))

  const effectLabels = {
    spiritRate: '灵力恢复', cultivationRate: '修炼速度', cultivationEfficiency: '修炼效率',
    combatBoost: '战斗属性', resistanceBoost: '战斗抗性', allAttributes: '全属性',
    spiritCap: '灵力上限', autoHeal: '生命恢复', spiritRecovery: '灵力回复',
    comprehension: '悟性', fireAttribute: '火属性'
  }
  const getEffectLabel = type => effectLabels[type] || '特殊效果'

  const selectRecipe = recipe => {
    selectedRecipe.value = recipe
    craftQuantity.value = 1
  }

  watch(selectedMaxCraftable, maximum => {
    craftQuantity.value = Math.min(Math.max(1, craftQuantity.value || 1), Math.max(1, maximum))
  })

  const craftPills = () => {
    if (!selectedRecipe.value || !canCraftSelected.value) return
    const attempts = Math.min(craftQuantity.value, selectedMaxCraftable.value)
    let successes = 0
    let failures = 0
    for (let index = 0; index < attempts; index++) {
      const result = playerStore.craftPill(selectedRecipe.value.id)
      if (result.success) successes++
      else failures++
    }
    const type = successes > 0 ? 'success' : 'error'
    logRef.value?.addLog(type, `完成 ${attempts} 炉：成功 ${successes}，失败 ${failures}`)
    craftQuantity.value = Math.min(craftQuantity.value, Math.max(1, selectedMaxCraftable.value))
  }
</script>

<style scoped>
  .alchemy-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }

  .alchemy-summary > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--n-border-color);
    border-radius: 6px;
  }

  .alchemy-summary span, .recipe-meta, .material-preview { color: var(--n-text-color-3); }
  .alchemy-summary strong { font-size: 18px; }

  .alchemy-toolbar {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 160px;
    gap: 8px;
    margin-bottom: 12px;
  }

  .alchemy-workspace {
    display: grid;
    grid-template-columns: minmax(320px, 1.25fr) minmax(300px, 0.75fr);
    gap: 14px;
    align-items: start;
  }

  .recipe-list { display: grid; gap: 8px; }

  .recipe-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(190px, auto);
    gap: 12px;
    width: 100%;
    padding: 11px 12px;
    color: inherit;
    text-align: left;
    background: transparent;
    border: 1px solid var(--n-border-color);
    border-radius: 6px;
    cursor: pointer;
  }

  .recipe-row:hover, .recipe-row.selected { border-color: var(--n-color-target); background: var(--n-color-embedded); }
  .recipe-main, .material-preview { display: grid; gap: 6px; min-width: 0; }
  .recipe-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .recipe-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; }
  .material-preview { justify-items: end; align-content: center; font-size: 12px; }
  .material-preview .missing, .shortage { color: #d03050; }

  .craft-panel {
    position: sticky;
    top: 76px;
    display: grid;
    gap: 12px;
    min-width: 0;
  }

  .craft-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .craft-heading h2 { margin: 2px 0 0; font-size: 20px; }
  .recipe-description { margin: 0; color: var(--n-text-color-2); }
  .material-list { display: grid; gap: 6px; }
  .material-row { display: flex; justify-content: space-between; padding: 8px 10px; background: var(--n-color-embedded); border-radius: 4px; }
  .craft-actions { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 8px; }
  .craft-button { width: 100%; }

  @media (max-width: 820px) {
    .alchemy-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .alchemy-workspace { grid-template-columns: 1fr; }
    .craft-panel { position: static; }
  }

  @media (max-width: 560px) {
    .alchemy-toolbar, .recipe-row { grid-template-columns: 1fr; }
    .material-preview { justify-items: start; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .craft-actions { grid-template-columns: 100px minmax(0, 1fr); }
  }
</style>
