const enemyGroups = {
  newbie_village: [
    {
      id: 'mist_rat',
      name: '雾尾灵鼠',
      type: 'normal',
      weight: 0.72,
      maxHealth: 30,
      attack: 5,
      defense: 2,
      speed: 8,
      critRate: 0.02,
      dodgeRate: 0.03,
      rewards: [{ type: 'spirit_stone', amount: 2 }]
    },
    {
      id: 'green_fang_wolf',
      name: '青牙妖狼',
      type: 'elite',
      weight: 0.28,
      maxHealth: 44,
      attack: 7,
      defense: 4,
      speed: 12,
      critRate: 0.05,
      dodgeRate: 0.04,
      rewards: [{ type: 'cultivation', amount: 8 }]
    }
  ],
  celestial_mountain: [
    {
      id: 'cloud_ape',
      name: '踏云猿',
      type: 'normal',
      weight: 0.68,
      maxHealth: 52,
      attack: 8,
      defense: 6,
      speed: 11,
      critRate: 0.04,
      dodgeRate: 0.03,
      rewards: [{ type: 'spirit_stone', amount: 40 }]
    },
    {
      id: 'thunder_hawk',
      name: '惊雷隼',
      type: 'elite',
      weight: 0.32,
      maxHealth: 68,
      attack: 10,
      defense: 7,
      speed: 16,
      critRate: 0.08,
      dodgeRate: 0.07,
      rewards: [{ type: 'cultivation', amount: 180 }]
    }
  ],
  phoenix_valley: [
    {
      id: 'ember_lizard',
      name: '赤焰蜥',
      type: 'normal',
      weight: 0.66,
      maxHealth: 74,
      attack: 11,
      defense: 9,
      speed: 13,
      critRate: 0.06,
      dodgeRate: 0.04,
      rewards: [{ type: 'spirit_stone', amount: 70 }]
    },
    {
      id: 'fire_plume_serpent',
      name: '火羽妖蛇',
      type: 'elite',
      weight: 0.34,
      maxHealth: 96,
      attack: 14,
      defense: 11,
      speed: 18,
      critRate: 0.1,
      dodgeRate: 0.08,
      rewards: [{ type: 'cultivation', amount: 320 }]
    }
  ],
  dragon_abyss: [
    {
      id: 'deep_scale_crocodile',
      name: '玄鳞渊鳄',
      type: 'normal',
      weight: 0.64,
      maxHealth: 104,
      attack: 15,
      defense: 14,
      speed: 14,
      critRate: 0.07,
      dodgeRate: 0.04,
      rewards: [{ type: 'spirit_stone', amount: 110 }]
    },
    {
      id: 'shadow_flood_dragon',
      name: '潜影蛟',
      type: 'elite',
      weight: 0.36,
      maxHealth: 136,
      attack: 18,
      defense: 17,
      speed: 20,
      critRate: 0.12,
      dodgeRate: 0.08,
      rewards: [{ type: 'cultivation', amount: 520 }]
    }
  ],
  immortal_realm: [
    {
      id: 'void_moth',
      name: '噬灵虚蛾',
      type: 'normal',
      weight: 0.62,
      maxHealth: 142,
      attack: 20,
      defense: 19,
      speed: 18,
      critRate: 0.09,
      dodgeRate: 0.06,
      rewards: [{ type: 'spirit_stone', amount: 210 }]
    },
    {
      id: 'gate_guardian',
      name: '镇界狰',
      type: 'elite',
      weight: 0.38,
      maxHealth: 184,
      attack: 24,
      defense: 23,
      speed: 22,
      critRate: 0.14,
      dodgeRate: 0.09,
      rewards: [{ type: 'cultivation', amount: 960 }]
    }
  ],
  nether_river: [
    {
      id: 'underworld_fish', name: '\u5e7d\u6c34\u9b42\u9c7c', type: 'normal', weight: 0.6,
      maxHealth: 210, attack: 28, defense: 27, speed: 20, critRate: 0.12, dodgeRate: 0.08,
      rewards: [{ type: 'spirit_stone', amount: 300 }]
    },
    {
      id: 'river_watcher', name: '\u51a5\u6cb3\u5b88\u6e21\u4eba', type: 'elite', weight: 0.4,
      maxHealth: 270, attack: 34, defense: 31, speed: 24, critRate: 0.16, dodgeRate: 0.1,
      rewards: [{ type: 'cultivation', amount: 1500 }]
    }
  ],
  star_sea_ruins: [
    {
      id: 'star_devourer', name: '\u566c\u661f\u517d', type: 'normal', weight: 0.58,
      maxHealth: 330, attack: 38, defense: 36, speed: 23, critRate: 0.15, dodgeRate: 0.1,
      rewards: [{ type: 'spirit_stone', amount: 520 }]
    },
    {
      id: 'ruins_sentinel', name: '\u9057\u5e9c\u661f\u4f7f', type: 'elite', weight: 0.42,
      maxHealth: 420, attack: 46, defense: 43, speed: 28, critRate: 0.2, dodgeRate: 0.13,
      rewards: [{ type: 'cultivation', amount: 2400 }]
    }
  ]
}

const bossGroups = {
  phoenix_valley: {
    id: 'phoenix_ember_king', name: '\u51e4\u7130\u7075\u738b', type: 'boss', chance: 0.1,
    maxHealth: 150, attack: 18, defense: 14, speed: 20, critRate: 0.13, dodgeRate: 0.09,
    rewards: [
      { type: 'spirit_stone', amount: 180 },
      { type: 'skill', skillId: 'ember_meridian_art', duplicateFragments: 3 }
    ]
  },
  dragon_abyss: {
    id: 'ancient_dragon_remnant',
    name: '太古龙魂',
    type: 'boss',
    chance: 0.08,
    maxHealth: 220,
    attack: 25,
    defense: 24,
    speed: 21,
    critRate: 0.14,
    dodgeRate: 0.08,
    rewards: [
      { type: 'spirit_stone', amount: 260 },
      { type: 'skill', skillId: 'thunder_sword_intent', duplicateFragments: 2 }
    ]
  },
  immortal_realm: {
    id: 'heaven_gate_avatar',
    name: '天门法相',
    type: 'boss',
    chance: 0.1,
    maxHealth: 310,
    attack: 32,
    defense: 30,
    speed: 26,
    critRate: 0.18,
    dodgeRate: 0.1,
    rewards: [
      { type: 'spirit_stone', amount: 520 },
      { type: 'cultivation', amount: 1800 },
      { type: 'skill', skillId: 'starfall_sutra', duplicateFragments: 4 }
    ]
  },
  nether_river: {
    id: 'nether_lord', name: '\u5e7d\u51a5\u6cb3\u4e3b', type: 'boss', chance: 0.12,
    maxHealth: 520, attack: 42, defense: 40, speed: 25, critRate: 0.2, dodgeRate: 0.12,
    rewards: [
      { type: 'spirit_stone', amount: 760 },
      { type: 'skill', skillId: 'void_seal_sword', duplicateFragments: 3 }
    ]
  },
  star_sea_ruins: {
    id: 'star_sea_overlord', name: '\u661f\u6d77\u9057\u4e3b', type: 'boss', chance: 0.14,
    maxHealth: 760, attack: 58, defense: 54, speed: 31, critRate: 0.24, dodgeRate: 0.15,
    rewards: [
      { type: 'spirit_stone', amount: 1200 },
      { type: 'skill', skillId: 'starfall_sutra', duplicateFragments: 4 }
    ]
  }
}

const clampRoll = value => Math.min(0.999999, Math.max(0, Number.isFinite(value) ? value : 0.5))

export const getEnemiesForLocation = locationId => enemyGroups[locationId] || []

export const getBossForLocation = locationId => bossGroups[locationId] || null

export const selectEnemyForLocation = (locationId, roll, bossRoll) => {
  const enemies = getEnemiesForLocation(locationId)
  if (!enemies.length) return null

  const boss = getBossForLocation(locationId)
  if (boss && clampRoll(bossRoll) < boss.chance) return boss

  const totalWeight = enemies.reduce((total, enemy) => total + Math.max(0, Number(enemy.weight) || 0), 0)
  if (totalWeight <= 0) return enemies[Math.floor(clampRoll(roll) * enemies.length)]

  const target = clampRoll(roll) * totalWeight
  let cumulative = 0
  for (const enemy of enemies) {
    cumulative += Math.max(0, Number(enemy.weight) || 0)
    if (target < cumulative) return enemy
  }
  return enemies.at(-1)
}
