const TASK_POOL = [
  { id: 'cultivation', event: 'cultivation', title: '静心修炼', description: '完成 3 次打坐修炼', target: 3, reward: { spirit: 60 } },
  { id: 'exploration', event: 'exploration', title: '下山历练', description: '完成 2 次历练', target: 2, reward: { spiritStones: 80 } },
  { id: 'spirit', event: 'spirit', title: '吐纳周天', description: '吐纳获得 30 点灵力', target: 30, reward: { spiritStones: 50 } },
  { id: 'alchemy', event: 'alchemy', title: '炉火不息', description: '成功炼制 1 枚丹药', target: 1, reward: { reinforceStones: 3 } },
  { id: 'dungeon', event: 'dungeon', title: '秘境试锋', description: '在秘境中取胜 1 次', target: 1, reward: { spiritStones: 120 } },
  { id: 'equipment', event: 'equipment', title: '整备行囊', description: '装备 1 件法器', target: 1, reward: { refinementStones: 1 } }
]

export const ACTIVITY_THRESHOLDS = [1, 2, 3]

const SEVEN_DAY_GOALS = [
  { day: 1, event: 'cultivation', title: '初定周天', description: '完成 5 次打坐修炼', target: 5, reward: { spirit: 100 } },
  { day: 2, event: 'exploration', title: '初涉尘世', description: '完成 3 次历练', target: 3, reward: { spiritStones: 120 } },
  { day: 3, event: 'equipment', title: '整备法器', description: '装备 1 件法器', target: 1, reward: { reinforceStones: 5 } },
  { day: 4, event: 'alchemy', title: '识得炉火', description: '成功炼制 1 枚丹药', target: 1, reward: { refinementStones: 1 } },
  { day: 5, event: 'dungeon', title: '秘境问锋', description: '在秘境中取胜 2 次', target: 2, reward: { spiritStones: 200 } },
  { day: 6, event: 'cultivation', title: '周天渐成', description: '完成 10 次打坐修炼', target: 10, reward: { spirit: 200 } },
  { day: 7, event: 'exploration', title: '仙途有迹', description: '完成 5 次历练', target: 5, reward: { cosmeticUnlock: '初入仙途' } }
]

export const getDateKey = (date = new Date()) => {
  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return getDateKey()
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const daySeed = dateKey => {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  return Math.max(0, (year || 0) * 372 + (month || 0) * 31 + (day || 0))
}

const dateKeyToDayNumber = dateKey => {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  if (!year || !month || !day) return null
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

export const createDailyState = (dateKey = getDateKey(), availableEvents = ['cultivation', 'exploration', 'spirit']) => {
  const allowedEvents = new Set(Array.isArray(availableEvents) ? availableEvents : [])
  const available = TASK_POOL.filter(task => allowedEvents.has(task.event))
  const fallback = TASK_POOL.filter(task => ['cultivation', 'exploration', 'spirit'].includes(task.event))
  const pool = available.length >= 3 ? available : fallback
  const start = daySeed(dateKey) % pool.length
  const definitions = Array.from({ length: 3 }, (_, index) => pool[(start + index) % pool.length])
  return {
    dateKey,
    tasks: definitions.map(task => ({
      ...task,
      progress: 0,
      completed: false,
      claimed: false
    })),
    activity: 0,
    claimedChestThresholds: []
  }
}

export const normalizeDailyState = (value, dateKey = getDateKey(), availableEvents) => {
  const source = value && typeof value === 'object' ? value : {}
  if (source.dateKey !== dateKey || !Array.isArray(source.tasks) || source.tasks.length !== 3) {
    return createDailyState(dateKey, availableEvents)
  }

  const definitions = source.tasks.map(task => TASK_POOL.find(item => item.id === task.id)).filter(Boolean)
  if (definitions.length !== 3) return createDailyState(dateKey, availableEvents)

  return {
    dateKey,
    tasks: definitions.map(definition => {
      const stored = source.tasks.find(task => task.id === definition.id) || {}
      const progress = Math.min(definition.target, Math.max(0, Math.floor(Number(stored.progress) || 0)))
      return {
        ...definition,
        progress,
        completed: progress >= definition.target,
        claimed: stored.claimed === true
      }
    }),
    activity: Math.min(3, Math.max(0, Math.floor(Number(source.activity) || 0))),
    claimedChestThresholds: ACTIVITY_THRESHOLDS.filter(threshold =>
      Array.isArray(source.claimedChestThresholds) && source.claimedChestThresholds.includes(threshold)
    )
  }
}

export const rolloverDailyState = (state, dateKey = getDateKey(), availableEvents) =>
  normalizeDailyState(state, dateKey, availableEvents)

export const recordTaskEvent = (state, eventType, amount = 1) => {
  const next = normalizeDailyState(state, state?.dateKey || getDateKey())
  const increment = Math.max(0, Math.floor(Number(amount) || 0))
  if (!increment) return next

  next.tasks = next.tasks.map(task => {
    if (task.event !== eventType || task.completed) return task
    const progress = Math.min(task.target, task.progress + increment)
    return { ...task, progress, completed: progress >= task.target }
  })
  next.activity = next.tasks.filter(task => task.completed).length
  return next
}

export const claimTask = (state, taskId) => {
  const next = normalizeDailyState(state, state?.dateKey || getDateKey())
  const task = next.tasks.find(item => item.id === taskId)
  if (!task || !task.completed || task.claimed) return { state: next, success: false, reward: null }
  task.claimed = true
  return { state: next, success: true, reward: { ...task.reward } }
}

export const claimActivityChest = (state, threshold) => {
  const next = normalizeDailyState(state, state?.dateKey || getDateKey())
  if (!ACTIVITY_THRESHOLDS.includes(threshold) || next.activity < threshold || next.claimedChestThresholds.includes(threshold)) {
    return { state: next, success: false, reward: null }
  }
  next.claimedChestThresholds.push(threshold)
  return { state: next, success: true, reward: threshold === 3 ? { spiritStones: 180 } : { spirit: 30 * threshold } }
}

export const getRecommendedTask = state => {
  const next = normalizeDailyState(state, state?.dateKey || getDateKey())
  return next.tasks.find(task => task.completed && !task.claimed) || next.tasks.find(task => !task.completed) || null
}

export const getTaskPool = () => TASK_POOL.map(task => ({ ...task, reward: { ...task.reward } }))

export const createSevenDayState = (startDateKey = getDateKey()) => ({
  startDateKey,
  goals: SEVEN_DAY_GOALS.map(goal => ({
    ...goal,
    progress: 0,
    completed: false,
    claimed: false
  }))
})

export const getUnlockedSevenDayCount = (state, dateKey = getDateKey()) => {
  const start = dateKeyToDayNumber(state?.startDateKey)
  const current = dateKeyToDayNumber(dateKey)
  if (start === null || current === null) return 1
  return Math.min(7, Math.max(1, current - start + 1))
}

export const normalizeSevenDayState = (value, dateKey = getDateKey()) => {
  const source = value && typeof value === 'object' ? value : {}
  const startDateKey = dateKeyToDayNumber(source.startDateKey) === null ? dateKey : source.startDateKey
  const storedGoals = Array.isArray(source.goals) ? source.goals : []
  return {
    startDateKey,
    goals: SEVEN_DAY_GOALS.map(definition => {
      const stored = storedGoals.find(goal => goal.day === definition.day) || {}
      const progress = Math.min(definition.target, Math.max(0, Math.floor(Number(stored.progress) || 0)))
      return {
        ...definition,
        progress,
        completed: progress >= definition.target,
        claimed: stored.claimed === true
      }
    })
  }
}

export const recordSevenDayEvent = (state, eventType, amount = 1, dateKey = getDateKey()) => {
  const next = normalizeSevenDayState(state, dateKey)
  const increment = Math.max(0, Math.floor(Number(amount) || 0))
  const unlockedCount = getUnlockedSevenDayCount(next, dateKey)
  if (!increment) return next

  next.goals = next.goals.map(goal => {
    if (goal.day > unlockedCount || goal.event !== eventType || goal.completed) return goal
    const progress = Math.min(goal.target, goal.progress + increment)
    return { ...goal, progress, completed: progress >= goal.target }
  })
  return next
}

export const claimSevenDayGoal = (state, day, dateKey = getDateKey()) => {
  const next = normalizeSevenDayState(state, dateKey)
  const goal = next.goals.find(item => item.day === day)
  const unlockedCount = getUnlockedSevenDayCount(next, dateKey)
  if (!goal || goal.day > unlockedCount || !goal.completed || goal.claimed) {
    return { state: next, success: false, reward: null }
  }
  goal.claimed = true
  return { state: next, success: true, reward: { ...goal.reward } }
}
