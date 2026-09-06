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

locations.push(
  { id: 'thunder_cliff', name: '雷鸣天堑', description: '雷霆终年不息的险峻峡谷。', tier: 8, dangerChance: 0.43, damagePercent: [0.22, 0.4], minLevel: 64, spiritCost: 14000, rewards: [
    { type: 'spirit_stone', chance: 0.23, amount: [500, 900] }, { type: 'herb', chance: 0.27, amount: [130, 220] }, { type: 'cultivation', chance: 0.22, amount: [2600, 4600] }, { type: 'pill_fragment', chance: 0.18, amount: [30, 44] }, { type: 'equipment', chance: 0.1, amount: [1, 1] }
  ] },
  { id: 'void_palace', name: '虚空道宫', description: '漂浮于虚空乱流中的古老道宫。', tier: 9, dangerChance: 0.47, damagePercent: [0.24, 0.44], minLevel: 73, spiritCost: 19000, rewards: [
    { type: 'spirit_stone', chance: 0.23, amount: [700, 1200] }, { type: 'herb', chance: 0.27, amount: [160, 280] }, { type: 'cultivation', chance: 0.22, amount: [3600, 6200] }, { type: 'pill_fragment', chance: 0.18, amount: [36, 54] }, { type: 'equipment', chance: 0.1, amount: [1, 1] }
  ] },
  { id: 'dao_origin_sea', name: '道源海', description: '万道交汇的尽头，传闻藏有大罗机缘。', tier: 10, dangerChance: 0.52, damagePercent: [0.26, 0.48], minLevel: 82, spiritCost: 26000, rewards: [
    { type: 'spirit_stone', chance: 0.23, amount: [1000, 1800] }, { type: 'herb', chance: 0.27, amount: [200, 360] }, { type: 'cultivation', chance: 0.22, amount: [5000, 9000] }, { type: 'pill_fragment', chance: 0.18, amount: [44, 66] }, { type: 'equipment', chance: 0.1, amount: [1, 1] }
  ] }
)

// 计算实际获取概率（考虑幸运值）
locations.push(
  { id: 'daluo_skyline', name: '\u5927\u7f57\u5929\u95e8', description: '\u5927\u7f57\u4ed9\u57df\u8fb9\u7f18\u7684\u5929\u95e8\uff0c\u9053\u97f5\u4e0e\u96f7\u52ab\u4ea4\u7ec7\u3002', tier: 11, dangerChance: 0.56, damagePercent: [0.28, 0.5], minLevel: 94, spiritCost: 34000, rewards: [
    { type: 'spirit_stone', chance: 0.23, amount: [1400, 2400] }, { type: 'herb', chance: 0.27, amount: [240, 420] }, { type: 'cultivation', chance: 0.22, amount: [7000, 12000] }, { type: 'pill_fragment', chance: 0.18, amount: [52, 78] }, { type: 'equipment', chance: 0.1, amount: [1, 1] }
  ] },
  { id: 'origin_dao_temple', name: '\u9053\u6e90\u795e\u5bab', description: '\u5927\u7f57\u9053\u7edf\u7559\u4e0b\u7684\u795e\u5bab\uff0c\u53ea\u6709\u771f\u6b63\u7684\u9053\u5fc3\u624d\u80fd\u901a\u8fc7\u3002', tier: 12, dangerChance: 0.6, damagePercent: [0.3, 0.54], minLevel: 108, spiritCost: 44000, rewards: [
    { type: 'spirit_stone', chance: 0.23, amount: [1900, 3300] }, { type: 'herb', chance: 0.27, amount: [300, 520] }, { type: 'cultivation', chance: 0.22, amount: [9500, 16000] }, { type: 'pill_fragment', chance: 0.18, amount: [64, 96] }, { type: 'equipment', chance: 0.1, amount: [1, 1] }
  ] },
  { id: 'daluo_origin_gate', name: '\u5927\u7f57\u672c\u6e90\u5173', description: '\u4e07\u754c\u9053\u6e90\u7684\u5c3d\u5934\uff0c\u4e5f\u662f\u5927\u7f57\u5883\u6700\u540e\u7684\u5386\u7ec3\u5730\u3002', tier: 13, dangerChance: 0.64, damagePercent: [0.32, 0.58], minLevel: 122, spiritCost: 56000, rewards: [
    { type: 'spirit_stone', chance: 0.23, amount: [2600, 4600] }, { type: 'herb', chance: 0.27, amount: [380, 680] }, { type: 'cultivation', chance: 0.22, amount: [13000, 22000] }, { type: 'pill_fragment', chance: 0.18, amount: [80, 120] }, { type: 'equipment', chance: 0.1, amount: [1, 1] }
  ] }
)

export const calculateRewardChance = (baseChance, luck = 1) => {
  return Math.min(baseChance * luck, 1) // 确保概率不超过100%
}
