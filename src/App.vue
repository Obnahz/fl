<template>
  <n-config-provider :theme="playerStore.isDarkMode ? darkTheme : null">
    <n-message-provider>
      <n-dialog-provider>
        <n-spin :show="isLoading" description="正在加载游戏数据...">
          <n-layout class="app-shell">
            <n-layout-header bordered class="site-header">
              <div class="header-content">
                <n-page-header>
                  <template #title>
                    <span class="brand-title">
                      <img class="brand-sigil" src="/tianmi-icon.png" alt="" aria-hidden="true" />
                      <span>挂机也成仙</span>
                    </span>
                  </template>
                  <template #extra>
                    <n-button quaternary circle title="切换明暗主题" @click="playerStore.toggle">
                      <template #icon>
                        <n-icon><Sunny v-if="playerStore.isDarkMode" /><Moon v-else /></n-icon>
                      </template>
                    </n-button>
                  </template>
                </n-page-header>
                <n-scrollbar v-if="!playerStore.isNewPlayer" x-scrollable trigger="none">
                  <n-menu
                    mode="horizontal"
                    :options="menuOptions"
                    :value="currentMenuKey"
                    @update:value="handleMenuClick"
                  />
                </n-scrollbar>
              </div>
            </n-layout-header>

            <n-layout-content>
              <div class="content-wrapper">
                <section v-if="!playerStore.isNewPlayer" class="status-band" aria-label="角色状态">
                  <div class="status-grid">
                    <div class="status-item"><span>道号</span><strong>{{ playerStore.name }}</strong></div>
                    <div class="status-item"><span>灵根</span><strong>{{ spiritualRootName }}</strong></div>
                    <div class="status-item"><span>境界</span><strong>{{ currentRealmName }}</strong></div>
                    <div class="status-item">
                      <span>修为</span><strong>{{ formatNumber(playerStore.cultivation) }} / {{ playerStore.maxCultivation }}</strong>
                    </div>
                    <div class="status-item"><span>灵力</span><strong>{{ playerStore.spirit.toFixed(1) }}</strong></div>
                    <div class="status-item">
                      <span>气血</span><strong>{{ playerStore.currentHealth }} / {{ playerStore.baseAttributes.health }}</strong>
                    </div>
                    <div class="status-item"><span>灵石</span><strong>{{ playerStore.spiritStones }}</strong></div>
                  </div>

                  <n-progress
                    type="line"
                    :percentage="cultivationPercentage"
                    indicator-text-color="rgba(255, 255, 255, 0.92)"
                    rail-color="rgba(244, 239, 219, 0.16)"
                    color="#bd9855"
                    indicator-placement="inside"
                    processing
                  />

                  <n-collapse class="details-collapse">
                    <n-collapse-item title="详细属性" name="attributes">
                      <n-descriptions bordered :column="attributeColumns">
                        <n-descriptions-item label="生命">{{ playerStore.baseAttributes.health.toFixed(0) }}</n-descriptions-item>
                        <n-descriptions-item label="攻击">{{ playerStore.baseAttributes.attack.toFixed(0) }}</n-descriptions-item>
                        <n-descriptions-item label="防御">{{ playerStore.baseAttributes.defense.toFixed(0) }}</n-descriptions-item>
                        <n-descriptions-item label="速度">{{ playerStore.baseAttributes.speed.toFixed(0) }}</n-descriptions-item>
                        <n-descriptions-item label="修炼效率">{{ rateText(playerStore.cultivationRate) }}</n-descriptions-item>
                        <n-descriptions-item label="吐纳效率">{{ rateText(playerStore.spiritRate) }}</n-descriptions-item>
                        <n-descriptions-item label="福缘">{{ rateText(playerStore.luck) }}</n-descriptions-item>
                        <n-descriptions-item label="强化石">{{ playerStore.reinforceStones }}</n-descriptions-item>
                      </n-descriptions>
                    </n-collapse-item>
                  </n-collapse>

                  <n-alert v-if="playerStore.lastOfflineGain > 0" type="success" :show-icon="true">
                    闭关归来，获得 {{ playerStore.lastOfflineGain }} 点离线灵力。
                  </n-alert>
                </section>

                <router-view />
              </div>
            </n-layout-content>
          </n-layout>
        </n-spin>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
  import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { NIcon, darkTheme } from 'naive-ui'
  import {
    BookOutlined,
    CompassOutlined,
    ExperimentOutlined,
    ReadOutlined,
    SettingOutlined,
    SmileOutlined
  } from '@ant-design/icons-vue'
  import { Moon, Sunny } from '@vicons/ionicons5'
  import { getRealmName } from './plugins/realm'
  import { getSpiritualRoot } from './plugins/gameRules'
  import { usePlayerStore } from './stores/player'

  const router = useRouter()
  const route = useRoute()
  const playerStore = usePlayerStore()
  const spiritWorker = ref(null)
  const isLoading = ref(true)
  const viewportWidth = ref(window.innerWidth)
  const baseGainRate = 1

  const renderIcon = icon => () => h(NIcon, null, { default: () => h(icon) })

  const menuOptions = computed(() => [
    { label: '修炼', key: 'cultivation', icon: renderIcon(BookOutlined) },
    { label: '功法', key: 'techniques', icon: renderIcon(ReadOutlined) },
    { label: '行囊', key: 'inventory', icon: renderIcon(ExperimentOutlined) },
    { label: '历练', key: 'exploration', icon: renderIcon(CompassOutlined) },
    { label: '设置', key: 'settings', icon: renderIcon(SettingOutlined) },
    ...(playerStore.isGMMode ? [{ label: 'GM调试', key: 'gm', icon: renderIcon(SmileOutlined) }] : [])
  ])

  const currentMenuKey = computed(() => route.path.slice(1))
  const currentRealmName = computed(() => getRealmName(playerStore.level)?.name || playerStore.realm)
  const spiritualRootName = computed(() => getSpiritualRoot(playerStore.spiritualRoot)?.name || '未测定')
  const cultivationPercentage = computed(() => {
    return Math.min(100, Number(((playerStore.cultivation / playerStore.maxCultivation) * 100).toFixed(2)))
  })
  const attributeColumns = computed(() => (viewportWidth.value < 640 ? 1 : 4))

  const formatNumber = value => Number(value || 0).toFixed(Number.isInteger(value) ? 0 : 1)
  const rateText = value => `${Math.round(Number(value || 1) * 100)}%`
  const handleMenuClick = key => router.push(`/${key}`)

  const startAutoGain = () => {
    if (spiritWorker.value || playerStore.isNewPlayer) return
    spiritWorker.value = new Worker(new URL('./workers/spirit.js', import.meta.url))
    spiritWorker.value.onmessage = event => {
      if (event.data.type === 'gain') {
        playerStore.totalCultivationTime += 1
        playerStore.gainSpirit(baseGainRate)
      }
    }
    spiritWorker.value.postMessage({ type: 'start' })
  }

  playerStore.initializePlayer().then(async () => {
    isLoading.value = false
    if (playerStore.isNewPlayer && route.path !== '/') {
      await router.replace('/')
    } else if (!playerStore.isNewPlayer && route.path === '/') {
      await router.replace('/cultivation')
    }
    startAutoGain()
  })

  watch(
    () => playerStore.isNewPlayer,
    async isNewPlayer => {
      if (!isNewPlayer) {
        startAutoGain()
        if (route.path === '/') await router.replace('/cultivation')
      }
    }
  )

  watch(
    () => route.path,
    async path => {
      if (!isLoading.value && playerStore.isNewPlayer && path !== '/') await router.replace('/')
    }
  )

  const updateViewportWidth = () => {
    viewportWidth.value = window.innerWidth
  }

  onMounted(() => window.addEventListener('resize', updateViewportWidth))

  onUnmounted(() => {
    window.removeEventListener('resize', updateViewportWidth)
    spiritWorker.value?.terminate()
    spiritWorker.value = null
  })
</script>

<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --night: #0c1d1d;
    --night-raised: #162822;
    --jade: #327d68;
    --jade-deep: #123b31;
    --jade-pale: #dbe9d7;
    --cinnabar: #b44d3c;
    --gold: #c5a15d;
    --paper: #d9d9c9;
    --surface: #f5f1e5;
    --ink: #1d2b24;
    --muted: #68756b;
    --line: #b8b8a4;
    --focus: rgba(197, 161, 93, .58);
    --surface-shadow: 0 18px 42px rgba(8, 25, 18, .16);
  }

  html.dark {
    --paper: #101814;
    --surface: #19251f;
    --ink: #edf0df;
    --muted: #afbaa8;
    --line: #405348;
    --jade-pale: #23473b;
  }

  html, body, #app { min-width: 320px; min-height: 100%; background: var(--paper); }
  body { color: var(--ink); font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; letter-spacing: 0; text-rendering: optimizeLegibility; }
  ::selection { color: var(--surface); background: var(--jade-deep); }

  .app-shell, .n-config-provider, .n-layout { min-height: 100dvh; }
  .app-shell { position: relative; isolation: isolate; overflow: clip; background: var(--paper); }
  .app-shell::before {
    position: fixed;
    z-index: 0;
    inset: 0;
    content: '';
    pointer-events: none;
    background: url('/xiuxian-landscape.webp') center bottom / cover no-repeat;
    filter: saturate(.74) contrast(.94);
    opacity: .74;
  }
  .app-shell::after {
    position: fixed;
    z-index: 0;
    inset: 0;
    content: '';
    pointer-events: none;
    background: rgba(233, 231, 213, .22);
    mix-blend-mode: screen;
  }
  .app-shell .n-layout, .app-shell .n-layout-content { background: transparent !important; }
  html.dark .app-shell::before { opacity: .18; filter: saturate(.75) contrast(1.08); }

  .site-header, .header-content, .content-wrapper { position: relative; z-index: 1; }
  .site-header {
    position: sticky;
    top: 0;
    z-index: 5;
    border-bottom: 1px solid rgba(244, 239, 219, .18) !important;
    background: rgba(11, 21, 19, .88) !important;
    box-shadow: 0 14px 32px rgba(3, 10, 6, .24);
    backdrop-filter: blur(16px) saturate(110%);
    -webkit-backdrop-filter: blur(16px) saturate(110%);
  }
  .header-content, .content-wrapper { width: min(100%, 1320px); margin: 0 auto; padding-right: 1.75rem; padding-left: 1.75rem; }
  .content-wrapper { padding-top: 1.75rem; padding-bottom: 5rem; }

  .n-page-header__title { margin: 0 1rem; padding: .82rem 0 .58rem; }
  .brand-title { display: inline-flex; align-items: center; gap: .7rem; color: #f4efdb; font-family: 'STKaiti', 'KaiTi', serif; font-size: clamp(1.28rem, 2vw, 1.72rem); font-weight: 700; letter-spacing: .1em; }
  .brand-sigil { width: 38px; height: 38px; border: 1px solid rgba(197, 161, 93, .6); border-radius: 8px; object-fit: cover; box-shadow: 0 5px 15px rgba(0, 0, 0, .28); }

  .n-menu.n-menu--horizontal { width: max-content; min-width: 100%; padding: 0 .2rem; }
  .n-menu.n-menu--horizontal .n-menu-item { min-width: 0; }
  .n-menu.n-menu--horizontal .n-menu-item-content {
    position: relative;
    min-height: 44px;
    padding: 0 .95rem;
    border-radius: 0;
    color: #b9c9bb !important;
    transition: color 160ms ease, background-color 160ms ease;
  }
  .n-menu.n-menu--horizontal .n-menu-item-content:hover { color: #fff5d3 !important; background: rgba(244, 239, 219, .06); }
  .n-menu.n-menu--horizontal .n-menu-item-content--selected { color: #fff5d3 !important; background: transparent !important; box-shadow: none; }
  .n-menu.n-menu--horizontal .n-menu-item-content--selected::after { position: absolute; right: .95rem; bottom: 1px; left: .95rem; height: 2px; content: ''; background: var(--gold); box-shadow: 0 0 0 1px rgba(197, 161, 93, .12); }
  .n-menu.n-menu--horizontal .n-menu-item-content-header { overflow: visible; text-overflow: clip; }

  .status-band {
    position: relative;
    margin-bottom: 1.65rem;
    padding: 1.35rem 1.45rem 1.45rem;
    border: 1px solid rgba(244, 239, 219, .12);
    border-radius: 8px;
    background: rgba(18, 59, 49, .93);
    color: #f8f0d9;
    box-shadow: var(--surface-shadow);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .status-band::before { position: absolute; top: 0; right: 1.2rem; left: 1.2rem; height: 2px; content: ''; background: var(--gold); opacity: .9; }
  .status-band::after { position: absolute; top: .55rem; right: .7rem; width: 5rem; height: 5rem; content: ''; border-top: 1px solid rgba(197, 161, 93, .32); border-right: 1px solid rgba(197, 161, 93, .32); opacity: .65; pointer-events: none; }
  .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr)); gap: .75rem 1rem; margin-bottom: 1.25rem; }
  .status-item { min-height: 3.25rem; padding: .15rem .8rem .15rem 0; border-right: 1px solid rgba(244, 239, 219, .17); }
  .status-item:last-child { border-right: 0; }
  .status-item span, .status-item strong { display: block; }
  .status-item span { margin-bottom: .35rem; color: #c9dbca; font-size: .72rem; letter-spacing: .08em; }
  .status-item strong { overflow-wrap: anywhere; color: #fff9e9; font-size: 1rem; font-weight: 700; }
  .details-collapse { margin-top: 1rem; border-top: 1px solid rgba(244, 239, 219, .22); }
  .status-band .n-collapse .n-collapse-item__header, .status-band .n-collapse .n-collapse-item__content-inner { color: #e9efd9 !important; }
  .status-band .n-alert { margin-top: .9rem; border-radius: 5px; }
  .n-progress .n-progress-graph-line-rail { background: rgba(244, 239, 219, .16) !important; }

  .n-button { min-height: 38px; border-radius: 6px !important; font-weight: 600; transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease; }
  .n-button:not(.n-button--disabled):hover { transform: translateY(-1px); }
  .n-button.n-button--primary-type { --n-color: var(--jade-deep) !important; --n-color-hover: var(--jade) !important; --n-color-pressed: #10342c !important; --n-border: var(--jade-deep) !important; --n-border-hover: var(--jade) !important; --n-border-pressed: #10342c !important; --n-text-color: #fffaf0 !important; }
  .n-button.n-button--warning-type { --n-color: var(--gold) !important; --n-color-hover: #d2af6c !important; --n-color-pressed: #98763e !important; --n-border: var(--gold) !important; --n-border-hover: #d2af6c !important; --n-border-pressed: #98763e !important; --n-text-color: #182119 !important; }
  .n-button.n-button--error-type { --n-color: var(--cinnabar) !important; --n-color-hover: #c85a46 !important; --n-border: var(--cinnabar) !important; --n-text-color: #fffaf0 !important; }

  .n-card { border: 1px solid rgba(101, 114, 93, .34) !important; border-radius: 8px !important; background: rgba(245, 241, 229, .9) !important; box-shadow: 0 10px 28px rgba(16, 39, 25, .09) !important; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
  html.dark .n-card { background: rgba(25, 37, 31, .9) !important; }
  .n-card-header { padding-bottom: .4rem !important; }
  .n-card-header__main { color: var(--jade-deep); font-family: 'STKaiti', 'KaiTi', serif; font-size: 1.2rem; font-weight: 700; letter-spacing: .05em; }
  html.dark .n-card-header__main { color: #bee0c5; }
  .n-alert { border-radius: 6px !important; }
  .n-input, .n-base-selection { --n-border: var(--line) !important; --n-border-hover: var(--jade) !important; --n-border-focus: var(--jade) !important; }
  .n-input, .n-base-selection, .n-input-number, .n-date-picker, .n-time-picker, .n-color-picker { border-radius: 4px !important; }
  .n-input .n-input__input-el, .n-input-number .n-input__input-el { color: var(--ink) !important; }
  .n-input .n-input__placeholder, .n-base-selection-placeholder { color: var(--muted) !important; }
  .n-base-selection .n-base-selection-label { color: var(--ink) !important; }
  .n-tag { border-radius: 3px !important; font-weight: 600; }
  .n-badge .n-badge-sup { border-radius: 3px !important; }
  .n-tabs .n-tabs-tab { color: var(--muted) !important; font-weight: 600; }
  .n-tabs .n-tabs-tab--active { color: var(--jade-deep) !important; }
  .n-tabs .n-tabs-bar { background: var(--gold) !important; }
  .n-collapse .n-collapse-item { border-color: var(--line) !important; }
  .n-collapse .n-collapse-item__header { color: var(--jade-deep) !important; font-weight: 700; }
  .n-collapse .n-collapse-item__content-wrapper { color: var(--ink); }
  .n-data-table { border: 1px solid var(--line); border-radius: 4px; overflow: hidden; background: rgba(255, 250, 240, .8); }
  .n-data-table .n-data-table-thead { background: color-mix(in srgb, var(--jade-pale) 42%, var(--surface)); }
  .n-data-table .n-data-table-th { color: var(--jade-deep); font-weight: 700; }
  .n-data-table .n-data-table-td { border-color: color-mix(in srgb, var(--line) 70%, transparent) !important; }
  .n-list .n-list-item { border-color: color-mix(in srgb, var(--line) 72%, transparent) !important; }
  .n-divider { border-color: color-mix(in srgb, var(--line) 76%, transparent) !important; }
  .n-empty .n-empty__description, .n-statistic .n-statistic-label { color: var(--muted) !important; }
  .n-statistic .n-statistic-value { color: var(--jade-deep) !important; font-family: 'STKaiti', 'KaiTi', serif; }
  .n-modal, .n-card.n-modal, .n-dialog { border: 1px solid var(--line) !important; border-radius: 6px !important; background: var(--surface) !important; box-shadow: 0 22px 60px rgba(9, 29, 19, .2) !important; }
  .n-dialog .n-dialog__title, .n-modal .n-card-header__main { color: var(--jade-deep) !important; }
  html.dark .n-data-table { background: rgba(25, 37, 31, .94); }
  html.dark .n-data-table .n-data-table-thead { background: color-mix(in srgb, var(--jade-pale) 20%, var(--surface)); }
  html.dark .n-tabs .n-tabs-tab--active, html.dark .n-collapse .n-collapse-item__header, html.dark .n-statistic .n-statistic-value { color: #bee0c5 !important; }
  .n-descriptions-table-content { border-color: var(--line) !important; }
  .n-descriptions-table-content .n-descriptions-table-content__label, .n-descriptions-table-content .n-descriptions-table-content__content { border-color: var(--line) !important; }

  :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { border: 2px solid transparent; border-radius: 5px; background: rgba(40, 123, 97, .5); background-clip: padding-box; }

  @media (max-width: 800px) { .status-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 520px) {
    .app-shell::before { background-position: 59% bottom; }
    .header-content, .content-wrapper { padding-right: .9rem; padding-left: .9rem; }
    .content-wrapper { padding-top: 1.15rem; }
    .status-band { padding: .95rem; }
    .status-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .status-item:nth-child(2n) { border-right: 0; }
    .n-page-header__title { margin: 0; }
    .brand-title { gap: .5rem; font-size: 1.25rem; }
    .brand-sigil { width: 31px; height: 31px; }
    .n-menu.n-menu--horizontal .n-menu-item-content { padding: 0 .75rem; }
  }

  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; } }
</style>

<style>
  /* Visual refresh: let the existing landscape carry the atmosphere while the UI reads like a calm jade tablet. */
  :root {
    --paper: #e9e5d5;
    --surface: rgba(255, 252, 243, .93);
    --surface-solid: #fffdf5;
    --ink: #18271f;
    --muted: #617267;
    --line: rgba(42, 73, 57, .24);
    --jade-deep: #103b31;
    --jade: #27745d;
    --jade-pale: #dbe8d6;
    --gold: #b88a43;
    --cinnabar: #a94839;
    --focus: rgba(184, 138, 67, .78);
  }

  html.dark {
    --paper: #0b1613;
    --surface: rgba(21, 34, 29, .94);
    --surface-solid: #15231d;
    --ink: #eef2df;
    --muted: #b1beb0;
    --line: rgba(205, 224, 198, .2);
    --jade-pale: #224b3e;
  }

  html, body, #app { background: var(--paper); }
  body { font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; }
  .app-shell { background: linear-gradient(180deg, rgba(227, 228, 209, .78), var(--paper) 58%); }
  .app-shell::before {
    opacity: .98;
    filter: saturate(.82) contrast(1.02) brightness(1.02);
    background-position: center bottom;
    background-size: cover;
  }
  .app-shell::after {
    background: linear-gradient(180deg, rgba(10, 35, 28, .18), rgba(245, 242, 225, .18) 43%, rgba(245, 242, 225, .62));
    mix-blend-mode: normal;
  }
  html.dark .app-shell::before { opacity: .3; filter: saturate(.72) contrast(1.08) brightness(.72); }
  html.dark .app-shell::after { background: linear-gradient(180deg, rgba(3, 12, 10, .72), rgba(8, 23, 18, .78)); }

  .site-header {
    background: rgba(8, 27, 22, .92) !important;
    border-bottom-color: rgba(223, 205, 153, .34) !important;
    box-shadow: 0 12px 30px rgba(4, 18, 13, .28);
    backdrop-filter: blur(18px) saturate(120%);
  }
  .header-content, .content-wrapper { width: min(100%, 1400px); }
  .header-content { padding-right: clamp(.9rem, 3vw, 2.5rem); padding-left: clamp(.9rem, 3vw, 2.5rem); }
  .content-wrapper { padding: clamp(1.25rem, 3vw, 2.6rem) clamp(.9rem, 3vw, 2.5rem) 5rem; }
  .brand-title { letter-spacing: .14em; text-shadow: 0 2px 12px rgba(0, 0, 0, .32); }
  .brand-sigil { border-radius: 10px; box-shadow: 0 6px 18px rgba(0, 0, 0, .35), 0 0 0 3px rgba(184, 138, 67, .12); }
  .n-menu.n-menu--horizontal .n-menu-item-content { min-height: 48px; font-size: .92rem; }
  .n-menu.n-menu--horizontal .n-menu-item-content--selected::after { height: 3px; bottom: 0; border-radius: 2px; }

  .status-band {
    margin-bottom: 1.2rem;
    padding: clamp(1rem, 2vw, 1.5rem);
    border: 1px solid rgba(220, 210, 164, .3);
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(14, 61, 49, .97), rgba(18, 48, 39, .92));
    box-shadow: 0 18px 36px rgba(7, 29, 20, .22), inset 0 1px 0 rgba(255, 255, 255, .08);
  }
  .status-band::before { right: 1.4rem; left: 1.4rem; height: 1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
  .status-band::after { opacity: .42; }
  .status-grid { gap: .8rem; }
  .status-item { border-right-color: rgba(238, 238, 210, .14); }
  .status-item strong { font-variant-numeric: tabular-nums; }

  .n-layout-content > .content-wrapper > .n-card,
  .n-layout-content > .content-wrapper > .n-layout-content,
  .n-layout-content > .content-wrapper > main,
  .n-layout-content > .content-wrapper > div {
    position: relative;
  }
  .n-card {
    border-color: var(--line) !important;
    border-radius: 12px !important;
    background: var(--surface) !important;
    box-shadow: 0 14px 30px rgba(17, 47, 33, .1) !important;
    backdrop-filter: blur(9px) saturate(112%);
  }
  .n-card-header { padding: 1.25rem 1.35rem .7rem !important; }
  .n-card__content { padding: 0 1.35rem 1.35rem !important; }
  .n-card-header__main, .n-page-header__title { color: var(--jade-deep); }
  html.dark .n-card-header__main, html.dark .n-page-header__title { color: #d6e8ce; }
  .n-card-header__main { font-size: 1.28rem; letter-spacing: .08em; }
  .n-button { border-radius: 8px !important; min-height: 40px; }
  .n-button:not(.n-button--disabled):hover { transform: translateY(-2px); box-shadow: 0 7px 14px rgba(13, 56, 42, .14); }
  .n-button.n-button--primary-type { --n-color: #154c3d !important; --n-color-hover: #216d56 !important; --n-color-pressed: #0f382d !important; }
  .n-button.n-button--warning-type { --n-color: #bd9654 !important; --n-color-hover: #cba86c !important; --n-text-color: #17261f !important; }
  .n-button.n-button--error-type { --n-color: #a94839 !important; --n-color-hover: #be5848 !important; }
  .n-alert { border-radius: 10px !important; border-color: var(--line) !important; }
  .n-input, .n-base-selection, .n-input-number { border-radius: 8px !important; }
  .n-data-table { border-radius: 10px; }
  .n-tag { border-radius: 5px !important; }
  .n-progress .n-progress-graph-line-rail { background: rgba(237, 231, 205, .18) !important; }
  .n-progress .n-progress-graph-line-fill { box-shadow: 0 0 12px rgba(184, 138, 67, .25); }
  .n-divider { margin: 1.35rem 0 !important; }
  .n-modal, .n-dialog { border-radius: 12px !important; }

  @media (max-width: 640px) {
    .content-wrapper { padding-top: 1rem; }
    .n-card-header { padding: 1rem 1rem .55rem !important; }
    .n-card__content { padding: 0 1rem 1rem !important; }
    .status-band { border-radius: 11px; }
  }
</style>
