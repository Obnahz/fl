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
  await page.getByPlaceholder('输入 2 到 8 个字符').fill('清衡道人')
  await page.getByRole('button', { name: '踏入仙途' }).click()
  await page.getByText('宗门', { exact: true }).first().click()
  await page.getByRole('heading', { name: '选择宗门', exact: true }).waitFor()

  await page.getByRole('button', { name: '拜入青云宗' }).click()
  await page.getByRole('button', { name: '拜入青云宗', exact: true }).last().click()
  await page.getByText('青云宗传承', { exact: true }).waitFor()
  await page.getByRole('button', { name: '选择方向（免费）' }).first().click()
  await page.getByText('当前专精', { exact: true }).waitFor()

  await page.evaluate(async () => {
    const { usePlayerStore } = await import('/src/stores/player.js')
    const store = usePlayerStore()
    store.spirit = 10000
    store.spiritStones = 10000
    store.sectState = { ...store.sectState, contribution: 500 }
  })

  const shortCommission = page.locator('.commission-card').filter({ hasText: '山门巡守' })
  await shortCommission.getByRole('button', { name: '承接委托' }).click()
  await page.evaluate(async () => {
    const { usePlayerStore } = await import('/src/stores/player.js')
    const store = usePlayerStore()
    store.sectOperationsState.commissions.short.completesAt = Date.now() - 1
  })
  await shortCommission.getByRole('button', { name: '领取奖励' }).waitFor({ timeout: 3000 })
  await shortCommission.getByRole('button', { name: '领取奖励' }).click()
  await shortCommission.getByText('已完成', { exact: true }).waitFor()

  const firstOffer = page.locator('.shop-card').first()
  const stockBefore = await firstOffer.locator('.n-tag').textContent()
  await firstOffer.getByRole('button', { name: /贡献兑换/ }).click()
  const stockAfter = await firstOffer.locator('.n-tag').textContent()
  if (stockBefore === stockAfter) throw new Error('宗门商店兑换后库存未变化')
  await page.getByRole('button', { name: '刷新货架' }).click()
  await page.getByText(/今日刷新 1 \/ 1/).waitFor()
  await page.waitForTimeout(4000)

  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const desktopPath = 'C:/Users/z1993/Documents/New project 2/guajixiuxian/tests/sect-desktop.png'
  await page.screenshot({ path: desktopPath, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const mobilePath = 'C:/Users/z1993/Documents/New project 2/guajixiuxian/tests/sect-mobile.png'
  await page.screenshot({ path: mobilePath, fullPage: true })

  console.log(JSON.stringify({ desktopOverflow, mobileOverflow, desktopPath, mobilePath, errors, warnings }))
  if (desktopOverflow || mobileOverflow || errors.length) process.exitCode = 1
} finally {
  await browser.close()
}
