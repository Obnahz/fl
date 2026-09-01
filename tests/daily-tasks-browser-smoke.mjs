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
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.type() + ': ' + message.text())
  })
  page.on('pageerror', error => errors.push('pageerror: ' + error.message))

  await page.goto('http://127.0.0.1:2027', { waitUntil: 'networkidle' })
  await page.getByPlaceholder('输入 2 到 8 个字符').fill('清微道人')
  await page.getByRole('button', { name: '踏入仙途' }).click()
  const migratedTaskCount = await page.evaluate(async () => {
    const { usePlayerStore } = await import('/src/stores/player.js')
    const { encryptData } = await import('/src/plugins/crypto.js')
    const store = usePlayerStore()
    const oldSave = JSON.parse(JSON.stringify(store.$state))
    delete oldSave.dailyState
    oldSave.saveVersion = 5
    await store.importData(encryptData(oldSave))
    return store.dailyState.tasks.length
  })
  if (migratedTaskCount !== 3) throw new Error('旧存档未补齐今日任务')
  await page.getByText('今日修行', { exact: true }).waitFor()
  await page.getByText('下一步', { exact: true }).waitFor()

  const cultivationTask = page.locator('.task-row').filter({ hasText: '静心修炼' })
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: /打坐修炼/ }).click()
  }
  await cultivationTask.getByText('可领取', { exact: true }).waitFor()
  await cultivationTask.getByRole('button', { name: '领取' }).click()
  await cultivationTask.getByText('已领取', { exact: true }).waitFor()
  for (let index = 0; index < 2; index++) {
    await page.getByRole('button', { name: /打坐修炼/ }).click()
  }
  await page.getByText('今日', { exact: true }).first().click()
  await page.getByRole('heading', { name: '今日修行', exact: true }).first().waitFor()
  const firstSevenDayGoal = page.locator('.goal-row').filter({ hasText: '初定周天' })
  await firstSevenDayGoal.getByText('可领取', { exact: true }).waitFor()
  await firstSevenDayGoal.getByRole('button', { name: '领取' }).click()
  await firstSevenDayGoal.getByText('已领取', { exact: true }).waitFor()

  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const desktopPath = 'C:/Users/z1993/Documents/New project 2/guajixiuxian/tests/daily-tasks-desktop.png'
  await page.screenshot({ path: desktopPath, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(200)
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const mobilePath = 'C:/Users/z1993/Documents/New project 2/guajixiuxian/tests/daily-tasks-mobile.png'
  await page.screenshot({ path: mobilePath, fullPage: true })

  console.log(JSON.stringify({ desktopOverflow, mobileOverflow, desktopPath, mobilePath, errors }))
  if (desktopOverflow || mobileOverflow || errors.length) process.exitCode = 1
} finally {
  await browser.close()
}
