// 战斗状态
const CombatState = {
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
}

// 战斗类型
const CombatType = {
  NORMAL: 'normal', // 普通战斗
  BOSS: 'boss', // Boss战斗
  ELITE: 'elite' // 精英战斗
}

const numberOr = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const clamp = (value, min, max) => Math.min(max, Math.max(min, numberOr(value)))

// 基础战斗属性
class CombatStats {
  constructor(base = {}) {
    // 基础属性
    this.health = numberOr(base.health, 100)
    this.maxHealth = Math.max(1, numberOr(base.maxHealth, this.health || 100))
    this.damage = Math.max(0, numberOr(base.damage, 10))
    this.defense = Math.max(0, numberOr(base.defense, 5))
    this.speed = Math.max(0, numberOr(base.speed, 10))
    // 战斗属性（百分比）
    this.critRate = clamp(numberOr(base.critRate, 0.05), 0, 0.95) // 暴击率
    this.comboRate = clamp(base.comboRate, 0, 0.95) // 连击率
    this.counterRate = clamp(base.counterRate, 0, 0.95) // 反击率
    this.stunRate = clamp(base.stunRate, 0, 0.95) // 眩晕率
    this.dodgeRate = clamp(numberOr(base.dodgeRate, 0.05), 0, 0.95) // 闪避率
    this.vampireRate = clamp(base.vampireRate, 0, 0.95) // 吸血率
    // 战斗抗性（百分比）
    this.critResist = clamp(base.critResist, 0, 0.95) // 抗暴击
    this.comboResist = clamp(base.comboResist, 0, 0.95) // 抗连击
    this.counterResist = clamp(base.counterResist, 0, 0.95) // 抗反击
    this.stunResist = clamp(base.stunResist, 0, 0.95) // 抗眩晕
    this.dodgeResist = clamp(base.dodgeResist, 0, 0.95) // 抗闪避
    this.vampireResist = clamp(base.vampireResist, 0, 0.95) // 抗吸血
    // 特殊属性（百分比）
    this.healBoost = Math.max(0, numberOr(base.healBoost)) // 强化治疗
    this.critDamageBoost = Math.max(0, numberOr(base.critDamageBoost, 0.5)) // 强化爆伤
    this.critDamageReduce = clamp(base.critDamageReduce, 0, 0.8) // 弱化爆伤
    this.finalDamageBoost = Math.max(0, numberOr(base.finalDamageBoost)) // 最终增伤
    this.finalDamageReduce = clamp(base.finalDamageReduce, 0, 0.8) // 最终减伤
    this.combatBoost = Math.max(0, numberOr(base.combatBoost)) // 战斗属性提升
    this.resistanceBoost = Math.max(0, numberOr(base.resistanceBoost)) // 战斗抗性提升
  }
  // 计算最终伤害
  calculateDamage(target, context = {}) {
    // 应用战斗属性提升
    let damage = Math.abs(this.damage * (1 + this.combatBoost))
    let isCrit = false
    let isCombo = false
    let isVampire = false
    let isStun = false
    // 计算暴击（考虑目标的抗暴击）
    const finalCritRate = clamp(
      (this.critRate + (context.critRateBonus || 0)) * (1 + this.combatBoost) -
        (target ? target.stats.critResist * (1 + target.stats.resistanceBoost) : 0),
      0,
      0.95
    )
    if (Math.random() < finalCritRate) {
      damage *= 1.5 + this.critDamageBoost
      isCrit = true
    }
    // 计算连击（考虑目标的抗连击）
    const finalComboRate = clamp(
      this.comboRate * (1 + this.combatBoost) - (target ? target.stats.comboResist * (1 + target.stats.resistanceBoost) : 0),
      0,
      0.95
    )
    if (Math.random() < finalComboRate) {
      damage *= 1.3
      isCombo = true
    }
    // 计算吸血（考虑目标的抗吸血）
    const finalVampireRate = clamp(
      this.vampireRate * (1 + this.combatBoost) - (target ? target.stats.vampireResist * (1 + target.stats.resistanceBoost) : 0),
      0,
      0.95
    )
    if (Math.random() < finalVampireRate) {
      isVampire = true
    }
    // 计算眩晕（考虑目标的抗眩晕）
    const finalStunRate = clamp(
      this.stunRate * (1 + this.combatBoost) - (target ? target.stats.stunResist * (1 + target.stats.resistanceBoost) : 0),
      0,
      0.95
    )
    if (Math.random() < finalStunRate) {
      isStun = true
    }
    // 应用最终伤害加成
    damage *= 1 + this.finalDamageBoost
    damage *= Number(context.damageMultiplier) > 0 ? Number(context.damageMultiplier) : 1
    return { damage: Math.abs(damage), isCrit, isCombo, isVampire, isStun, armorPenetration: context.armorPenetration || 0 }
  }
  // 计算伤害减免
  calculateDamageReduction(incomingDamage, context = {}) {
    let damage = Math.abs(incomingDamage)
    // 应用防御减伤（考虑战斗属性提升）
    const effectiveDefense = this.defense * (1 + this.combatBoost) * (1 - clamp(context.armorPenetration, 0, 0.75))
    damage *= 100 / (100 + effectiveDefense)
    // 如果是暴击伤害，应用暴击伤害减免
    if (context.isCrit) {
      damage *= 1 - this.critDamageReduce
    }
    // 应用最终伤害减免
    damage *= 1 - clamp(this.finalDamageReduce, 0, 0.8)
    return Math.abs(damage)
  }
}

// 战斗实体基类
class CombatEntity {
  constructor(name, level, baseStats = {}, realm = '练气一层') {
    const stats = { ...baseStats }
    this.name = name
    this.level = level
    this.realm = realm
    // 确保maxHealth与health保持一致
    if (stats.health && !stats.maxHealth) {
      stats.maxHealth = stats.health
    }
    this.stats = new CombatStats(stats)
    this.currentHealth = clamp(this.stats.health, 0, this.stats.maxHealth)
    this.stunnedTurns = 0
    this.effects = []
  }
  // 受到伤害
  takeDamage(amount, source, context = {}) {
    // 计算实际闪避率（考虑攻击方的抗闪避）
    const actualDodgeRate = clamp(
      this.stats.dodgeRate * (1 + this.stats.combatBoost) -
        (source ? source.stats.dodgeResist * (1 + source.stats.resistanceBoost) : 0),
      0,
      0.95
    )
    // 闪避判定
    if (Math.random() < actualDodgeRate) {
      return { dodged: true, damage: 0 }
    }
    // 计算实际伤害
    const reducedDamage = this.stats.calculateDamageReduction(amount, context)
    this.currentHealth = Math.max(0, this.currentHealth - reducedDamage)
    // 计算反击（考虑攻击方的抗反击）
    let isCounter = false
    if (source) {
      const finalCounterRate = clamp(
        this.stats.counterRate * (1 + this.stats.combatBoost) -
          source.stats.counterResist * (1 + source.stats.resistanceBoost),
        0,
        0.95
      )
      if (Math.random() < finalCounterRate) {
        isCounter = true
      }
    }
    return {
      dodged: false,
      damage: reducedDamage,
      currentHealth: this.currentHealth,
      isDead: this.currentHealth <= 0,
      isCounter: isCounter
    }
  }
  // 恢复生命值
  heal(amount) {
    const oldHealth = this.currentHealth
    this.currentHealth = Math.min(this.stats.maxHealth, this.currentHealth + amount)
    return this.currentHealth - oldHealth
  }
  // 添加效果
  addEffect(effect) {
    this.effects.push(effect)
    effect.apply(this)
  }
  // 移除效果
  removeEffect(effectId) {
    const index = this.effects.findIndex(e => e.id === effectId)
    if (index >= 0) {
      const effect = this.effects[index]
      effect.remove(this)
      this.effects.splice(index, 1)
    }
  }
}
// 战斗管理器
class CombatManager {
  constructor(player, enemy, type = CombatType.NORMAL) {
    this.player = player
    this.enemy = enemy
    this.type = type
    this.state = CombatState.READY
    this.round = 0
    this.maxRounds = 10 // 设置最大回合数为10
    this.log = []
    this.nextTechniqueRound = 1
  }
  // 开始战斗
  start() {
    this.state = CombatState.IN_PROGRESS
    return this.state
  }
  // 执行回合
  executeTurn() {
    if (this.state !== CombatState.IN_PROGRESS) return null
    this.round++
    if (this.round > this.maxRounds) {
      this.state = CombatState.DEFEAT
      this.log.push(`战斗超过${this.maxRounds}回合，战斗失败！`)
      return { results: [], state: this.state }
    }

    const results = []
    const playerSpeed = this.player.stats.speed * (1 + this.player.stats.combatBoost)
    const enemySpeed = this.enemy.stats.speed * (1 + this.enemy.stats.combatBoost)
    const firstAttacker = playerSpeed >= enemySpeed ? this.player : this.enemy
    const secondAttacker = playerSpeed >= enemySpeed ? this.enemy : this.player

    const finishIfDead = winner => {
      const loser = winner === this.player ? this.enemy : this.player
      if (loser.currentHealth > 0) return false
      this.state = winner === this.player ? CombatState.VICTORY : CombatState.DEFEAT
      this.log.push(`${winner.name}获得胜利！`)
      return true
    }

    const attack = (attacker, defender, { isCounter = false } = {}) => {
      if (attacker.currentHealth <= 0 || defender.currentHealth <= 0) return null
      if (attacker.stunnedTurns > 0) {
        attacker.stunnedTurns--
        this.log.push(`${attacker.name}处于眩晕状态，跳过本次行动！`)
        return { skipped: true }
      }

      const technique = !isCounter && attacker === this.player && this.player.technique && this.round >= this.nextTechniqueRound
        ? this.player.technique
        : null
      const attackStats = attacker.stats.calculateDamage(defender, technique || {})
      const hit = defender.takeDamage(attackStats.damage, attacker, {
        ...(technique || {}),
        isCrit: attackStats.isCrit
      })
      if (technique) this.nextTechniqueRound = this.round + Math.max(1, technique.cooldownRounds || 1) + 1

      if (!hit.dodged && attackStats.isStun && !hit.isDead) {
        defender.stunnedTurns = Math.max(defender.stunnedTurns, 1)
      }

      let message = isCounter ? `${attacker.name}发动反击` : `${attacker.name}进行攻击`
      if (hit.dodged) {
        message += `，被闪避了！`
      } else {
        message += `，造成${hit.damage.toFixed(1)}点伤害`
        if (attackStats.isCrit) message += `（暴击！）`
        if (attackStats.isCombo) message += `（连击！）`
        if (attackStats.isVampire) {
          const healAmount = hit.damage * 0.3 * (1 + attacker.stats.healBoost)
          attacker.heal(healAmount)
          message += `（吸血恢复${healAmount.toFixed(1)}点生命值！）`
        }
        if (attackStats.isStun) message += `（眩晕目标！）`
      }
      this.log.push(message)
      results.push({
        attacker: attacker.name,
        defender: defender.name,
        damage: hit.damage,
        isCrit: attackStats.isCrit,
        isCombo: attackStats.isCombo,
        isDodged: hit.dodged,
        isCounter
      })
      return { hit, attackStats }
    }

    for (const [attacker, defender] of [[firstAttacker, secondAttacker], [secondAttacker, firstAttacker]]) {
      const action = attack(attacker, defender)
      if (!action || action.skipped) continue
      if (finishIfDead(attacker)) break

      if (action.hit.isCounter && defender.stunnedTurns === 0) {
        this.log.push(`${defender.name}触发了反击效果！`)
        const counter = attack(defender, attacker, { isCounter: true })
        if (counter && !counter.skipped && finishIfDead(defender)) break
      }
    }
    return { results, state: this.state }
  }
  // 获取战斗日志
  getCombatLog() {
    return this.log
  }
}

// 生成敌人
function generateEnemy(level, type = CombatType.NORMAL, difficulty = 1) {
  const normalizedLevel = Math.max(1, Math.floor(numberOr(level, 1)))
  const normalizedDifficulty = clamp(Math.round(numberOr(difficulty, 1)), 1, 5)
  const difficultyScale = 1 + (normalizedDifficulty - 1) * 0.28
  const levelPressure = Math.min(1, normalizedLevel / 100)
  const difficultyPressure = (normalizedDifficulty - 1) / 4
  const baseStats = {
    // 基础属性
    health: 40 + 35 * Math.pow(normalizedLevel, 1.25) * difficultyScale,
    damage: 4 + 0.9 * Math.pow(normalizedLevel, 1.12) * difficultyScale,
    defense: 2 + 0.9 * Math.pow(normalizedLevel, 1.15) * difficultyScale,
    speed: 5 + 0.65 * Math.pow(normalizedLevel, 1.08) * difficultyScale,
    // 战斗属性（百分比）
    critRate: 0.05 + levelPressure * 0.18 + difficultyPressure * 0.08,
    comboRate: 0.03 + levelPressure * 0.15 + difficultyPressure * 0.07,
    counterRate: 0.03 + levelPressure * 0.12 + difficultyPressure * 0.06,
    stunRate: 0.02 + levelPressure * 0.08 + difficultyPressure * 0.04,
    dodgeRate: 0.05 + levelPressure * 0.12 + difficultyPressure * 0.05,
    vampireRate: 0.02 + levelPressure * 0.1 + difficultyPressure * 0.04,
    // 战斗抗性（百分比）
    critResist: 0.02 + levelPressure * 0.18 + difficultyPressure * 0.08,
    comboResist: 0.02 + levelPressure * 0.18 + difficultyPressure * 0.08,
    counterResist: 0.02 + levelPressure * 0.18 + difficultyPressure * 0.08,
    stunResist: 0.02 + levelPressure * 0.18 + difficultyPressure * 0.08,
    dodgeResist: 0.02 + levelPressure * 0.18 + difficultyPressure * 0.08,
    vampireResist: 0.02 + levelPressure * 0.18 + difficultyPressure * 0.08,
    // 特殊属性（百分比）
    healBoost: 0.05 + levelPressure * 0.2 + difficultyPressure * 0.1,
    critDamageBoost: 0.2 + levelPressure * 0.35 + difficultyPressure * 0.15,
    critDamageReduce: 0.1 + levelPressure * 0.2 + difficultyPressure * 0.1,
    finalDamageBoost: 0.05 + levelPressure * 0.18 + difficultyPressure * 0.08,
    finalDamageReduce: 0.05 + levelPressure * 0.18 + difficultyPressure * 0.08,
    combatBoost: 0.03 + levelPressure * 0.15 + difficultyPressure * 0.07,
    resistanceBoost: 0.03 + levelPressure * 0.15 + difficultyPressure * 0.07
  }
  // 根据类型调整属性
  switch (type) {
    case CombatType.ELITE:
      Object.keys(baseStats).forEach(key => {
        if (typeof baseStats[key] === 'number') {
          if (key.includes('Rate') || key.includes('Resist') || key.includes('Boost') || key.includes('Reduce')) {
            baseStats[key] *= 1.3
          } else {
            baseStats[key] *= 1.3
          }
        }
      })
      break
    case CombatType.BOSS:
      Object.keys(baseStats).forEach(key => {
        if (typeof baseStats[key] === 'number') {
          if (key.includes('Rate') || key.includes('Resist') || key.includes('Boost') || key.includes('Reduce')) {
            baseStats[key] *= 1.5
          } else {
            baseStats[key] *= 1.7
          }
        }
      })
      break
  }
  const percentageCaps = {
    critRate: 0.45,
    comboRate: 0.45,
    counterRate: 0.4,
    stunRate: 0.3,
    dodgeRate: 0.35,
    vampireRate: 0.35,
    critResist: 0.55,
    comboResist: 0.55,
    counterResist: 0.55,
    stunResist: 0.55,
    dodgeResist: 0.55,
    vampireResist: 0.55,
    critDamageReduce: 0.6,
    finalDamageReduce: 0.5,
    healBoost: 0.75,
    critDamageBoost: 1,
    finalDamageBoost: 0.75,
    combatBoost: 0.6,
    resistanceBoost: 0.6
  }
  Object.entries(percentageCaps).forEach(([key, cap]) => {
    baseStats[key] = Math.min(cap, baseStats[key])
  })
  // 根据类型和等级生成敌人名称
  let enemyName = ''
  const normalNames = ['野狼', '山猪', '毒蛇', '黑熊', '猛虎', '恶狼', '巨蟒', '狂狮']
  const eliteNames = ['赤焰虎', '玄冰蟒', '紫电豹', '金刚猿', '幽冥狼', '碧水蛟', '雷霆鹰', '烈风豹']
  const bossNames = ['九尾天狐', '万年龙蟒', '太古神虎', '玄天冰凤', '幽冥魔龙', '混沌巨兽', '远古天蟒', '不死火凤']
  switch (type) {
    case CombatType.BOSS:
      enemyName = bossNames[Math.floor(normalizedLevel / 10) % bossNames.length]
      break
    case CombatType.ELITE:
      enemyName = eliteNames[Math.floor(normalizedLevel / 5) % eliteNames.length]
      break
    default:
      enemyName = normalNames[normalizedLevel % normalNames.length]
  }
  return new CombatEntity(enemyName, normalizedLevel, baseStats, '练气一层')
}
export { CombatState, CombatType, CombatStats, CombatEntity, CombatManager, generateEnemy }
