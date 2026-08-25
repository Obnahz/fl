import { chromium } from 'file:///C:/Users/z1993/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
})
const errors = []

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 } })
  const page = await context.newPage()
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))

  await page.goto('http://127.0.0.1:2025', { waitUntil: 'networkidle' })
  await page.getByPlaceholder('输入 2 到 8 个字符').fill('青玄道人')
  await page.getByRole('button', { name: '踏入仙途' }).click()
  await page.getByText('历练', { exact: true }).first().click()
  await page.getByRole('heading', { name: '历练' }).first().waitFor()

  await page.evaluate(async () => {
    const { usePlayerStore } = await import('/src/stores/player.js')
    const { locations } = await import('/src/plugins/locations.js')
    const store = usePlayerStore()
    store.level = 40
    store.spirit = 100000
    store.baseAttributes.attack = 100
    store.baseAttributes.defense = 1000
    store.baseAttributes.health = 1000
    store.baseAttributes.speed = 100
    store.currentHealth = 1000
    locations[0].dangerChance = 1
  })

  await page.getByText('引灵锋 · 第1层', { exact: true }).waitFor()
  await page.getByText('太古龙魂', { exact: false }).waitFor()

  const exploreButton = page.getByRole('button', { name: '探索', exact: true }).first()
  for (let attempt = 0; attempt < 16 && !(await page.locator('.combat-result').count()); attempt++) {
    await exploreButton.click()
    await page.waitForTimeout(250)
  }

  await page.locator('.combat-result').waitFor()
  await page.getByText('逐回合战报', { exact: true }).click()
  await page.getByText(/施展引灵锋/).first().waitFor()

  const desktopPath = 'C:/Users/z1993/Documents/New project 2/vue-idle-xiuxian-main/tests/phase6-desktop.png'
  await page.screenshot({ path: desktopPath, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(200)
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const mobilePath = 'C:/Users/z1993/Documents/New project 2/vue-idle-xiuxian-main/tests/phase6-mobile.png'
  await page.screenshot({ path: mobilePath, fullPage: true })

  console.log(
    JSON.stringify({
      desktopPath,
      mobilePath,
      mobileOverflow,
      combatText: await page.locator('.combat-result').innerText(),
      errors
    })
  )
  if (mobileOverflow || errors.length) process.exitCode = 1
} finally {
  await browser.close()
}
