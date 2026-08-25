import { chromium } from 'file:///C:/Users/z1993/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
})
const errors = []

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))

  await page.goto('http://127.0.0.1:2025', { waitUntil: 'networkidle' })
  await page.getByPlaceholder('输入 2 到 8 个字符').fill('青玄道人')
  await page.getByRole('button', { name: '踏入仙途' }).click()

  await page.evaluate(async () => {
    const { usePlayerStore } = await import('/src/stores/player.js')
    const { createEquipmentDrop } = await import('/src/plugins/equipmentRules.js')
    const store = usePlayerStore()
    const weapon = createEquipmentDrop({
      id: 'phase4-weapon',
      tier: 1,
      playerLevel: 1,
      rolls: { slot: 0, quality: 0.97, level: 0, name: 0, set: 0, stats: [0.9, 0.9] }
    })
    const hands = createEquipmentDrop({
      id: 'phase4-hands',
      tier: 1,
      playerLevel: 1,
      rolls: { slot: 0.47, quality: 0.7, level: 0, name: 0, set: 0, stats: [0.7, 0.7] }
    })
    store.addEquipment(weapon)
    store.addEquipment(hands)
    store.equipmentPity = 8
    await store.saveData({ immediate: true })
  })

  await page.getByText('行囊', { exact: true }).first().click()
  await page.getByText('行囊装备').waitFor()
  await page.getByText('武器', { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"n-card")][1]').click()
  await page.getByText('可装备', { exact: true }).first().waitFor()
  await page.locator('.n-dialog').getByText('青锋武器', { exact: false }).click()
  await page.getByRole('separator').getByText('青锋套', { exact: true }).waitFor()
  await page.getByRole('button', { name: '装备', exact: true }).click()

  await page.getByText('手套', { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"n-card")][1]').click()
  await page.locator('.n-dialog').getByText('凝锋护手', { exact: false }).click()
  await page.getByRole('button', { name: '装备', exact: true }).click()
  await page.getByText('青锋套 2 件').waitFor()
  await page.waitForTimeout(700)

  const desktopPath = 'C:/Users/z1993/Documents/New project 2/vue-idle-xiuxian-main/tests/phase4-desktop.png'
  await page.screenshot({ path: desktopPath, fullPage: true })

  await page.getByText('历练', { exact: true }).first().click()
  await page.getByText('装备机缘').waitFor()
  await page.getByText('8 / 8').waitFor()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(200)
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const mobilePath = 'C:/Users/z1993/Documents/New project 2/vue-idle-xiuxian-main/tests/phase4-mobile.png'
  await page.screenshot({ path: mobilePath, fullPage: true })

  console.log(JSON.stringify({ desktopPath, mobilePath, mobileOverflow, errors }))
  if (mobileOverflow || errors.length) process.exitCode = 1
} finally {
  await browser.close()
}
