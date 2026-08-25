// 地点配置
export const locations = [
  {
    id: 'newbie_village',
    name: '新手村',
    description: '灵气稀薄的凡人聚集地，适合初入修仙之道的修士。',
    tier: 1,
    dangerChance: 0.16,
    damagePercent: [0.08, 0.16],
    minLevel: 1,
    spiritCost: 50,
    rewards: [
      { type: 'spirit_stone', chance: 0.27, amount: [1, 3] },
      { type: 'herb', chance: 0.27, amount: [1, 2] },
      { type: 'cultivation', chance: 0.18, amount: [5, 10] },
      { type: 'pill_fragment', chance: 0.18, amount: [1, 1] },
      { type: 'equipment', chance: 0.1, amount: [1, 1] }
    ]
  },
  // 筑基期地点
  {
    id: 'celestial_mountain',
    name: '天阙峰',
    description: '云雾缭绕的仙山，传说是远古仙人讲道之地。',
    tier: 2,
    dangerChance: 0.2,
    damagePercent: [0.1, 0.2],
    minLevel: 10,
    spiritCost: 1500,
    rewards: [
      { type: 'spirit_stone', chance: 0.23, amount: [30, 60] },
      { type: 'herb', chance: 0.27, amount: [15, 25] },
      { type: 'cultivation', chance: 0.22, amount: [150, 300] },
      { type: 'pill_fragment', chance: 0.18, amount: [6, 10] },
      { type: 'equipment', chance: 0.1, amount: [1, 1] }
    ]
  },
  // 金丹期地点
  {
    id: 'phoenix_valley',
    name: '凤凰谷',
    description: '常年被火焰环绕的神秘山谷，据说有凤凰遗留的道韵。',
    tier: 3,
    dangerChance: 0.23,
    damagePercent: [0.12, 0.23],
    minLevel: 19,
    spiritCost: 2000,
    rewards: [
      { type: 'spirit_stone', chance: 0.23, amount: [50, 100] },
      { type: 'herb', chance: 0.27, amount: [20, 35] },
      { type: 'cultivation', chance: 0.22, amount: [250, 500] },
      { type: 'pill_fragment', chance: 0.18, amount: [8, 12] },
      { type: 'equipment', chance: 0.1, amount: [1, 1] }
    ]
  },
  // 元婴期地点
  {
    id: 'dragon_abyss',
    name: '龙渊',
    description: '深不见底的神秘深渊，蕴含远古真龙的气息。',
    tier: 4,
    dangerChance: 0.27,
    damagePercent: [0.14, 0.26],
    minLevel: 28,
    spiritCost: 3000,
    rewards: [
      { type: 'spirit_stone', chance: 0.23, amount: [80, 150] },
      { type: 'herb', chance: 0.27, amount: [30, 50] },
      { type: 'cultivation', chance: 0.22, amount: [400, 800] },
      { type: 'pill_fragment', chance: 0.18, amount: [10, 15] },
      { type: 'equipment', chance: 0.1, amount: [1, 1] }
    ]
  },
  // 化神期地点
  {
    id: 'immortal_realm',
    name: '仙界入口',
    description: '传说中通往仙界的神秘之地，充满无尽机缘。',
    tier: 5,
    dangerChance: 0.32,
    damagePercent: [0.16, 0.3],
    minLevel: 37,
    spiritCost: 5000,
    rewards: [
      { type: 'spirit_stone', chance: 0.23, amount: [150, 300] },
      { type: 'herb', chance: 0.27, amount: [50, 100] },
      { type: 'cultivation', chance: 0.22, amount: [800, 1500] },
      { type: 'pill_fragment', chance: 0.18, amount: [15, 20] },
      { type: 'equipment', chance: 0.1, amount: [1, 1] }
    ]
  },
  {
    id: 'nether_river',
    name: '\u4e5d\u5e7d\u51a5\u6cb3',
    description: '\u9634\u6c14\u6c89\u964d\u7684\u5e7d\u51a5\u6c34\u57df\uff0c\u9002\u5408\u5316\u795e\u671f\u540e\u671f\u4fee\u58eb\u5386\u7ec3\u3002',
    tier: 6,
    dangerChance: 0.36,
    damagePercent: [0.18, 0.34],
    minLevel: 46,
    spiritCost: 7000,
    rewards: [
      { type: 'spirit_stone', chance: 0.23, amount: [220, 420] },
      { type: 'herb', chance: 0.27, amount: [70, 130] },
      { type: 'cultivation', chance: 0.22, amount: [1200, 2200] },
      { type: 'pill_fragment', chance: 0.18, amount: [18, 26] },
      { type: 'equipment', chance: 0.1, amount: [1, 1] }
    ]
  },
  {
    id: 'star_sea_ruins',
    name: '\u661f\u6d77\u9057\u5e9c',
    description: '\u7fa4\u661f\u5760\u843d\u540e\u7684\u4e0a\u53e4\u9057\u5e9c\uff0c\u53ea\u6709\u8fd4\u865a\u671f\u4fee\u58eb\u624d\u80fd\u63a2\u5165\u3002',
    tier: 7,
    dangerChance: 0.4,
    damagePercent: [0.2, 0.38],
    minLevel: 55,
    spiritCost: 10000,
    rewards: [
      { type: 'spirit_stone', chance: 0.23, amount: [360, 680] },
      { type: 'herb', chance: 0.27, amount: [100, 180] },
      { type: 'cultivation', chance: 0.22, amount: [1800, 3200] },
      { type: 'pill_fragment', chance: 0.18, amount: [24, 36] },
      { type: 'equipment', chance: 0.1, amount: [1, 1] }
    ]
  }
]

// 计算实际获取概率（考虑幸运值）
export const calculateRewardChance = (baseChance, luck = 1) => {
  return Math.min(baseChance * luck, 1) // 确保概率不超过100%
}
