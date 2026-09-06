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

const highTierEnemies = [
  ['thunder_cliff', '\u96f7\u6e0a\u517d', 900, 66, 58, 40],
  ['void_palace', '\u865a\u7a7a\u9053\u5175', 1200, 78, 70, 48],
  ['dao_origin_sea', '\u9053\u6e90\u7075\u5c06', 1600, 92, 84, 56],
  ['daluo_skyline', '\u5929\u95e8\u5de1\u5b88', 2100, 108, 98, 64],
  ['origin_dao_temple', '\u795e\u5bab\u9053\u5f71', 2800, 126, 116, 72],
  ['daluo_origin_gate', '\u672c\u6e90\u5929\u5c06', 3700, 148, 136, 82]
]

highTierEnemies.forEach(([locationId, name, maxHealth, attack, defense, speed], index) => {
  enemyGroups[locationId] = [
    { id: `${locationId}_guardian`, name, type: 'normal', weight: 0.68, maxHealth, attack, defense, speed, critRate: 0.2 + index * 0.015, dodgeRate: 0.12 + index * 0.01, rewards: [{ type: 'cultivation', amount: 2200 + index * 1800 }] },
    { id: `${locationId}_elite`, name: `\u7cbe\u82f1${name}`, type: 'elite', weight: 0.32, maxHealth: Math.round(maxHealth * 1.35), attack: Math.round(attack * 1.22), defense: Math.round(defense * 1.18), speed: speed + 6, critRate: 0.25 + index * 0.015, dodgeRate: 0.15 + index * 0.01, rewards: [{ type: 'spirit_stone', amount: 1400 + index * 900 }] }
  ]
})

Object.assign(bossGroups, {
  thunder_cliff: { id: 'thunder_tribulation_avatar', name: '\u96f7\u52ab\u6cd5\u76f8', type: 'boss', chance: 0.15, maxHealth: 1900, attack: 105, defense: 88, speed: 58, critRate: 0.28, dodgeRate: 0.16, rewards: [{ type: 'spirit_stone', amount: 1800 }, { type: 'skill', skillId: 'heavenly_thunder_gate', duplicateFragments: 6 }] },
  void_palace: { id: 'void_palace_master', name: '\u865a\u7a7a\u5bab\u4e3b', type: 'boss', chance: 0.16, maxHealth: 2500, attack: 124, defense: 112, speed: 68, critRate: 0.3, dodgeRate: 0.2, rewards: [{ type: 'spirit_stone', amount: 2600 }, { type: 'skill', skillId: 'void_return_method', duplicateFragments: 5 }] },
  dao_origin_sea: { id: 'origin_sea_lord', name: '\u9053\u6e90\u6d77\u4e3b', type: 'boss', chance: 0.17, maxHealth: 3300, attack: 148, defense: 132, speed: 76, critRate: 0.32, dodgeRate: 0.21, rewards: [{ type: 'spirit_stone', amount: 3600 }, { type: 'skill', skillId: 'origin_sand_domain', duplicateFragments: 5 }] },
  daluo_skyline: { id: 'daluo_gatekeeper', name: '\u5927\u7f57\u5b88\u95e8\u4eba', type: 'boss', chance: 0.18, maxHealth: 4300, attack: 176, defense: 158, speed: 86, critRate: 0.35, dodgeRate: 0.23, rewards: [{ type: 'spirit_stone', amount: 5200 }, { type: 'skill', skillId: 'jade_phoenix_heart', duplicateFragments: 5 }] },
  origin_dao_temple: { id: 'origin_ancestor_shadow', name: '\u9053\u7956\u6b8b\u5f71', type: 'boss', chance: 0.19, maxHealth: 5700, attack: 210, defense: 190, speed: 96, critRate: 0.38, dodgeRate: 0.25, rewards: [{ type: 'spirit_stone', amount: 7600 }, { type: 'skill', skillId: 'origin_sand_domain', duplicateFragments: 6 }] },
  daluo_origin_gate: { id: 'origin_heavenly_lord', name: '\u672c\u6e90\u5929\u5c0a', type: 'boss', chance: 0.2, maxHealth: 7600, attack: 252, defense: 228, speed: 108, critRate: 0.42, dodgeRate: 0.28, rewards: [{ type: 'spirit_stone', amount: 11000 }, { type: 'skill', skillId: 'heavenly_thunder_gate', duplicateFragments: 7 }] }
})

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
