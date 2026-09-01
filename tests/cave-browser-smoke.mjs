import { chromium } from 'file:///C:/Users/z1993/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
})
const errors = []
const warnings = []

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  page.on('console', message => {
    if (message.type() === 'error') errors.push('error: ' + message.text())
    if (message.type() === 'warning') warnings.push('warning: ' + message.text())
  })
  page.on('pageerror', error => errors.push('pageerror: ' + error.message))

  await page.goto('http://127.0.0.1:2027', { waitUntil: 'networkidle' })
  await page.getByPlaceholder('输入 2 到 8 个字符').fill('守静道人')
  await page.getByRole('button', { name: '踏入仙途' }).click()
  await page.getByText('洞府', { exact: true }).first().click()
  await page.getByRole('heading', { name: '洞府', exact: true }).waitFor()

  await page.getByRole('button', { name: '改派至炼器台' }).click()
  await page.getByText('炼器台', { exact: true }).first().waitFor()

  const beforeClaim = await page.evaluate(async () => {
    const { usePlayerStore } = await import('/src/stores/player.js')
    const store = usePlayerStore()
    const now = Date.now()
    store.caveState = {
      ...store.caveState,
      lastSettledAt: now - 61 * 60 * 1000
    }
    store.settleCaveProgress(now)
    return {
      reinforceStones: store.reinforceStones,
      pending: store.caveState.pendingReward.reinforceStones
    }
  })

  if (beforeClaim.pending !== 2) throw new Error(`模拟离线后应待领取 2 强化石，实际为 ${beforeClaim.pending}`)
  await page.getByText('+2', { exact: true }).waitFor()
  await page.getByRole('button', { name: '收取全部' }).click()
  await page.getByText('本次已收取', { exact: true }).waitFor()
  await page.getByRole('button', { name: '前往强化装备' }).waitFor()

  const afterClaim = await page.evaluate(async () => {
    const { usePlayerStore } = await import('/src/stores/player.js')
    const store = usePlayerStore()
    const duplicate = store.claimCavePending()
    return {
      reinforceStones: store.reinforceStones,
      pending: store.caveState.pendingReward.reinforceStones,
      duplicateReason: duplicate.reason
    }
  })

  if (afterClaim.reinforceStones !== beforeClaim.reinforceStones + 2) {
    throw new Error('洞府强化石没有准确增加一次')
  }
  if (afterClaim.pending !== 0 || afterClaim.duplicateReason !== 'nothing_to_claim') {
    throw new Error('洞府重复收取保护失效')
  }

  await page.waitForTimeout(3500)

  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const desktopPath = 'C:/Users/z1993/Documents/New project 2/guajixiuxian/tests/cave-desktop.png'
  await page.screenshot({ path: desktopPath, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const mobilePath = 'C:/Users/z1993/Documents/New project 2/guajixiuxian/tests/cave-mobile.png'
  await page.screenshot({ path: mobilePath, fullPage: true })

  await page.getByRole('button', { name: '前往强化装备' }).click()
  await page.getByText('背包', { exact: true }).first().waitFor()

  console.log(JSON.stringify({
    beforeClaim,
    afterClaim,
    desktopOverflow,
    mobileOverflow,
    desktopPath,
    mobilePath,
    errors,
    warnings
  }))
  if (desktopOverflow || mobileOverflow || errors.length) process.exitCode = 1
} finally {
  await browser.close()
}
