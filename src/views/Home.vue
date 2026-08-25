<template>
  <main class="creation-page">
    <section class="creation-intro" aria-labelledby="creation-title">
      <img class="creation-sigil" src="/tianmi-icon.png" alt="" aria-hidden="true" />
      <p class="eyebrow">凡尘将远，仙途初启</p>
      <h1 id="creation-title">测灵根，定道号</h1>
      <p class="intro-copy">每一种灵根都会改变修炼节奏。此后仍可通过功法、丹药与机缘补足短板。</p>
    </section>

    <n-card class="creation-panel" :bordered="true">
      <n-form :show-feedback="false" @submit.prevent="beginJourney">
        <n-space vertical size="large">
          <n-form-item label="道号">
            <n-input
              v-model:value="characterName"
              maxlength="8"
              show-count
              placeholder="输入 2 到 8 个字符"
              @keyup.enter="beginJourney"
            />
          </n-form-item>

          <div class="root-section">
            <div class="section-heading">
              <div>
                <span class="section-label">灵根测定</span>
                <strong>{{ currentRoot.name }}</strong>
              </div>
              <n-button secondary @click="rerollRoot">
                <template #icon><n-icon><RefreshOutline /></n-icon></template>
                重新测定
              </n-button>
            </div>

            <div class="element-track" aria-label="五行灵根">
              <span
                v-for="root in spiritualRoots"
                :key="root.id"
                class="element-mark"
                :class="{ active: root.id === currentRoot.id }"
                :style="{ '--element-color': root.color }"
              >
                {{ root.element }}
              </span>
            </div>

            <p class="root-description">{{ currentRoot.description }}</p>
            <n-descriptions class="root-stats" bordered :column="3" label-placement="top">
              <n-descriptions-item label="修炼效率">{{ formatBonus(currentRoot.cultivationRate) }}</n-descriptions-item>
              <n-descriptions-item label="吐纳灵力">{{ formatBonus(currentRoot.spiritRate) }}</n-descriptions-item>
              <n-descriptions-item label="福缘">{{ formatBonus(currentRoot.luck) }}</n-descriptions-item>
            </n-descriptions>
          </div>

          <n-alert type="info" :show-icon="true">
            初入仙途将获得 100 灵力与 500 灵石，用于前期历练与修行。
          </n-alert>

          <n-button type="primary" size="large" block attr-type="submit" :loading="isSubmitting">
            <template #icon><n-icon><EnterOutline /></n-icon></template>
            踏入仙途
          </n-button>
        </n-space>
      </n-form>
    </n-card>
  </main>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useMessage } from 'naive-ui'
  import { EnterOutline, RefreshOutline } from '@vicons/ionicons5'
  import { SPIRITUAL_ROOTS } from '../plugins/gameRules'
  import { usePlayerStore } from '../stores/player'

  const router = useRouter()
  const message = useMessage()
  const playerStore = usePlayerStore()
  const characterName = ref('')
  const currentRoot = ref(playerStore.drawSpiritualRoot())
  const spiritualRoots = SPIRITUAL_ROOTS
  const isSubmitting = ref(false)

  const formatBonus = rate => `${rate >= 1 ? '+' : ''}${Math.round((rate - 1) * 100)}%`

  const rerollRoot = () => {
    let nextRoot = playerStore.drawSpiritualRoot()
    if (nextRoot.id === currentRoot.value.id) {
      const index = spiritualRoots.findIndex(root => root.id === nextRoot.id)
      nextRoot = spiritualRoots[(index + 1) % spiritualRoots.length]
    }
    currentRoot.value = nextRoot
  }

  const beginJourney = async () => {
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
      await playerStore.createCharacter({
        name: characterName.value,
        spiritualRoot: currentRoot.value.id
      })
      message.success(`${currentRoot.value.name}已定，仙途自此始。`)
      await router.push('/cultivation')
    } catch (error) {
      message.error(error.message || '角色创建失败')
    } finally {
      isSubmitting.value = false
    }
  }
</script>

<style scoped>
  .creation-page {
    position: relative;
    width: min(100%, 1120px);
    gap: clamp(2.5rem, 7vw, 7rem);
    padding-top: clamp(2.6rem, 8vw, 6.5rem);
  }

  .creation-page::before {
    position: absolute;
    z-index: -1;
    top: 7%;
    left: 35%;
    width: 42%;
    height: 72%;
    content: '';
    border: 1px solid rgba(184, 138, 67, .18);
    border-radius: 50%;
    transform: rotate(-18deg);
    pointer-events: none;
  }

  .creation-intro { padding-left: 1.65rem; }
  .creation-intro::before { width: 3px; border-radius: 2px; box-shadow: 0 0 18px rgba(184, 138, 67, .28); }
  .creation-sigil { border-radius: 14px; }
  h1 { color: var(--jade-deep); text-shadow: 0 5px 18px rgba(16, 59, 49, .1); }
  .intro-copy { max-width: 30rem; line-height: 2; }
  .creation-panel { border-radius: 14px; }
  .creation-panel::before { display: none; }
  .root-section { background: color-mix(in srgb, var(--jade-pale) 34%, var(--surface-solid)); border-radius: 10px; }
  .element-mark { border-radius: 9px; background: color-mix(in srgb, var(--surface-solid) 88%, transparent); }
  .element-mark.active { box-shadow: 0 8px 18px rgba(26, 74, 55, .16), inset 0 0 0 1px rgba(255,255,255,.36); }

  .creation-page {
    display: grid;
    grid-template-columns: minmax(15rem, .82fr) minmax(24rem, 1.18fr);
    align-items: start;
    gap: clamp(2rem, 6vw, 5.5rem);
    width: min(100%, 1040px);
    margin: 0 auto;
    padding: clamp(2.8rem, 7vw, 5.5rem) 1rem 5rem;
  }

  .creation-intro {
    position: sticky;
    top: 8.5rem;
    margin-bottom: 2rem;
    padding: 1rem 0 1rem 1.4rem;
    text-align: left;
  }

  .creation-intro::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 2px;
    content: '';
    background: var(--gold);
    opacity: .76;
  }

  .creation-sigil {
    display: block;
    width: 86px;
    height: 86px;
    margin: 0 0 1.5rem;
    border: 1px solid var(--gold);
    border-radius: 8px;
    object-fit: cover;
    box-shadow: 0 14px 28px rgba(6, 17, 10, .2), 0 0 0 6px rgba(197, 161, 93, .08);
  }

  .eyebrow,
  .section-label {
    color: var(--n-text-color-3);
    font-size: 0.875rem;
    letter-spacing: .12em;
  }

  h1 {
    margin: 0.65rem 0 1rem;
    font-family: 'STKaiti', 'KaiTi', serif;
    font-size: clamp(2.4rem, 5vw, 3.8rem);
    font-weight: 700;
    letter-spacing: .08em;
    color: var(--jade-deep);
    line-height: 1.1;
  }

  .intro-copy {
    max-width: 28rem;
    margin: 0;
    color: var(--n-text-color-2);
    line-height: 1.9;
  }

  .creation-panel {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 18px 38px rgba(16, 39, 25, .12);
  }

  .creation-panel::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 3px;
    content: '';
    background: linear-gradient(90deg, var(--jade-deep), var(--gold), var(--jade-deep));
    opacity: .88;
  }

  .root-section {
    padding: 1.35rem;
    border: 1px solid var(--n-border-color);
    border-radius: 6px;
    background: color-mix(in srgb, var(--jade-pale) 22%, transparent);
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .section-heading strong,
  .section-label {
    display: block;
  }

  .section-heading strong {
    margin-top: 0.25rem;
    font-size: 1.25rem;
  }

  .element-track {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.75rem;
    margin: 1.25rem 0;
  }

  .element-mark {
    display: grid;
    min-height: 3.25rem;
    place-items: center;
    border: 1px solid var(--n-border-color);
    border-radius: 6px;
    color: var(--n-text-color-3);
    font-family: 'STKaiti', 'KaiTi', serif;
    font-size: 1.25rem;
    background: color-mix(in srgb, var(--surface) 76%, transparent);
    transition: border-color 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
  }

  .element-mark.active {
    border-color: var(--element-color);
    color: var(--element-color);
    background: color-mix(in srgb, var(--element-color) 10%, transparent);
    transform: translateY(-2px);
    box-shadow: 0 7px 14px rgba(16, 39, 25, .1);
  }

  .root-description {
    margin-bottom: 1rem;
    color: var(--n-text-color-2);
    line-height: 1.7;
  }

  @media (max-width: 560px) {
    .creation-page {
      display: block;
      padding: 2rem 0 3rem;
    }

    .creation-intro {
      position: relative;
      top: auto;
      margin-bottom: 1.75rem;
      padding-left: 1rem;
    }

    h1 {
      font-size: 2rem;
    }

    .section-heading {
      align-items: flex-start;
    }

    .element-track {
      gap: 0.4rem;
    }

    .element-mark {
      min-height: 2.75rem;
      font-size: 1rem;
    }

    :deep(.root-stats .n-descriptions-table-content) {
      grid-template-columns: 1fr;
    }
  }
</style>
