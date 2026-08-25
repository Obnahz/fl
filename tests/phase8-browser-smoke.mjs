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
    const store = usePlayerStore()
    store.unlockedSkills = ['spirit_edge', 'thunder_sword_intent']
    store.activeTechniqueId = 'spirit_edge'
    store.techniqueLevels = { spirit_edge: 5, thunder_sword_intent: 5 }
    store.techniqueFragments = {}
  })

  await page.getByText('功法', { exact: true }).first().click()
  await page.getByRole('heading', { name: '功法' }).waitFor()
  const spiritCard = page.locator('.technique-card').filter({ hasText: '引灵锋' })
  const thunderCard = page.locator('.technique-card').filter({ hasText: '惊雷剑意' })
  await spiritCard.getByText('破甲锋芒', { exact: true }).waitFor()
  await spiritCard.getByText('破甲 55%', { exact: true }).waitFor()
  await thunderCard.getByText('雷霆爆发', { exact: true }).waitFor()
  await thunderCard.getByText('会心 +24%', { exact: true }).waitFor()
  await thunderCard.getByRole('button', { name: '设为出战' }).click()

  const desktopPath = 'C:/Users/z1993/Documents/New project 2/vue-idle-xiuxian-main/tests/phase8-desktop.png'
  await page.screenshot({ path: desktopPath, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(200)
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const mobilePath = 'C:/Users/z1993/Documents/New project 2/vue-idle-xiuxian-main/tests/phase8-mobile.png'
  await page.screenshot({ path: mobilePath, fullPage: true })

  await page.getByText('历练', { exact: true }).first().click()
  await page.getByRole('heading', { name: '历练' }).first().waitFor()
  await page.getByText('雷霆爆发', { exact: true }).waitFor()
  await page.getByText('会心 +24%', { exact: true }).waitFor()
  await page.evaluate(async () => {
    const { usePlayerStore } = await import('/src/stores/player.js')
    const { locations } = await import('/src/plugins/locations.js')
    const store = usePlayerStore()
    store.spirit = 10000
    store.baseAttributes.attack = 100
    store.baseAttributes.defense = 1000
    store.baseAttributes.health = 1000
    store.baseAttributes.speed = 100
    store.currentHealth = 1000
    locations[0].dangerChance = 1
  })

  const exploreButton = page.getByRole('button', { name: '探索', exact: true }).first()
  for (let attempt = 0; attempt < 16 && !(await page.locator('.combat-result').count()); attempt++) {
    await exploreButton.click()
    await page.waitForTimeout(250)
  }
  await page.locator('.combat-result').waitFor()
  await page.getByText('逐回合战报', { exact: true }).click()
  await page.getByText(/触发会心 \+24%/).first().waitFor()

  const mobileExplorationOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)

  console.log(
    JSON.stringify({
      desktopPath,
      mobilePath,
      mobileOverflow,
      mobileExplorationOverflow,
      combatText: await page.locator('.combat-result').innerText(),
      errors
    })
  )
  if (mobileOverflow || mobileExplorationOverflow || errors.length) process.exitCode = 1
} finally {
  await browser.close()
}
