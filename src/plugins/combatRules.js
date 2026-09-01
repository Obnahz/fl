const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
const clampRoll = value => clamp(Number.isFinite(value) ? value : 0.5, 0, 0.999999)

const normalizeCombatant = combatant => {
  const maxHealth = Math.max(1, Math.round(Number(combatant?.maxHealth) || 1))
  return {
    ...combatant,
    name: combatant?.name || '无名修士',
    maxHealth,
    currentHealth: clamp(combatant?.currentHealth ?? maxHealth, 0, maxHealth),
    attack: Math.max(0, Number(combatant?.attack) || 0),
    defense: Math.max(0, Number(combatant?.defense) || 0),
    speed: Math.max(0, Number(combatant?.speed) || 0),
    critRate: clamp(combatant?.critRate, 0, 1),
    dodgeRate: clamp(combatant?.dodgeRate, 0, 0.75)
  }
}

export const buildPlayerCombatant = ({
  name,
  currentHealth,
  baseAttributes = {},
  combatAttributes = {},
  setBonuses = {}
} = {}) => {
  const maxHealth = Math.max(1, Number(baseAttributes.health) || 1)
  return normalizeCombatant({
    name: name || '修士',
    maxHealth,
    currentHealth: currentHealth ?? maxHealth,
    attack: (Number(baseAttributes.attack) || 0) + (Number(setBonuses.attack) || 0),
    defense: (Number(baseAttributes.defense) || 0) + (Number(setBonuses.defense) || 0),
    speed: Number(baseAttributes.speed) || 0,
    critRate: (Number(combatAttributes.critRate) || 0) + (Number(setBonuses.critRate) || 0),
    dodgeRate: (Number(combatAttributes.dodgeRate) || 0) + (Number(setBonuses.dodgeRate) || 0)
  })
}

const getNumeric = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

export const buildDungeonPlayerCombatant = ({ player = {}, technique = null } = {}) => {
  const base = player.baseAttributes || {}
  const combat = player.combatAttributes || {}
  const resistance = player.combatResistance || {}
  const special = player.specialAttributes || {}
  const setBonuses = player.activeEquipmentSetBonuses || player.setBonuses || {}
  const pet = player.getPetBonus || {}
  const petAlreadyApplied = player.baseIncludesPet === true
  const attributeBoost = clamp(
    (player.activeEffects || []).reduce((total, effect) => total + (effect?.type === 'allAttributes' ? getNumeric(effect.value) : 0), 0),
    0,
    0.75
  )
  const combatBoost = clamp(
    (player.activeEffects || []).reduce((total, effect) => total + (effect?.type === 'combatBoost' ? getNumeric(effect.value) : 0), getNumeric(special.combatBoost)),
    0,
    0.75
  )
  const multiplier = 1 + attributeBoost
  const petBaseHealth = petAlreadyApplied ? 0 : getNumeric(pet.health)
  const petBaseAttack = petAlreadyApplied ? 0 : getNumeric(pet.attack)
  const petBaseDefense = petAlreadyApplied ? 0 : getNumeric(pet.defense)
  const petBaseSpeed = petAlreadyApplied ? 0 : getNumeric(pet.speed)
  const maxHealth = Math.max(1, Math.round((getNumeric(base.health) + getNumeric(setBonuses.health) + petBaseHealth) * multiplier))
  const stats = normalizeCombatant({
    name: player.name || '修士',
    maxHealth,
    currentHealth: Math.min(maxHealth, Math.max(0, getNumeric(player.currentHealth, maxHealth))),
    attack: (getNumeric(base.attack) + getNumeric(setBonuses.attack) + petBaseAttack) * multiplier,
    defense: (getNumeric(base.defense) + getNumeric(setBonuses.defense) + petBaseDefense) * multiplier,
    speed: (getNumeric(base.speed) + getNumeric(setBonuses.speed) + petBaseSpeed) * multiplier,
    critRate: getNumeric(combat.critRate) + getNumeric(setBonuses.critRate) + (petAlreadyApplied ? 0 : getNumeric(pet.critRate)),
    dodgeRate: getNumeric(combat.dodgeRate) + getNumeric(setBonuses.dodgeRate) + (petAlreadyApplied ? 0 : getNumeric(pet.dodgeRate)),
    ...resistance,
    ...special,
    combatBoost,
    technique
  })
  stats.damage = stats.attack
  return { name: player.name || '修士', level: player.level || 1, realm: player.realm, stats, technique }
}

export const calculateCombatHit = ({
  attacker,
  defender,
  rolls = {},
  damageMultiplier = 1,
  armorPenetration = 0,
  critRateBonus = 0
}) => {
  const source = normalizeCombatant(attacker)
  const target = normalizeCombatant(defender)
  const sourceCombatBoost = Math.max(0, getNumeric(source.combatBoost))
  const sourceResistanceBoost = Math.max(0, getNumeric(source.resistanceBoost))
  const targetCombatBoost = Math.max(0, getNumeric(target.combatBoost))
  const targetResistanceBoost = Math.max(0, getNumeric(target.resistanceBoost))
  const dodgeChance = clamp(
    target.dodgeRate * (1 + targetCombatBoost) - getNumeric(source.dodgeResist) * (1 + sourceResistanceBoost),
    0,
    0.95
  )
  const isDodged = clampRoll(rolls.dodge) < dodgeChance
  if (isDodged) return { damage: 0, isCritical: false, isDodged: true }

  const criticalChance = clamp(
    (source.critRate + clamp(critRateBonus, 0, 1)) * (1 + sourceCombatBoost) -
      getNumeric(target.critResist) * (1 + targetResistanceBoost),
    0,
    0.95
  )
  const isCritical = clampRoll(rolls.crit) < criticalChance
  const variance = 0.9 + clampRoll(rolls.variance) * 0.2
  const criticalMultiplier = isCritical ? 1.5 + Math.max(0, getNumeric(source.critDamageBoost, 0.5)) : 1
  const multiplier = Math.max(0, Number(damageMultiplier) || 1)
  const penetration = clamp(armorPenetration, 0, 0.75)
  const effectiveDefense = target.defense * (1 + targetCombatBoost) * (1 - penetration)
  const criticalReduction = isCritical ? 1 - clamp(target.critDamageReduce, 0, 0.8) : 1
  const finalBoost = 1 + Math.max(0, getNumeric(source.finalDamageBoost))
  const finalReduction = 1 - clamp(target.finalDamageReduce, 0, 0.8)
  const mitigatedDamage = source.attack * (1 + sourceCombatBoost) * variance * criticalMultiplier * multiplier *
    (100 / (100 + effectiveDefense)) * criticalReduction * finalBoost * finalReduction
  const damage = Math.min(target.currentHealth, Math.max(1, Math.round(mitigatedDamage)))
  return { damage, isCritical, isDodged: false }
}

const getActionRolls = (rolls, actionIndex) => {
  if (Array.isArray(rolls)) return rolls[actionIndex] || {}
  return {
    dodge: rolls?.dodge?.[actionIndex],
    crit: rolls?.crit?.[actionIndex],
    variance: rolls?.variance?.[actionIndex]
  }
}

export const resolveAutoCombat = ({ player, enemy, technique = null, rolls = [], maxRounds = 8 }) => {
  const playerState = normalizeCombatant(player)
  const enemyState = normalizeCombatant({ ...enemy, currentHealth: enemy?.currentHealth ?? enemy?.maxHealth })
  const roundsLimit = Math.max(1, Math.floor(Number(maxRounds) || 8))
  const log = []
  let actionIndex = 0
  let rounds = 0
  let nextTechniqueRound = 1

  const playerActsFirst = playerState.speed >= enemyState.speed
  const combatants = playerActsFirst
    ? [
        { actor: playerState, target: enemyState, side: 'player' },
        { actor: enemyState, target: playerState, side: 'enemy' }
      ]
    : [
        { actor: enemyState, target: playerState, side: 'enemy' },
        { actor: playerState, target: enemyState, side: 'player' }
      ]

  for (let round = 1; round <= roundsLimit; round++) {
    rounds = round
    for (const turn of combatants) {
      if (turn.actor.currentHealth <= 0 || turn.target.currentHealth <= 0) break
      const usesTechnique = turn.side === 'player' && technique && round >= nextTechniqueRound
      const hit = calculateCombatHit({
        attacker: turn.actor,
        defender: turn.target,
        rolls: getActionRolls(rolls, actionIndex),
        damageMultiplier: usesTechnique ? technique.damageMultiplier : 1,
        armorPenetration: usesTechnique ? technique.armorPenetration : 0,
        critRateBonus: usesTechnique ? technique.critRateBonus : 0
      })
      actionIndex++
      if (usesTechnique) {
        nextTechniqueRound = round + Math.max(1, Math.floor(Number(technique.cooldownRounds) || 1)) + 1
      }
      turn.target.currentHealth = Math.max(0, turn.target.currentHealth - hit.damage)
      const entry = {
        round,
        side: turn.side,
        attacker: turn.actor.name,
        target: turn.target.name,
        damage: hit.damage,
        isCritical: hit.isCritical,
        isDodged: hit.isDodged,
        targetHealthAfter: turn.target.currentHealth
      }
      if (usesTechnique) {
        entry.actionType = 'technique'
        entry.techniqueId = technique.id
        entry.techniqueName = technique.name
        if ((Number(technique.armorPenetration) || 0) > 0) {
          entry.armorPenetration = technique.armorPenetration
        }
        if ((Number(technique.critRateBonus) || 0) > 0) {
          entry.critRateBonus = technique.critRateBonus
        }
        if (technique.effectText) entry.effectText = technique.effectText
      }
      log.push(entry)
    }
    if (playerState.currentHealth <= 0 || enemyState.currentHealth <= 0) break
  }

  const outcome = enemyState.currentHealth <= 0 ? 'victory' : playerState.currentHealth <= 0 ? 'defeat' : 'round_limit'
  return {
    outcome,
    rounds,
    playerHealthAfter: playerState.currentHealth,
    enemyHealthAfter: enemyState.currentHealth,
    log,
    rewards: outcome === 'victory' ? [...(enemy?.rewards || [])] : []
  }
}
