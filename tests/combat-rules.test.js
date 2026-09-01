import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildPlayerCombatant,
  buildDungeonPlayerCombatant,
  calculateCombatHit,
  resolveAutoCombat
} from '../src/plugins/combatRules.js'
import { CombatEntity, CombatManager, CombatType, generateEnemy } from '../src/plugins/combat.js'
import { getRealmBaseAttributes } from '../src/plugins/realm.js'
import {
  getBossForLocation,
  getEnemiesForLocation,
  selectEnemyForLocation
} from '../src/plugins/enemies.js'

const createCombatant = overrides => ({
  name: 'test combatant',
  maxHealth: 100,
  currentHealth: 100,
  attack: 10,
  defense: 0,
  speed: 10,
  critRate: 0,
  dodgeRate: 0,
  ...overrides
})

test('enemy lists are scoped by location and fixed rolls select deterministically', () => {
  const villageEnemies = getEnemiesForLocation('newbie_village')
  const mountainEnemies = getEnemiesForLocation('celestial_mountain')

  assert.ok(villageEnemies.length >= 2)
  assert.ok(mountainEnemies.length >= 2)
  assert.notDeepEqual(
    villageEnemies.map(enemy => enemy.id),
    mountainEnemies.map(enemy => enemy.id)
  )
  assert.deepEqual(selectEnemyForLocation('newbie_village', 0), villageEnemies[0])
  assert.deepEqual(selectEnemyForLocation('newbie_village', 0.999999), villageEnemies.at(-1))
})

test('buildPlayerCombatant only adds supported set combat bonuses and clamps current health', () => {
  const combatant = buildPlayerCombatant({
    name: 'tester',
    currentHealth: 150,
    baseAttributes: { attack: 20, defense: 8, health: 100, speed: 12 },
    combatAttributes: { critRate: 0.1, dodgeRate: 0.04, comboRate: 0.25 },
    specialAttributes: { finalDamageBoost: 0.5 },
    setBonuses: {
      attack: 3,
      defense: 2,
      critRate: 0.03,
      dodgeRate: 0.02,
      health: 999,
      speed: 999,
      comboRate: 0.5
    }
  })

  assert.deepEqual(combatant, {
    name: 'tester',
    maxHealth: 100,
    currentHealth: 100,
    attack: 23,
    defense: 10,
    speed: 12,
    critRate: 0.13,
    dodgeRate: 0.06
  })
})

test('dungeon player combatant composes equipment, pet, pill effects, and active technique', () => {
  const combatant = buildDungeonPlayerCombatant({
    player: {
      name: 'linked player',
      level: 10,
      realm: '筑基三层',
      currentHealth: 80,
      baseAttributes: { attack: 20, defense: 8, health: 100, speed: 12 },
      combatAttributes: { critRate: 0.1, dodgeRate: 0.04 },
      combatResistance: { critResist: 0.02 },
      specialAttributes: { finalDamageBoost: 0.1 },
      activeEquipmentSetBonuses: { attack: 3, defense: 2, critRate: 0.03 },
      getPetBonus: { attack: 4, defense: 1, health: 5, critRate: 0.02 },
      activeEffects: [{ type: 'combatBoost', value: 0.2 }]
    },
    technique: { id: 'linked-technique', damageMultiplier: 1.5, armorPenetration: 0.2, critRateBonus: 0.1 }
  })

  assert.equal(combatant.stats.damage, 27)
  assert.equal(combatant.stats.defense, 11)
  assert.equal(combatant.stats.maxHealth, 105)
  assert.equal(combatant.stats.critRate, 0.15)
  assert.equal(combatant.technique.id, 'linked-technique')
})

test('stacked combat pill effects have bounded aggregate bonuses', () => {
  const combatant = buildDungeonPlayerCombatant({
    player: {
      name: 'bounded player',
      level: 10,
      realm: '筑基一重',
      currentHealth: 100,
      baseAttributes: { health: 100, attack: 100, defense: 100, speed: 100 },
      specialAttributes: { combatBoost: 0.4 },
      activeEffects: [
        { type: 'allAttributes', value: 0.6 },
        { type: 'allAttributes', value: 0.6 },
        { type: 'combatBoost', value: 0.6 },
        { type: 'combatBoost', value: 0.6 }
      ]
    }
  })

  assert.equal(combatant.stats.attack, 175)
  assert.equal(combatant.stats.combatBoost, 0.75)
})

test('dungeon combat does not double count pet bonuses already applied to player attributes', () => {
  const combatant = buildDungeonPlayerCombatant({
    player: {
      baseAttributes: { attack: 24, defense: 9, health: 105, speed: 12 },
      combatAttributes: { critRate: 0.12, dodgeRate: 0.04 },
      getPetBonus: { attack: 4, defense: 1, health: 5, critRate: 0.02 },
      baseIncludesPet: true
    }
  })

  assert.equal(combatant.stats.damage, 24)
  assert.equal(combatant.stats.defense, 9)
  assert.equal(combatant.stats.maxHealth, 105)
  assert.equal(combatant.stats.critRate, 0.12)
})

test('dungeon combat manager consumes the linked player technique', () => {
  const player = new CombatEntity('player', 10, {
    health: 100, damage: 20, defense: 0, speed: 20
  })
  player.technique = {
    id: 'test-technique', name: 'test technique', damageMultiplier: 2,
    armorPenetration: 0.5, critRateBonus: 0, cooldownRounds: 3
  }
  const enemy = new CombatEntity('enemy', 10, {
    health: 1000, damage: 1, defense: 100, speed: 10
  })
  const manager = new CombatManager(player, enemy)
  manager.start()
  const result = manager.executeTurn()

  assert.equal(result.state, 'in_progress')
  assert.ok(result.results[0].damage > 20 * (100 / 200))
  assert.ok(manager.getCombatLog().length > 0)
})

test('combat entities preserve supplied current health between dungeon floors', () => {
  const player = new CombatEntity('player', 10, {
    health: 37,
    maxHealth: 100,
    damage: 20,
    defense: 5,
    speed: 10
  })

  assert.equal(player.currentHealth, 37)
})

test('critical damage reduction applies to critical hits and is capped safely', () => {
  const attacker = new CombatEntity('attacker', 1, { health: 100, damage: 100, critRate: 1 })
  const defender = new CombatEntity('defender', 1, {
    health: 1000,
    defense: 0,
    dodgeRate: 0,
    critDamageReduce: 0.5
  })

  const normal = defender.takeDamage(100, attacker, { isCrit: false })
  defender.currentHealth = 1000
  const critical = defender.takeDamage(200, attacker, { isCrit: true })

  assert.equal(normal.damage, 100)
  assert.equal(critical.damage, 100)
})

test('shared core attributes produce the same damage in both combat engines', () => {
  const originalRandom = Math.random
  Math.random = () => 0.9
  try {
    const attackerStats = {
      health: 1000,
      maxHealth: 1000,
      damage: 100,
      attack: 100,
      defense: 0,
      speed: 20,
      critRate: 1,
      dodgeRate: 0,
      combatBoost: 0.2,
      critDamageBoost: 0.5,
      finalDamageBoost: 0.1
    }
    const defenderStats = {
      health: 1000,
      maxHealth: 1000,
      currentHealth: 1000,
      damage: 1,
      attack: 1,
      defense: 100,
      speed: 10,
      dodgeRate: 0,
      combatBoost: 0.2,
      critDamageReduce: 0.25,
      finalDamageReduce: 0.1
    }
    const attacker = new CombatEntity('attacker', 1, attackerStats)
    const defender = new CombatEntity('defender', 1, defenderStats)
    const attack = attacker.stats.calculateDamage(defender)
    const managerDamage = defender.takeDamage(attack.damage, attacker, { isCrit: attack.isCrit }).damage
    const rulesDamage = calculateCombatHit({
      attacker: attackerStats,
      defender: defenderStats,
      rolls: { dodge: 0.99, crit: 0.9, variance: 0.5 }
    }).damage

    assert.equal(Math.round(managerDamage), rulesDamage)
  } finally {
    Math.random = originalRandom
  }
})

test('counterattacks deal an extra hit instead of replacing a normal action', () => {
  const originalRandom = Math.random
  Math.random = () => 0.9
  try {
    const player = new CombatEntity('player', 1, {
      health: 1000, damage: 20, defense: 0, speed: 20,
      critRate: 0, dodgeRate: 0, counterRate: 0
    })
    const enemy = new CombatEntity('enemy', 1, {
      health: 1000, damage: 10, defense: 0, speed: 10,
      critRate: 0, dodgeRate: 0, counterRate: 1
    })
    const manager = new CombatManager(player, enemy)
    manager.start()

    const result = manager.executeTurn()

    assert.equal(result.results.filter(action => action.attacker === 'enemy').length, 2)
    assert.equal(result.results.some(action => action.isCounter), true)
    assert.equal(player.currentHealth, 980)
  } finally {
    Math.random = originalRandom
  }
})

test('a stun from the slower combatant skips the faster combatant next round', () => {
  const originalRandom = Math.random
  Math.random = () => 0.9
  try {
    const player = new CombatEntity('player', 1, {
      health: 1000, damage: 10, defense: 0, speed: 20,
      critRate: 0, dodgeRate: 0, stunRate: 0
    })
    const enemy = new CombatEntity('enemy', 1, {
      health: 1000, damage: 10, defense: 0, speed: 10,
      critRate: 0, dodgeRate: 0, stunRate: 1
    })
    const manager = new CombatManager(player, enemy)
    manager.start()
    manager.executeTurn()

    const secondRound = manager.executeTurn()

    assert.equal(secondRound.results[0].attacker, 'enemy')
    assert.equal(secondRound.results.some(action => action.attacker === 'player'), false)
  } finally {
    Math.random = originalRandom
  }
})

test('enemy scaling is monotonic across five difficulties and caps probability defenses', () => {
  const enemies = [1, 2, 3, 4, 5].map(difficulty => generateEnemy(100, CombatType.BOSS, difficulty))

  for (let index = 1; index < enemies.length; index++) {
    assert.ok(enemies[index].stats.maxHealth > enemies[index - 1].stats.maxHealth)
    assert.ok(enemies[index].stats.damage > enemies[index - 1].stats.damage)
  }
  for (const enemy of enemies) {
    assert.ok(enemy.stats.critRate <= 0.45)
    assert.ok(enemy.stats.comboRate <= 0.45)
    assert.ok(enemy.stats.counterRate <= 0.4)
    assert.ok(enemy.stats.stunRate <= 0.3)
    assert.ok(enemy.stats.dodgeRate <= 0.35)
    assert.ok(enemy.stats.finalDamageReduce <= 0.5)
    assert.ok(enemy.stats.critDamageReduce <= 0.6)
  }
})

test('a normally equipped spirit-transformation character clears floor five across all difficulties', () => {
  const base = getRealmBaseAttributes(37)
  const stats = {
    health: base.health + 700,
    maxHealth: base.health + 700,
    damage: base.attack + 120,
    defense: base.defense + 120,
    speed: base.speed + 50,
    critRate: 0.25,
    comboRate: 0.2,
    counterRate: 0.15,
    dodgeRate: 0.12,
    critDamageBoost: 0.25,
    critDamageReduce: 0.25
  }
  const originalRandom = Math.random
  Math.random = () => 0.5
  try {
    for (const difficulty of [1, 2, 3, 4, 5]) {
      const player = new CombatEntity('player', 37, stats)
      const enemy = generateEnemy(5, CombatType.ELITE, difficulty)
      const combat = new CombatManager(player, enemy)
      combat.start()
      while (combat.state === 'in_progress') combat.executeTurn()
      assert.equal(combat.state, 'victory', `difficulty ${difficulty} floor five should be clearable`)
    }
  } finally {
    Math.random = originalRandom
  }
})

test('ratio defense mitigation reduces damage but never below one', () => {
  const regularHit = calculateCombatHit({
    attacker: createCombatant({ attack: 20 }),
    defender: createCombatant({ defense: 100 }),
    rolls: { dodge: 0.99, crit: 0.99, variance: 0.5 }
  })
  const heavilyMitigatedHit = calculateCombatHit({
    attacker: createCombatant({ attack: 1 }),
    defender: createCombatant({ defense: 100000 }),
    rolls: { dodge: 0.99, crit: 0.99, variance: 0.5 }
  })

  assert.equal(regularHit.damage, 10)
  assert.equal(heavilyMitigatedHit.damage, 1)
})

test('fixed crit rolls make critical hits deterministic', () => {
  const attacker = createCombatant({ attack: 20, critRate: 0.5 })
  const defender = createCombatant({ defense: 0 })
  const criticalHit = calculateCombatHit({
    attacker,
    defender,
    rolls: { dodge: 0.99, crit: 0.49, variance: 0.5 }
  })
  const normalHit = calculateCombatHit({
    attacker,
    defender,
    rolls: { dodge: 0.99, crit: 0.5, variance: 0.5 }
  })

  assert.equal(criticalHit.isCritical, true)
  assert.equal(normalHit.isCritical, false)
  assert.ok(criticalHit.damage > normalHit.damage)
})

test('armor penetration reduces effective defense for one hit', () => {
  const regular = calculateCombatHit({
    attacker: createCombatant({ attack: 20 }),
    defender: createCombatant({ defense: 100 }),
    rolls: { dodge: 0.99, crit: 0.99, variance: 0.5 }
  })
  const penetrating = calculateCombatHit({
    attacker: createCombatant({ attack: 20 }),
    defender: createCombatant({ defense: 100 }),
    armorPenetration: 0.5,
    rolls: { dodge: 0.99, crit: 0.99, variance: 0.5 }
  })

  assert.equal(regular.damage, 10)
  assert.equal(penetrating.damage, 13)
})

test('critical rate bonus is deterministic and does not mutate the attacker', () => {
  const attacker = createCombatant({ attack: 20, critRate: 0.1 })
  const regular = calculateCombatHit({
    attacker,
    defender: createCombatant({ defense: 0 }),
    rolls: { dodge: 0.99, crit: 0.2, variance: 0.5 }
  })
  const boosted = calculateCombatHit({
    attacker,
    defender: createCombatant({ defense: 0 }),
    critRateBonus: 0.2,
    rolls: { dodge: 0.99, crit: 0.2, variance: 0.5 }
  })

  assert.equal(regular.isCritical, false)
  assert.equal(boosted.isCritical, true)
  assert.equal(attacker.critRate, 0.1)
})

test('a successful dodge deals zero damage', () => {
  const hit = calculateCombatHit({
    attacker: createCombatant({ attack: 999 }),
    defender: createCombatant({ dodgeRate: 0.2 }),
    rolls: { dodge: 0.19, crit: 0, variance: 0.5 }
  })

  assert.equal(hit.isDodged, true)
  assert.equal(hit.damage, 0)
})

test('reported damage never exceeds the defender current health', () => {
  const hit = calculateCombatHit({
    attacker: createCombatant({ attack: 999 }),
    defender: createCombatant({ maxHealth: 100, currentHealth: 3 }),
    rolls: { dodge: 0.99, crit: 0.99, variance: 0.5 }
  })

  assert.equal(hit.damage, 3)
})

test('speed decides first action and a lethal strike prevents retaliation', () => {
  const result = resolveAutoCombat({
    player: createCombatant({ currentHealth: 20, attack: 100, speed: 20 }),
    enemy: createCombatant({ currentHealth: 10, maxHealth: 10, attack: 999, speed: 10 }),
    maxRounds: 10
  })

  assert.equal(result.outcome, 'victory')
  assert.equal(result.rounds, 1)
  assert.equal(result.playerHealthAfter, 20)
  assert.equal(result.enemyHealthAfter, 0)
  assert.equal(result.log.length, 1)
})

test('enemy lethal damage produces defeat without rewards', () => {
  const result = resolveAutoCombat({
    player: createCombatant({ currentHealth: 5, attack: 1, speed: 1 }),
    enemy: createCombatant({ attack: 100, speed: 20, rewards: [{ type: 'spirit_stone', amount: 5 }] }),
    maxRounds: 10
  })

  assert.equal(result.outcome, 'defeat')
  assert.equal(result.playerHealthAfter, 0)
  assert.deepEqual(result.rewards, [])
})

test('combat stops with round_limit when neither side is defeated', () => {
  const result = resolveAutoCombat({
    player: createCombatant({ maxHealth: 1000, currentHealth: 1000, attack: 1 }),
    enemy: createCombatant({ maxHealth: 1000, currentHealth: 1000, attack: 1 }),
    maxRounds: 2
  })

  assert.equal(result.outcome, 'round_limit')
  assert.equal(result.rounds, 2)
  assert.ok(result.playerHealthAfter > 0)
  assert.ok(result.enemyHealthAfter > 0)
})

test('player technique use is deterministic and respects round cooldown', () => {
  const result = resolveAutoCombat({
    player: createCombatant({ attack: 10, speed: 20, maxHealth: 1000, currentHealth: 1000 }),
    enemy: createCombatant({ attack: 1, speed: 10, maxHealth: 1000, currentHealth: 1000 }),
    technique: {
      id: 'test_cloud_slash',
      name: '破云斩',
      damageMultiplier: 2,
      cooldownRounds: 2
    },
    rolls: Array.from({ length: 8 }, () => ({ dodge: 0.9, crit: 0.9, variance: 0.5 })),
    maxRounds: 4
  })

  const playerActions = result.log.filter(entry => entry.side === 'player')
  const techniqueActions = playerActions.filter(entry => entry.actionType === 'technique')

  assert.deepEqual(techniqueActions.map(entry => entry.round), [1, 4])
  assert.deepEqual(techniqueActions.map(entry => entry.damage), [20, 20])
  assert.ok(techniqueActions.every(entry => entry.techniqueId === 'test_cloud_slash'))
  assert.ok(techniqueActions.every(entry => entry.techniqueName === '破云斩'))
})

test('style bonuses only apply to the player technique action and are written to that log entry', () => {
  const result = resolveAutoCombat({
    player: createCombatant({ attack: 20, critRate: 0.1, speed: 20, maxHealth: 1000, currentHealth: 1000 }),
    enemy: createCombatant({ attack: 1, defense: 100, speed: 10, maxHealth: 1000, currentHealth: 1000 }),
    technique: {
      id: 'test_style',
      name: '试炼式',
      damageMultiplier: 1,
      cooldownRounds: 3,
      armorPenetration: 0.5,
      critRateBonus: 0.2,
      effectText: '破甲50% · 会心+20%'
    },
    rolls: [
      { dodge: 0.9, crit: 0.2, variance: 0.5 },
      { dodge: 0.9, crit: 0.9, variance: 0.5 },
      { dodge: 0.9, crit: 0.2, variance: 0.5 },
      { dodge: 0.9, crit: 0.9, variance: 0.5 }
    ],
    maxRounds: 2
  })

  const playerActions = result.log.filter(entry => entry.side === 'player')
  assert.equal(playerActions[0].isCritical, true)
  assert.equal(playerActions[0].armorPenetration, 0.5)
  assert.equal(playerActions[0].critRateBonus, 0.2)
  assert.equal(playerActions[0].effectText, '破甲50% · 会心+20%')
  assert.equal(playerActions[1].isCritical, false)
  assert.equal('armorPenetration' in playerActions[1], false)
  assert.equal('critRateBonus' in playerActions[1], false)
})

test('lethal technique damage is capped and prevents enemy retaliation', () => {
  const result = resolveAutoCombat({
    player: createCombatant({ attack: 100, speed: 20 }),
    enemy: createCombatant({ attack: 999, speed: 10, maxHealth: 3, currentHealth: 3 }),
    technique: {
      id: 'test_finisher',
      name: '断岳式',
      damageMultiplier: 3,
      cooldownRounds: 1
    },
    rolls: [{ dodge: 0.9, crit: 0.9, variance: 0.5 }]
  })

  assert.equal(result.outcome, 'victory')
  assert.equal(result.playerHealthAfter, 100)
  assert.equal(result.log.length, 1)
  assert.deepEqual(result.log[0], {
    round: 1,
    side: 'player',
    attacker: 'test combatant',
    target: 'test combatant',
    damage: 3,
    isCritical: false,
    isDodged: false,
    targetHealthAfter: 0,
    actionType: 'technique',
    techniqueId: 'test_finisher',
    techniqueName: '断岳式'
  })
})

test('boss selection only applies to configured high-tier locations with an explicit roll', () => {
  const villageBoss = getBossForLocation('newbie_village')
  const abyssBoss = getBossForLocation('dragon_abyss')

  assert.equal(villageBoss, null)
  assert.ok(abyssBoss)
  assert.equal(abyssBoss.type, 'boss')
  assert.equal(selectEnemyForLocation('newbie_village', 0, 0).id, 'mist_rat')
  assert.equal(selectEnemyForLocation('dragon_abyss', 0.5, 0), abyssBoss)
  assert.notEqual(selectEnemyForLocation('dragon_abyss', 0.5, 0.999999).type, 'boss')
})

test('boss skill rewards are returned only after victory', () => {
  const boss = getBossForLocation('dragon_abyss')
  const skillReward = boss.rewards.find(reward => reward.type === 'skill')
  assert.deepEqual(Object.keys(skillReward).sort(), ['duplicateFragments', 'skillId', 'type'])
  assert.equal(skillReward.duplicateFragments, 2)

  const victory = resolveAutoCombat({
    player: createCombatant({ attack: 999, speed: 999 }),
    enemy: boss,
    rolls: [{ dodge: 0.9, crit: 0.9, variance: 0.5 }]
  })
  const defeat = resolveAutoCombat({
    player: createCombatant({ attack: 1, speed: 1, currentHealth: 1 }),
    enemy: boss,
    rolls: [{ dodge: 0.9, crit: 0.9, variance: 0.5 }]
  })

  assert.equal(victory.outcome, 'victory')
  assert.ok(victory.rewards.some(reward => reward.type === 'skill' && reward.skillId === skillReward.skillId))
  assert.equal(defeat.outcome, 'defeat')
  assert.deepEqual(defeat.rewards, [])
})
