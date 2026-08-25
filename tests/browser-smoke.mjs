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
  await page.getByRole('heading', { name: '测灵根，定道号' }).waitFor()
  await page.getByPlaceholder('输入 2 到 8 个字符').fill('青玄道人')
  await page.getByRole('button', { name: '踏入仙途' }).click()
  await page.getByText('冲关突破').waitFor()

  await page.getByText('历练', { exact: true }).first().click()
  await page.getByRole('heading', { name: '历练' }).first().waitFor()
  await page.getByRole('button', { name: '探索', exact: true }).first().click()
  await page.waitForTimeout(500)
  await page.getByText('探索次数').waitFor()

  const desktopPath = 'C:/Users/z1993/Documents/New project 2/vue-idle-xiuxian-main/tests/desktop-smoke.png'
  await page.screenshot({ path: desktopPath, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('青玄道人').first().waitFor()
  const mobilePath = 'C:/Users/z1993/Documents/New project 2/vue-idle-xiuxian-main/tests/mobile-smoke.png'
  await page.screenshot({ path: mobilePath, fullPage: true })

  console.log(JSON.stringify({ route: new URL(page.url()).hash, desktopPath, mobilePath, errors }))
  if (errors.length) process.exitCode = 1
} finally {
  await browser.close()
}
