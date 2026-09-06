<template>
  <div v-if="!playerStore.isNewPlayer" class="utility-bar" aria-label="Global utilities">
    <n-button size="small" secondary @click="save">Save</n-button>
    <n-button size="small" secondary :disabled="!canGoBack" @click="goBack">Back</n-button>
    <n-button size="small" secondary @click="scrollTop">Top</n-button>
    <n-button size="small" type="primary" @click="openInventory">Inventory</n-button>
    <span v-if="savedAt" class="save-state">Saved {{ savedAt }}</span>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePlayerStore } from '../stores/player'

  const router = useRouter()
  const playerStore = usePlayerStore()
  const savedAt = ref('')
  const canGoBack = computed(() => window.history.length > 1)
  const save = async () => { await playerStore.saveData({ immediate: true }); savedAt.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  const goBack = () => router.back()
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const openInventory = () => router.push('/inventory')
</script>

<style scoped>
  .utility-bar { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin: 0 0 12px; padding: 8px 10px; border: 1px solid var(--line); background: var(--surface); }
  .save-state { color: var(--n-text-color-3); font-size: 12px; margin-left: 2px; }
  @media (max-width: 560px) { .utility-bar { justify-content: flex-start; flex-wrap: wrap; } .save-state { width: 100%; } }
</style>
