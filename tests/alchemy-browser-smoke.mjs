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
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    const { usePlayerStore } = await import('/src/stores/player.js')
    const { pillRecipes } = await import('/src/plugins/pills.js')
    const { herbs } = await import('/src/plugins/herbs.js')
    const store = usePlayerStore()
    store.isNewPlayer = false
    store.name = '青玄道人'
    store.pillRecipes = pillRecipes.slice(0, 8).map(recipe => recipe.id)
    store.herbs = herbs.slice(0, 10).flatMap(herb =>
      Array.from({ length: 6 }, (_, index) => ({ ...herb, id: herb.id, instanceId: `${herb.id}-${index}` }))
    )
  })
  await page.goto('http://127.0.0.1:4173/#/alchemy', { waitUntil: 'networkidle' })
  await page.getByText('丹药炼制', { exact: true }).waitFor()
  await page.locator('.recipe-row').first().click()
  await page.getByRole('button', { name: /炼制 1 炉/ }).waitFor()
  const appliedStyles = await page.evaluate(() => ({
    summaryDisplay: getComputedStyle(document.querySelector('.alchemy-summary')).display,
    workspaceDisplay: getComputedStyle(document.querySelector('.alchemy-workspace')).display,
    recipeDisplay: getComputedStyle(document.querySelector('.recipe-row')).display,
    recipeDataAttributes: [...document.querySelector('.recipe-row').attributes].map(attribute => attribute.name)
  }))

  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  const desktopPath = 'C:/Users/z1993/Documents/New project 2/guajixiuxian/tests/alchemy-desktop.png'
  await page.screenshot({ path: desktopPath, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByText('丹药炼制', { exact: true }).waitFor()
  await page.getByRole('button', { name: /炼制 1 炉/ }).waitFor()
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  const mobilePath = 'C:/Users/z1993/Documents/New project 2/guajixiuxian/tests/alchemy-mobile.png'
  await page.screenshot({ path: mobilePath, fullPage: true })

  console.log(JSON.stringify({ desktopOverflow, mobileOverflow, appliedStyles, desktopPath, mobilePath, errors }))
  if (desktopOverflow || mobileOverflow || errors.length) process.exitCode = 1
} finally {
  await browser.close()
}
