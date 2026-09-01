import { defineStore } from 'pinia'
import { GameDB } from './db'
import { pillRecipes, tryCreatePill, calculatePillEffect } from '../plugins/pills'
import { encryptData, decryptData, validateData } from '../plugins/crypto'
import { MAX_SAVE_BYTES } from '../plugins/saveLimits'
import { getRealmName, getRealmLength } from '../plugins/realm'
import {
  calculateBreakthroughOutcome,
  drawSpiritualRoot,
  getSpiritualRoot,
  normalizeCharacterName
} from '../plugins/gameRules'
import { calculateRecovery, getRecoveryCost } from '../plugins/explorationRules'
import { getActiveEquipmentSetBonuses, getEquipmentSetState, getEquipmentStatDeltas } from '../plugins/equipmentRules'
import {
  STARTER_TECHNIQUE_ID,
  applyTechniqueUpgrade,
  grantTechniqueFragments,
  getTechniqueById,
  normalizeStoredSkillIds,
  normalizeTechniqueFragments,
  normalizeTechniqueLevels,
  normalizeUnlockedTechniques,
  selectTechniqueForCombat
} from '../plugins/techniques'
import { applyResourceSettlement, applySkillReward } from '../plugins/rewardRules'
import { buildDungeonPlayerCombatant, resolveAutoCombat } from '../plugins/combatRules'
import { getCultivationTelemetry, recordCultivationTelemetry } from '../plugins/cultivationTelemetry'
import { getEnemiesForLocation } from '../plugins/enemies'
import { locations } from '../plugins/locations'
import { herbs as herbDefinitions, getHerbValue } from '../plugins/herbs'
import {
  changeCaveFacility,
  claimCaveRewards,
  createCaveState,
  normalizeCaveState,
  settleCaveOffline
} from '../plugins/cave'
import {
  claimActivityChest,
  claimSevenDayGoal,
  claimTask,
  createDailyState,
  createSevenDayState,
  getDateKey,
  getRecommendedTask,
  normalizeDailyState,
  normalizeSevenDayState,
  recordSevenDayEvent,
  recordTaskEvent
} from '../plugins/tasks'
import {
  addSectContribution,
  changeCultivationDirection,
  claimSectCommission as claimSectCommissionRule,
  createSectOperationsState,
  createSectState,
  getActiveSectBonuses,
  joinSect,
  normalizeSectOperationsState,
  normalizeSectState,
  purchaseSectShopItem,
  refreshSectShop,
  startSectCommission as startSectCommissionRule,
  upgradeSect
} from '../plugins/sect'
import {
  createMarketState,
  getMarketOffers,
  normalizeMarketState,
  purchaseMarketOffer,
  refreshMarket
} from '../plugins/market'
import {
  createStageGoal,
  getStageGoalProgress,
  getStageStrategy,
  normalizeStageGoal,
  recordStagePreparation,
  restartStageGoal,
  settleStageGoal,
  summarizeStageOutcome
} from '../plugins/stageGoals'

const SAVE_VERSION = 9
let saveTimer = null
let savePromise = null

const getAvailableTaskEvents = player => {
  const events = ['cultivation', 'exploration', 'spirit']
  if (Array.isArray(player?.pillRecipes) && player.pillRecipes.length > 0) events.push('alchemy')
  if (
    (Array.isArray(player?.items) && player.items.some(item => item && item.type !== 'pill' && item.type !== 'pet')) ||
    Object.values(player?.equippedArtifacts || {}).some(Boolean)
  ) {
    events.push('equipment')
  }
  if ((Number(player?.level) || 1) >= 2) events.push('dungeon')
  return events
}

const getSectChallengeEnemy = player => {
  const location = [...locations]
    .filter(item => item.minLevel <= (Number(player?.level) || 1))
    .sort((left, right) => right.minLevel - left.minLevel)[0]
  if (!location) return null
  const enemies = getEnemiesForLocation(location.id)
  return enemies.find(enemy => enemy.type === 'elite') || enemies[0] || null
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    saveVersion: SAVE_VERSION,
    lastActiveAt: Date.now(),
    lastOfflineGain: 0,
    // 是否新玩家
    isNewPlayer: true,
    // GM模式开关
    isGMMode: false,
    // 主题设置
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    // 灵宠系统
    activePet: null, // 当前出战的灵宠
    petEssence: 0, // 灵宠精华
    petConfig: {
      rarityMap: {
        divine: { name: '神品', color: '#FF0000', probability: 0.02, essenceBonus: 50 },
        celestial: { name: '仙品', color: '#FFD700', probability: 0.08, essenceBonus: 30 },
        mystic: { name: '玄品', color: '#9932CC', probability: 0.15, essenceBonus: 20 },
        spiritual: { name: '灵品', color: '#1E90FF', probability: 0.25, essenceBonus: 10 },
        mortal: { name: '凡品', color: '#32CD32', probability: 0.5, essenceBonus: 5 }
      }
    },
    // 基础属性
    name: '无名修士',
    spiritualRoot: null,
    nameChangeCount: 0, // 道号修改次数
    level: 1, // 境界等级
    realm: '练气期一层', // 当前境界名称
    cultivation: 0, // 当前修为值
    maxCultivation: 100, // 当前境界最大修为值
    spirit: 0, // 灵力值
    spiritRate: 1, // 灵力获取倍率
    luck: 1, // 幸运值
    cultivationRate: 1, // 修炼速率
    herbRate: 1, // 灵草获取倍率
    alchemyRate: 1, // 炼丹成功率加成
    // 丹药系统
    pills: [], // 丹药库存
    pillFragments: {}, // 丹方残页（key为丹方ID，value为数量）
    pillRecipes: [], // 已获得的完整丹方
    activeEffects: [], // 当前生效的丹药效果列表
    pillsCrafted: 0, // 炼制丹药次数
    pillsConsumed: 0, // 服用丹药次数
    // 基础战斗属性
    baseAttributes: {
      attack: 10, // 攻击
      health: 100, // 生命
      defense: 5, // 防御
      speed: 10 // 速度
    },
    currentHealth: 100,
    // 战斗属性
    combatAttributes: {
      critRate: 0, // 暴击率
      comboRate: 0, // 连击率
      counterRate: 0, // 反击率
      stunRate: 0, // 眩晕率
      dodgeRate: 0, // 闪避率
      vampireRate: 0 // 吸血率
    },
    // 战斗抗性
    combatResistance: {
      critResist: 0, // 抗暴击
      comboResist: 0, // 抗连击
      counterResist: 0, // 抗反击
      stunResist: 0, // 抗眩晕
      dodgeResist: 0, // 抗闪避
      vampireResist: 0 // 抗吸血
    },
    // 特殊属性
    specialAttributes: {
      healBoost: 0, // 强化治疗
      critDamageBoost: 0, // 强化爆伤
      critDamageReduce: 0, // 弱化爆伤
      finalDamageBoost: 0, // 最终增伤
      finalDamageReduce: 0, // 最终减伤
      combatBoost: 0, // 战斗属性提升
      resistanceBoost: 0 // 战斗抗性提升
    },
    // 资源
    spiritStones: 0, // 灵石数量
    reinforceStones: 0, // 强化石数量
    refinementStones: 0, // 洗练石数量
    herbs: [], // 灵草库存
    items: [], // 物品库存
    artifacts: [], // 法宝装备
    // 装备栏位
    equippedArtifacts: {
      weapon: null, // 武器
      head: null, // 头部
      body: null, // 衣服
      legs: null, // 裤子
      feet: null, // 鞋子
      shoulder: null, // 肩甲
      hands: null, // 手套
      wrist: null, // 护腕
      necklace: null, // 项链
      ring1: null, // 戒指1
      ring2: null, // 戒指2
      belt: null, // 腰带
      artifact: null // 法宝
    },
    // 装备加成属性
    artifactBonuses: {
      // 基础属性加成
      attack: 0,
      health: 0,
      defense: 0,
      speed: 0,
      // 战斗属性加成
      critRate: 0,
      comboRate: 0,
      counterRate: 0,
      stunRate: 0,
      dodgeRate: 0,
      vampireRate: 0,
      // 抗性加成
      critResist: 0,
      comboResist: 0,
      counterResist: 0,
      stunResist: 0,
      dodgeResist: 0,
      vampireResist: 0,
      // 特殊属性加成
      healBoost: 0,
      critDamageBoost: 0,
      critDamageReduce: 0,
      finalDamageBoost: 0,
      finalDamageReduce: 0,
      combatBoost: 0,
      resistanceBoost: 0,
      // 修炼相关加成
      cultivationRate: 1,
      spiritRate: 1
    },
    // 统计数据
    totalCultivationTime: 0, // 总修炼时间
    breakthroughCount: 0, // 突破次数
    explorationCount: 0, // 探索次数
    equipmentPity: 0, // 普通历练收获的装备保底进度
    itemsFound: 0, // 获得物品数量
    eventTriggered: 0, // 触发事件次数
    unlockedPillRecipes: 0, // 解锁丹方数量
    // 秘境相关数据
    dungeonDifficulty: 1, // 难度选择
    dungeonHighestFloor: 0, // 最高通关层数
    dungeonHighestFloor_2: 0, // 最高通关层数
    dungeonHighestFloor_5: 0, // 最高通关层数
    dungeonHighestFloor_10: 0, // 最高通关层数
    dungeonHighestFloor_100: 0, // 最高通关层数
    dungeonLastFailedFloor: 0, // 最后失败层数
    dungeonTotalRuns: 0, // 总探索次数
    dungeonBossKills: 0, // Boss击杀数
    dungeonEliteKills: 0, // 精英击杀数
    dungeonTotalKills: 0, // 总击杀数
    dungeonDeathCount: 0, // 死亡次数
    dungeonTotalRewards: 0, // 获得奖励次数
    // 自动出售相关设置
    autoSellQualities: [], // 选中的装备品质
    autoReleaseRarities: [], // 选中的灵宠品质
    // 心愿单相关设置
    wishlistEnabled: false, // 心愿单开关
    selectedWishEquipQuality: null,
    selectedWishPetRarity: null,
    // 成就与解锁项
    unlockedRealms: ['练气一层'], // 已解锁境界
    unlockedLocations: ['新手村'], // 已解锁地点
    unlockedSkills: [STARTER_TECHNIQUE_ID], // 已解锁功法
    activeTechniqueId: STARTER_TECHNIQUE_ID,
    techniqueLevels: { [STARTER_TECHNIQUE_ID]: 1 },
    techniqueFragments: {},
    completedAchievements: [], // 已完成成就
    dailyState: createDailyState(),
    sevenDayState: createSevenDayState(),
    cosmeticUnlocks: [],
    sectState: createSectState(),
    sectOperationsState: createSectOperationsState(getDateKey()),
    marketState: createMarketState(getDateKey()),
    caveState: createCaveState(),
    stageGoal: createStageGoal(1)
  }),
  getters: {
    activeEquipmentSetBonuses() {
      return getActiveEquipmentSetBonuses(this.equippedArtifacts)
    },
    equipmentSetState() {
      return getEquipmentSetState(this.equippedArtifacts)
    },
    dailyRecommendedTask() {
      return getRecommendedTask(this.dailyState)
    },
    activeSectBonuses() {
      return getActiveSectBonuses(this.sectState)
    },
    effectiveSpiritRate() {
      return this.spiritRate * (this.activeSectBonuses.spiritRate || 1)
    },
    effectiveCultivationRate() {
      return this.cultivationRate * (this.activeSectBonuses.cultivationRate || 1)
    },
    effectiveAlchemyRate() {
      return this.alchemyRate * (this.activeSectBonuses.alchemySuccessRate || 1)
    },
    stageGoalProgress() {
      return getStageGoalProgress(this.stageGoal, {
        cultivation: this.cultivation,
        maxCultivation: this.maxCultivation
      })
    },
    stageOutcomeSummary() {
      return summarizeStageOutcome(this.stageGoal)
    },
    stageStrategy() {
      return getStageStrategy(this.stageGoal)
    },
    // 获取灵宠的属性加成
    getPetBonus() {
      if (!this.activePet)
        return {
          attack: 0,
          defense: 0,
          health: 0,
          critRate: 0,
          comboRate: 0,
          counterRate: 0,
          stunRate: 0,
          dodgeRate: 0,
          vampireRate: 0,
          critResist: 0,
          comboResist: 0,
          counterResist: 0,
          stunResist: 0,
          dodgeResist: 0,
          vampireResist: 0,
          healBoost: 0,
          critDamageBoost: 0,
          critDamageReduce: 0,
          finalDamageBoost: 0,
          finalDamageReduce: 0,
          combatBoost: 0,
          resistanceBoost: 0
        }
      const qualityBonusMap = {
        divine: 0.15, // 神品基础加成15%
        celestial: 0.12, // 仙品基础加成12%
        mystic: 0.09, // 玄品基础加成9%
        spiritual: 0.06, // 灵品基础加成6%
        mortal: 0.03 // 凡品基础加成3%
      }
      const starBonusPerQuality = {
        divine: 0.02, // 神品每星+2%
        celestial: 0.01, // 仙品每星+1%
        mystic: 0.01, // 玄品每星+1%
        spiritual: 0.01, // 灵品每星+1%
        mortal: 0.01 // 凡品每星+1%
      }
      const baseBonus = qualityBonusMap[this.activePet.rarity] || 0
      const starBonus = (this.activePet.star || 0) * (starBonusPerQuality[this.activePet.rarity] || 0)
      const levelBonus = ((this.activePet.level || 1) - 1) * (baseBonus * 0.1)
      const totalBonus = baseBonus + starBonus + levelBonus
      const phase = Math.floor((this.activePet.star || 0) / 5)
      const phaseBonus = phase * (baseBonus * 0.5)
      const finalBonus = totalBonus + phaseBonus
      const combatBonus = finalBonus * 0.5
      return {
        attack: finalBonus,
        defense: finalBonus,
        health: finalBonus,
        critRate: combatBonus,
        comboRate: combatBonus,
        counterRate: combatBonus,
        stunRate: combatBonus,
        dodgeRate: combatBonus,
        vampireRate: combatBonus,
        critResist: combatBonus,
        comboResist: combatBonus,
        counterResist: combatBonus,
        stunResist: combatBonus,
        dodgeResist: combatBonus,
        vampireResist: combatBonus,
        healBoost: combatBonus,
        critDamageBoost: combatBonus,
        critDamageReduce: combatBonus,
        finalDamageBoost: combatBonus,
        finalDamageReduce: combatBonus,
        combatBoost: combatBonus,
        resistanceBoost: combatBonus
      }
    }
  },
  actions: {
    // 更新HTML暗黑模式类
    updateHtmlDarkMode(isDarkMode) {
      const htmlEl = document.documentElement
      if (isDarkMode) {
        htmlEl.classList.add('dark')
      } else {
        htmlEl.classList.remove('dark')
      }
    },
    // 初始化玩家数据
    async initializePlayer() {
      try {
        const savedData = await GameDB.getData('playerData')
        if (savedData) {
          const decryptedData = decryptData(savedData)
          if (decryptedData && validateData(decryptedData)) {
            Object.assign(this.$state, this.migrateSave(decryptedData))
            this.applyOfflineProgress()
          } else {
            console.error('存档数据验证失败，使用初始数据')
          }
        }
      } catch (error) {
        console.error('加载存档失败:', error)
      }
      // 初始化主题设置
      this.isDarkMode = localStorage.getItem('darkMode') === 'true'
      // 同步暗黑模式状态到HTML标签
      this.updateHtmlDarkMode(this.isDarkMode)
    },
    // Keep old saves compatible as new systems add fields.
    migrateSave(data) {
      const level = Math.min(getRealmLength(), Math.max(1, Number(data.level) || 1))
      const realm = getRealmName(level)
      const maxHealth = Math.max(1, Number(data.baseAttributes?.health) || this.baseAttributes.health)
      const storedSkills = normalizeStoredSkillIds(data.unlockedSkills)
      const unlockedSkills = normalizeUnlockedTechniques(storedSkills).length
        ? storedSkills
        : [...storedSkills, STARTER_TECHNIQUE_ID]
      const techniqueLevels = normalizeTechniqueLevels(data.techniqueLevels)
      const techniqueFragments = normalizeTechniqueFragments(data.techniqueFragments)
      const normalizedHerbs = Array.isArray(data.herbs)
        ? data.herbs.map(herb => {
            const definition = herbDefinitions.find(item => item.id === herb?.id)
            if (!definition) return herb
            const quality = herb?.quality || 'common'
            return {
              ...definition,
              ...herb,
              quality,
              value: Number.isFinite(herb?.value)
                ? herb.value
                : getHerbValue(definition, quality)
            }
          })
        : []
      normalizeUnlockedTechniques(unlockedSkills).forEach(skillId => {
        if (!techniqueLevels[skillId]) techniqueLevels[skillId] = 1
      })
      const activeTechnique = selectTechniqueForCombat(
        unlockedSkills,
        data.activeTechniqueId,
        techniqueLevels
      )
      return {
        ...this.$state,
        ...data,
        herbs: normalizedHerbs,
        level,
        realm: realm.name,
        maxCultivation: realm.maxCultivation,
        currentHealth: Math.min(maxHealth, Math.max(0, Number(data.currentHealth ?? maxHealth) || 0)),
        equipmentPity: Math.min(8, Math.max(0, Math.floor(Number(data.equipmentPity) || 0))),
        equippedArtifacts: { ...this.equippedArtifacts, ...(data.equippedArtifacts || {}) },
        artifactBonuses: { ...this.artifactBonuses, ...(data.artifactBonuses || {}) },
        spiritualRoot: data.spiritualRoot || (data.isNewPlayer === false ? 'earth' : null),
        unlockedSkills,
        activeTechniqueId: activeTechnique?.id || STARTER_TECHNIQUE_ID,
        techniqueLevels,
        techniqueFragments,
        dailyState: normalizeDailyState(data.dailyState, getDateKey(), getAvailableTaskEvents(data)),
        sevenDayState: normalizeSevenDayState(data.sevenDayState, getDateKey()),
        cosmeticUnlocks: Array.isArray(data.cosmeticUnlocks)
          ? [...new Set(data.cosmeticUnlocks.filter(item => typeof item === 'string'))]
          : [],
        sectState: normalizeSectState(data.sectState),
        sectOperationsState: normalizeSectOperationsState(data.sectOperationsState, getDateKey()),
        marketState: normalizeMarketState(data.marketState, getDateKey()),
        caveState: normalizeCaveState(data.caveState, Number(data.lastActiveAt) || Date.now()),
        stageGoal: normalizeStageGoal(data.stageGoal, level, Number(data.lastActiveAt) || Date.now()),
        saveVersion: SAVE_VERSION,
        lastActiveAt: Number(data.lastActiveAt) || Date.now(),
        lastOfflineGain: 0
      }
    },
    drawSpiritualRoot() {
      return drawSpiritualRoot()
    },
    async createCharacter({ name, spiritualRoot }) {
      const normalizedName = normalizeCharacterName(name)
      const root = getSpiritualRoot(spiritualRoot)
      if (!root) throw new Error('请先测定灵根')

      this.name = normalizedName
      this.spiritualRoot = root.id
      this.cultivationRate = root.cultivationRate
      this.spiritRate = root.spiritRate
      this.luck = root.luck
      this.spirit = Math.max(this.spirit, 100)
      this.spiritStones = Math.max(this.spiritStones, 500)
      this.currentHealth = this.baseAttributes.health
      this.isNewPlayer = false
      await this.saveData({ immediate: true })
    },
    // Settle a bounded amount of spirit gained while the page was closed.
    applyOfflineProgress() {
      const now = Date.now()
      const settled = settleCaveOffline(this.caveState, {
        now,
        spiritRate: this.effectiveSpiritRate
      })
      this.caveState = settled.state
      this.lastOfflineGain = 0
      this.lastActiveAt = now
      this.saveData({ immediate: true })
      return settled
    },
    // 切换暗黑模式
    toggle() {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('darkMode', this.isDarkMode)
      // 更新html标签的class
      this.updateHtmlDarkMode(this.isDarkMode)
      this.saveData()
    },
    // 保存数据到IndexedDB
    async saveData({ immediate = false } = {}) {
      this.lastActiveAt = Date.now()
      this.caveState = {
        ...this.caveState,
        lastSettledAt: this.lastActiveAt
      }
      if (!immediate) {
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(() => this.saveData({ immediate: true }), 1500)
        return savePromise
      }
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      if (savePromise) {
        await savePromise
        return this.saveData({ immediate: true })
      }
      const snapshot = JSON.parse(JSON.stringify({ ...this.$state, saveVersion: SAVE_VERSION }))
      const encryptedData = encryptData(snapshot)
      if (!encryptedData) {
        console.error('数据加密失败')
        return null
      }
      savePromise = GameDB.setData('playerData', encryptedData)
        .catch(error => console.error('数据保存失败:', error))
        .finally(() => {
          savePromise = null
        })
      return savePromise
    },
    // 导出存档数据
    async exportData() {
      try {
        await this.saveData({ immediate: true })
        const data = await GameDB.getData('playerData')
        return data
      } catch (error) {
        console.error('导出存档失败:', error)
        throw error
      }
    },
    // 导入存档数据
    async importData(encryptedData) {
      if (typeof encryptedData !== 'string' || encryptedData.length === 0) throw new Error('存档文件为空')
      if (encryptedData.length > MAX_SAVE_BYTES) throw new Error('存档文件超过 8 MB 限制')

      const decryptedData = decryptData(encryptedData)
      if (!decryptedData || !validateData(decryptedData)) throw new Error('存档内容无效或已损坏')
      const migratedData = this.migrateSave(decryptedData)
      if (!validateData(migratedData)) throw new Error('存档迁移失败')
      const normalizedData = encryptData(migratedData)
      if (!normalizedData) throw new Error('存档处理失败')

      try {
        if (saveTimer) {
          clearTimeout(saveTimer)
          saveTimer = null
        }
        if (savePromise) await savePromise
        const previousData = await GameDB.getData('playerData')
        await GameDB.batchSet([
          ['playerDataBackup', previousData],
          ['playerData', normalizedData]
        ])
        Object.assign(this.$state, migratedData)
        this.updateHtmlDarkMode(this.isDarkMode)
      } catch (error) {
        console.error('导入存档失败:', error)
        throw error
      }
    },
    // 清除存档数据
    async clearData() {
      try {
        await GameDB.setData('playerData', null)
      } catch (error) {
        console.error('清除存档失败:', error)
        throw error
      }
    },
    // 获取灵力
    gainSpirit(amount) {
      const gain = amount * this.effectiveSpiritRate
      this.spirit += gain
      if (!this.isNewPlayer) this.recordTaskEvent('spirit', Math.max(1, Math.floor(gain)))
      this.saveData()
    },
    syncDailyState() {
      const next = normalizeDailyState(this.dailyState, getDateKey(), getAvailableTaskEvents(this))
      const changed = JSON.stringify(next) !== JSON.stringify(this.dailyState)
      this.dailyState = next
      if (changed) this.saveData({ immediate: true })
      return this.dailyState
    },
    recordTaskEvent(eventType, amount = 1) {
      this.syncDailyState()
      this.dailyState = recordTaskEvent(this.dailyState, eventType, amount)
      this.sevenDayState = recordSevenDayEvent(this.sevenDayState, eventType, amount, getDateKey())
      this.saveData()
      return this.dailyState
    },
    claimDailyTask(taskId) {
      this.syncDailyState()
      const result = claimTask(this.dailyState, taskId)
      if (!result.success) return result
      this.dailyState = result.state
      this.applyTaskReward(result.reward)
      this.saveData({ immediate: true })
      return result
    },
    claimDailyChest(threshold) {
      this.syncDailyState()
      const result = claimActivityChest(this.dailyState, threshold)
      if (!result.success) return result
      this.dailyState = result.state
      this.applyTaskReward(result.reward)
      this.saveData({ immediate: true })
      return result
    },
    claimSevenDayGoal(day) {
      const result = claimSevenDayGoal(this.sevenDayState, day, getDateKey())
      if (!result.success) return result
      this.sevenDayState = result.state
      this.applyTaskReward(result.reward)
      this.saveData({ immediate: true })
      return result
    },
    applyResourceReward(reward = {}) {
      const result = applyResourceSettlement({
        resources: {
          spirit: this.spirit,
          spiritStones: this.spiritStones,
          reinforceStones: this.reinforceStones,
          refinementStones: this.refinementStones,
          sectContribution: this.sectState.contribution
        },
        reward
      })
      this.spirit = result.resources.spirit
      this.spiritStones = result.resources.spiritStones
      this.reinforceStones = result.resources.reinforceStones
      this.refinementStones = result.resources.refinementStones
      if (result.applied.sectContribution) {
        this.sectState = addSectContribution(this.sectState, result.applied.sectContribution)
      }
      return {
        ...result,
        resources: { ...result.resources, sectContribution: this.sectState.contribution }
      }
    },
    payResourceCost(cost = {}) {
      const resourceKeys = ['spirit', 'spiritStones', 'reinforceStones', 'refinementStones']
      const normalized = {}
      for (const key of resourceKeys) {
        const amount = Math.max(0, Math.floor(Number(cost[key]) || 0))
        if (amount > this[key]) return false
        normalized[key] = amount
      }
      for (const key of resourceKeys) this[key] -= normalized[key]
      return true
    },
    recordStagePreparation(key, options = {}) {
      this.stageGoal = recordStagePreparation(this.stageGoal, key, options)
      this.saveData()
      return this.stageGoal
    },
    settleStageGoal({ success = false, reason = '', settledAt = Date.now() } = {}) {
      this.stageGoal = settleStageGoal(this.stageGoal, { success, reason, settledAt })
      this.saveData({ immediate: true })
      return this.stageGoal
    },
    applyTaskReward(reward = {}) {
      this.applyResourceReward(reward)
      if (typeof reward.cosmeticUnlock === 'string' && !this.cosmeticUnlocks.includes(reward.cosmeticUnlock)) {
        this.cosmeticUnlocks.push(reward.cosmeticUnlock)
      }
    },
    chooseSect(sectId) {
      const result = joinSect(this.sectState, sectId)
      if (!result.success) return result
      this.sectState = result.state
      this.recordStagePreparation('sect', { amount: 1, action: `加入宗门：${sectId}` })
      this.saveData({ immediate: true })
      return result
    },
    gainSectContribution(amount) {
      this.sectState = addSectContribution(this.sectState, amount)
      this.saveData()
      return this.sectState
    },
    upgradePlayerSect() {
      const result = upgradeSect(this.sectState)
      if (!result.success) return result
      this.sectState = result.state
      this.recordStagePreparation('sect', { amount: 1, cost: result.cost || 0, action: '提升宗门等级' })
      this.saveData({ immediate: true })
      return result
    },
    changeSectDirection(directionId, now = Date.now()) {
      const result = changeCultivationDirection(this.sectState, directionId, now)
      if (!result.success) return result
      this.sectState = result.state
      this.recordStagePreparation('sect', { amount: 1, cost: result.cost || 0, action: `切换修炼方向：${directionId}` })
      this.saveData({ immediate: true })
      return result
    },
    syncSectOperations(dateKey = getDateKey()) {
      const next = normalizeSectOperationsState(this.sectOperationsState, dateKey)
      const changed = JSON.stringify(next) !== JSON.stringify(this.sectOperationsState)
      this.sectOperationsState = next
      if (changed) this.saveData({ immediate: true })
      return this.sectOperationsState
    },
    startSectCommission(commissionId, now = Date.now()) {
      if (!this.sectState.sectId) return { success: false, reason: 'not_joined' }
      this.sectOperationsState = normalizeSectOperationsState(this.sectOperationsState, getDateKey())
      const result = startSectCommissionRule(
        this.sectOperationsState,
        commissionId,
        {
          spirit: this.spirit,
          spiritStones: this.spiritStones,
          reinforceStones: this.reinforceStones,
          refinementStones: this.refinementStones
        },
        now
      )
      if (!result.success) return result

      let combat = null
      if (commissionId === 'challenge') {
        const enemy = getSectChallengeEnemy(this)
        if (!enemy) return { ...result, success: false, reason: 'challenge_unavailable' }
        const technique = selectTechniqueForCombat(
          this.unlockedSkills,
          this.activeTechniqueId,
          this.techniqueLevels
        )
        const linked = buildDungeonPlayerCombatant({
          player: {
            name: this.name,
            level: this.level,
            realm: this.realm,
            currentHealth: this.currentHealth,
            baseAttributes: this.baseAttributes,
            combatAttributes: this.combatAttributes,
            combatResistance: this.combatResistance,
            specialAttributes: this.specialAttributes,
            activeEquipmentSetBonuses: this.activeEquipmentSetBonuses,
            getPetBonus: this.getPetBonus,
            activeEffects: this.activeEffects
          },
          technique
        })
        combat = resolveAutoCombat({ player: linked.stats, enemy, technique, maxRounds: 20 })
        this.currentHealth = combat.playerHealthAfter
        if (!this.payResourceCost(result.cost)) return { ...result, success: false, reason: 'insufficient_resources' }
        if (combat.outcome !== 'victory') {
          this.saveData({ immediate: true })
          return { ...result, success: false, reason: 'challenge_failed', combat }
        }
      } else if (!this.payResourceCost(result.cost)) {
        return { ...result, success: false, reason: 'insufficient_resources' }
      }

      this.sectOperationsState = result.state
      this.saveData({ immediate: true })
      return { ...result, combat }
    },
    claimSectCommission(commissionId, now = Date.now()) {
      this.sectOperationsState = normalizeSectOperationsState(this.sectOperationsState, getDateKey())
      const result = claimSectCommissionRule(this.sectOperationsState, commissionId, now)
      if (!result.success) return result
      this.sectOperationsState = result.state
      this.applyResourceReward(result.settlement.reward)
      this.saveData({ immediate: true })
      return result
    },
    refreshPlayerSectShop(dateKey = getDateKey()) {
      const result = refreshSectShop(this.sectOperationsState, this.sectState.contribution, dateKey)
      if (!result.success) return result
      this.sectOperationsState = result.state
      this.sectState = {
        ...this.sectState,
        contribution: this.sectState.contribution - result.contributionCost
      }
      this.saveData({ immediate: true })
      return result
    },
    buySectShopItem(itemId, dateKey = getDateKey()) {
      const result = purchaseSectShopItem(
        this.sectOperationsState,
        itemId,
        this.sectState.contribution,
        dateKey
      )
      if (!result.success) return result
      this.sectOperationsState = result.state
      this.sectState = {
        ...this.sectState,
        contribution: this.sectState.contribution - result.contributionCost
      }
      this.applyResourceReward(result.settlement.reward)
      this.saveData({ immediate: true })
      return result
    },
    syncMarket(dateKey = getDateKey()) {
      const next = normalizeMarketState(this.marketState, dateKey)
      const changed = JSON.stringify(next) !== JSON.stringify(this.marketState)
      this.marketState = next
      if (changed) this.saveData({ immediate: true })
      return this.marketState
    },
    getMarketOffers(dateKey = getDateKey()) {
      return getMarketOffers(this.syncMarket(dateKey), dateKey)
    },
    buyMarketOffer(offerId, dateKey = getDateKey()) {
      const state = this.syncMarket(dateKey)
      const result = purchaseMarketOffer(state, offerId, this.spiritStones, dateKey)
      if (!result.success) return result
      if (!this.payResourceCost({ spiritStones: result.price })) {
        return { ...result, success: false, reason: 'insufficient_spirit_stones' }
      }
      this.marketState = result.state
      this.applyResourceReward(result.settlement.reward)
      this.saveData({ immediate: true })
      return result
    },
    refreshMarket(dateKey = getDateKey()) {
      const state = this.syncMarket(dateKey)
      const result = refreshMarket(state, this.spiritStones, dateKey)
      if (!result.success) return result
      if (!this.payResourceCost({ spiritStones: result.price })) {
        return { ...result, success: false, reason: 'insufficient_spirit_stones' }
      }
      this.marketState = result.state
      this.saveData({ immediate: true })
      return result
    },
    changeCaveDuty(facilityId, now = Date.now()) {
      const result = changeCaveFacility(this.caveState, facilityId, {
        now,
        spiritRate: this.effectiveSpiritRate
      })
      if (!result.success) return result
      this.caveState = result.state
      this.recordStagePreparation('cave', { amount: 1, action: `洞府值守：${facilityId}` })
      this.saveData({ immediate: true })
      return result
    },
    settleCaveProgress(now = Date.now()) {
      const result = settleCaveOffline(this.caveState, {
        now,
        spiritRate: this.effectiveSpiritRate
      })
      this.caveState = result.state
      this.saveData({ immediate: true })
      return result
    },
    claimCavePending(now = Date.now()) {
      const settled = settleCaveOffline(this.caveState, {
        now,
        spiritRate: this.effectiveSpiritRate
      })
      const result = claimCaveRewards(settled.state, now)
      this.caveState = result.state
      if (!result.success) return result
      this.applyResourceReward(result.settlement.reward)
      this.recordStagePreparation('cave', { amount: 1, action: '领取洞府离线收益' })
      this.saveData({ immediate: true })
      return result
    },
    unlockTechnique(skillId, duplicateFragments = 0) {
      const result = applySkillReward({
        skillId,
        unlockedSkills: this.unlockedSkills,
        techniqueLevels: this.techniqueLevels,
        techniqueFragments: this.techniqueFragments,
        duplicateFragments
      })
      if (result.valid) {
        this.unlockedSkills = result.unlockedSkills
        this.techniqueLevels = result.techniqueLevels
        this.techniqueFragments = result.techniqueFragments
        this.saveData()
      }
      return result
    },
    gainTechniqueFragments(skillId, amount) {
      const result = grantTechniqueFragments({
        techniqueId: skillId,
        amount,
        techniqueFragments: this.techniqueFragments
      })
      if (result.valid) {
        this.techniqueFragments = result.techniqueFragments
        this.saveData()
      }
      return result
    },
    setActiveTechnique(skillId) {
      const technique = getTechniqueById(skillId)
      if (!technique || !this.unlockedSkills.includes(skillId)) return false
      this.activeTechniqueId = technique.id
      this.saveData()
      return true
    },
    upgradeTechnique(skillId) {
      if (!this.unlockedSkills.includes(skillId)) return { valid: false, upgraded: false }
      const result = applyTechniqueUpgrade({
        techniqueId: skillId,
        techniqueLevels: this.techniqueLevels,
        techniqueFragments: this.techniqueFragments
      })
      if (result.upgraded) {
        this.techniqueLevels = result.techniqueLevels
        this.techniqueFragments = result.techniqueFragments
        this.saveData()
      }
      return result
    },
    takeDamage(amount) {
      const damage = Math.max(0, Math.ceil(Number(amount) || 0))
      this.currentHealth = Math.max(0, Math.min(this.baseAttributes.health, this.currentHealth - damage))
      return damage
    },
    reconcileCurrentHealth() {
      this.currentHealth = Math.max(0, Math.min(Math.max(1, this.baseAttributes.health), this.currentHealth))
    },
    syncEquippedArtifactStats(artifact, previousStats) {
      const slot = artifact?.slot || artifact?.type
      if (!slot || this.equippedArtifacts[slot]?.id !== artifact.id) return false

      Object.entries(getEquipmentStatDeltas(previousStats, artifact.stats)).forEach(([key, delta]) => {
        if (this.artifactBonuses[key] === undefined) return
        this.artifactBonuses[key] += delta
        if (key in this.baseAttributes) {
          this.baseAttributes[key] += delta
        } else if (key in this.combatAttributes) {
          this.combatAttributes[key] = Math.min(1, Math.max(0, this.combatAttributes[key] + delta))
        } else if (key in this.combatResistance) {
          this.combatResistance[key] = Math.min(1, Math.max(0, this.combatResistance[key] + delta))
        } else if (key in this.specialAttributes) {
          this.specialAttributes[key] += delta
        }
      })
      this.reconcileCurrentHealth()
      return true
    },
    heal(amount) {
      const before = this.currentHealth
      this.currentHealth = Math.min(this.baseAttributes.health, before + Math.max(0, Math.ceil(Number(amount) || 0)))
      return this.currentHealth - before
    },
    recoverHealth() {
      const cost = getRecoveryCost(this.baseAttributes.health)
      if (this.currentHealth >= this.baseAttributes.health) {
        return { success: false, reason: 'full', cost: 0, heal: 0 }
      }
      if (this.spirit < cost) {
        return { success: false, reason: 'spirit', cost, heal: 0 }
      }
      const recovery = calculateRecovery({
        currentHealth: this.currentHealth,
        maxHealth: this.baseAttributes.health
      })
      this.spirit -= cost
      this.currentHealth = recovery.healthAfter
      this.saveData({ immediate: true })
      return { success: true, cost, heal: recovery.heal }
    },
    // 修炼增加修为
    cultivate(amount, { source = 'manual', spiritCost = 0, attempts = 1 } = {}) {
      // 确保amount是数字类型
      const numAmount = Number(String(amount).replace(/[^0-9.-]/g, '')) || 0
      this.cultivation = Number(String(this.cultivation).replace(/[^0-9.-]/g, '')) || 0
      const effectiveGain = numAmount * this.effectiveCultivationRate
      this.cultivation += effectiveGain
      this.recordStagePreparation('cultivation', {
        amount: Math.max(0.1, Number(attempts) || 1),
        cost: spiritCost,
        action: source === 'manual' ? '手动修炼' : source === 'auto' ? '自动修炼' : '闭关修炼'
      })
      this.totalCultivationTime += 1 // 增加修炼时间统计
      recordCultivationTelemetry({
        source,
        attempts,
        spiritSpent: spiritCost,
        rawGain: numAmount,
        effectiveGain
      })
      this.recordTaskEvent('cultivation')
      this.saveData()
    },
    getCultivationTelemetry() {
      return getCultivationTelemetry()
    },
    // 尝试突破
    tryBreakthrough(roll = Math.random()) {
      // 境界等级对应的境界名称和修为上限
      const realmsLength = getRealmLength()
      if (this.level >= realmsLength) {
        return { ready: true, success: false, atFinalRealm: true, chance: 0, loss: 0 }
      }
      const outcome = calculateBreakthroughOutcome({
        level: this.level,
        luck: this.luck,
        cultivation: this.cultivation,
        maxCultivation: this.maxCultivation,
        roll,
        chanceBonus: this.stageStrategy.chanceBonus,
        lossMultiplier: this.stageStrategy.lossMultiplier
      })
      if (!outcome.ready) {
        return outcome
      }
      this.cultivation = outcome.cultivationAfter
      if (!outcome.success) {
        const settledGoal = this.settleStageGoal({ success: false, reason: `${this.stageStrategy.name}突破失败，损失${outcome.loss}修为`, settledAt: Date.now() })
        this.stageGoal = restartStageGoal(settledGoal, this.level, Date.now())
        this.saveData({ immediate: true })
        return outcome
      }
      // 检查是否可以突破到下一个境界
      if (this.level < realmsLength) {
        // 更新境界信息
        this.level += 1
        const nextRealm = getRealmName(this.level)
        this.realm = nextRealm.name // 使用完整的境界名称（如：练气一层）
        this.maxCultivation = nextRealm.maxCultivation
        this.breakthroughCount += 1 // 增加突破次数
        // 解锁新境界
        if (!this.unlockedRealms.includes(nextRealm.name)) {
          this.unlockedRealms.push(nextRealm.name)
        }
        // 突破奖励
        this.spirit += 100 * this.level // 获得灵力奖励
        this.spiritRate *= 1.2 // 提升灵力获取倍率
        const settledGoal = this.settleStageGoal({ success: true, reason: `${this.stageStrategy.name}突破成功：${this.realm}`, settledAt: Date.now() })
        this.stageGoal = restartStageGoal(settledGoal, this.level, Date.now())
        this.saveData({ immediate: true })
        return { ...outcome, realm: this.realm }
      }
      return { ...outcome, success: false, atFinalRealm: true }
    },
    // 获得物品
    gainItem(item) {
      this.items.push(item)
      this.itemsFound++ // 增加获得物品统计
      this.saveData()
    },
    // 使用物品（丹药或灵宠）
    useItem(item) {
      if (item.type === 'pill') {
        return this.usePill(item)
      } else if (item.type === 'pet') {
        return this.usePet(item)
      }
      return { success: false, message: '无法使用该物品' }
    },
    // 卖出装备
    async sellEquipment(equipment) {
      const index = this.items.findIndex(i => i.id === equipment.id)
      if (index === -1) {
        return { success: false, message: '装备不存在' }
      }
      return new Promise(resolve => {
        const worker = new Worker(new URL('../workers/equipment.js', import.meta.url))
        worker.onmessage = e => {
          const { stoneAmount, itemId } = e.data
          this.reinforceStones += stoneAmount
          const index = this.items.findIndex(i => i.id === itemId)
          if (index > -1) {
            this.items.splice(index, 1)
          }
          this.recordStagePreparation('equipment', { amount: 1, action: '整理装备' })
          this.saveData()
          worker.terminate()
          resolve({ success: true, message: `成功卖出装备，获得${stoneAmount}个强化石` })
        }
        // 只传递必要的数据
        worker.postMessage({
          type: 'single',
          equipment: {
            id: equipment.id,
            quality: equipment.quality
          }
        })
      })
    },
    // 批量卖出装备
    async batchSellEquipments(quality = null, equipmentType = null) {
      return new Promise(resolve => {
        const worker = new Worker(new URL('../workers/equipment.js', import.meta.url))
        worker.onmessage = e => {
          const { totalStones, itemsToRemove, count } = e.data
          this.reinforceStones += totalStones
          this.items = this.items.filter(item => !itemsToRemove.includes(item.id))
          if (count > 0) {
            this.recordStagePreparation('equipment', {
              amount: count,
              action: `batch equipment整理:${count}`
            })
          }
          this.saveData()
          worker.terminate()
          resolve({
            success: true,
            message: `成功卖出${count}件装备，获得${totalStones}个强化石`
          })
        }
        // 将数据转换为纯对象数组
        const itemsToSell = this.items
          .filter(item => {
            if (!item || !item.type || item.type === 'pill' || item.type === 'pet') return false
            if (equipmentType && item.type !== equipmentType) return false
            if (quality && item.quality !== quality) return false
            return true
          })
          .map(item => ({
            id: item.id,
            type: item.type,
            quality: item.quality
          }))
        // 发送简化后的数据
        worker.postMessage({
          type: 'batch',
          items: JSON.parse(JSON.stringify(itemsToSell)),
          quality,
          equipmentType
        })
      })
    },
    // 使用丹药
    usePill(pill) {
      const now = Date.now()
      // 添加效果
      this.activeEffects.push({
        ...pill.effect,
        startTime: now,
        endTime: now + pill.effect.duration * 1000
      })
      // 移除已使用的丹药
      const index = this.items.findIndex(i => i.id === pill.id)
      if (index > -1) {
        this.items.splice(index, 1)
        this.pillsConsumed++
      }
      // 清理过期效果
      this.activeEffects = this.activeEffects.filter(effect => effect.endTime > now)
      this.saveData()
      return { success: true, message: '使用丹药成功' }
    },
    // 炼制丹药
    craftPill(recipeId) {
      const recipe = pillRecipes.find(r => r.id === recipeId)
      if (!recipe) return { success: false, message: '丹方不存在' }
      // 尝试炼制丹药
      const result = tryCreatePill(
        recipe,
        this.herbs,
        this,
        this.pillFragments[recipe.id] || 0,
        this.luck * this.alchemyRate
      )
      if (result.success) {
        // 消耗材料
        for (const material of recipe.materials) {
          for (let i = 0; i < material.count; i++) {
            const index = this.herbs.findIndex(h => h.id === material.herb)
            if (index > -1) {
              this.herbs.splice(index, 1)
            }
          }
        }
        // 计算丹药效果
        const effect = calculatePillEffect(recipe, this.level)
        // 添加到物品栏
        this.items.push({
          id: `${recipe.id}_${Date.now()}`,
          name: recipe.name,
          type: 'pill',
          description: recipe.description,
          effect: effect
        })
        this.pillsCrafted++
        this.recordStagePreparation('alchemy', { amount: 1, action: `炼制丹药：${recipe.name}` })
        this.saveData()
      }
      return result
    },
    // 使用灵宠（出战/召回）
    usePet(pet) {
      // 如果当前没有出战灵宠，直接出战新灵宠
      if (!this.activePet) {
        return this.deployPet(pet)
      }
      // 如果点击的是当前出战灵宠，则召回
      if (this.activePet.id === pet.id) {
        return this.recallPet()
      }
      // 如果点击的是其他灵宠，先召回当前灵宠，再出战新灵宠
      this.recallPet()
      return this.deployPet(pet)
    },
    // 召回灵宠
    recallPet() {
      if (!this.activePet) {
        return { success: false, message: '当前没有出战的灵宠' }
      }
      // 重置所有属性加成
      this.resetPetBonuses()
      this.activePet = null
      this.saveData()
      return { success: true, message: '召回成功' }
    },
    // 出战灵宠
    deployPet(pet) {
      // 如果已有灵宠出战，先召回
      if (this.activePet) {
        this.recallPet()
      }
      // 出战新灵宠
      this.activePet = pet
      // 应用灵宠属性加成
      this.applyPetBonuses()
      this.saveData()
      return { success: true, message: '出战成功' }
    },
    // 重置灵宠属性加成
    resetPetBonuses() {
      const petBonus = this.activePet.combatAttributes
      // 保存原始属性值
      const originalBaseAttributes = { ...this.baseAttributes }
      const originalCombatAttributes = { ...this.combatAttributes }
      const originalCombatResistance = { ...this.combatResistance }
      const originalSpecialAttributes = { ...this.specialAttributes }
      // 更新基础属性
      this.baseAttributes.attack = originalBaseAttributes.attack - petBonus.attack
      this.baseAttributes.defense = originalBaseAttributes.defense - petBonus.defense
      this.baseAttributes.health = originalBaseAttributes.health - petBonus.health
      this.baseAttributes.speed = originalBaseAttributes.speed - petBonus.speed
      // 更新战斗属性
      Object.keys(this.combatAttributes).forEach(key => {
        this.combatAttributes[key] = originalCombatAttributes[key] - (petBonus[key] || 0)
      })
      // 更新战斗抗性
      Object.keys(this.combatResistance).forEach(key => {
        this.combatResistance[key] = originalCombatResistance[key] - (petBonus[key] || 0)
      })
      // 更新特殊属性
      Object.keys(this.specialAttributes).forEach(key => {
        this.specialAttributes[key] = originalSpecialAttributes[key] - (petBonus[key] || 0)
      })
    },
    // 应用灵宠属性加成
    applyPetBonuses() {
      if (!this.activePet) return
      const petBonus = this.activePet.combatAttributes
      // 保存原始属性值
      const originalBaseAttributes = { ...this.baseAttributes }
      const originalCombatAttributes = { ...this.combatAttributes }
      const originalCombatResistance = { ...this.combatResistance }
      const originalSpecialAttributes = { ...this.specialAttributes }
      // 更新基础属性
      this.baseAttributes.attack = originalBaseAttributes.attack + petBonus.attack
      this.baseAttributes.defense = originalBaseAttributes.defense + petBonus.defense
      this.baseAttributes.health = originalBaseAttributes.health + petBonus.health
      this.baseAttributes.speed = originalBaseAttributes.speed + petBonus.speed
      // 更新战斗属性
      Object.keys(this.combatAttributes).forEach(key => {
        this.combatAttributes[key] = originalCombatAttributes[key] + (petBonus[key] || 0)
      })
      // 更新战斗抗性
      Object.keys(this.combatResistance).forEach(key => {
        this.combatResistance[key] = originalCombatResistance[key] + (petBonus[key] || 0)
      })
      // 更新特殊属性
      Object.keys(this.specialAttributes).forEach(key => {
        this.specialAttributes[key] = originalSpecialAttributes[key] + (petBonus[key] || 0)
      })
    },
    // 穿上装备
    equipArtifact(artifact, slot) {
      // 检查境界要求
      if (artifact.requiredRealm && this.level < artifact.requiredRealm) {
        return { success: false, message: '境界不足，无法装备此装备' }
      }
      // 先卸下当前装备
      if (this.equippedArtifacts[slot]) {
        this.unequipArtifact(slot)
      }
      // 从背包中移除装备
      const index = this.items.findIndex(item => item.id === artifact.id)
      if (index !== -1) {
        this.items.splice(index, 1)
      }
      // 穿上新装备
      this.equippedArtifacts[slot] = artifact
      this.recordTaskEvent('equipment')
      this.recordStagePreparation('equipment', {
        amount: 1,
        action: `equipment:${artifact.name || slot}`
      })
      // 应用装备加成
      if (artifact.stats) {
        Object.entries(artifact.stats).forEach(([key, value]) => {
          // 先更新artifactBonuses
          if (this.artifactBonuses[key] !== undefined) {
            this.artifactBonuses[key] += value
            // 根据属性类型应用到对应的属性组
            if (key in this.baseAttributes) {
              this.baseAttributes[key] += value
            } else if (key in this.combatAttributes) {
              this.combatAttributes[key] = Math.min(1, this.combatAttributes[key] + value)
            } else if (key in this.combatResistance) {
              this.combatResistance[key] = Math.min(1, this.combatResistance[key] + value)
            } else if (key in this.specialAttributes) {
              this.specialAttributes[key] += value
            }
          }
        })
      }
      this.reconcileCurrentHealth()
      this.saveData()
      return { success: true, message: '装备成功' }
    },
    // 卸下装备
    unequipArtifact(slot) {
      const artifact = this.equippedArtifacts[slot]
      if (artifact) {
        // 移除装备加成
        if (artifact.stats) {
          Object.entries(artifact.stats).forEach(([key, value]) => {
            if (this.artifactBonuses[key] !== undefined) {
              this.artifactBonuses[key] -= value
              // 从对应的属性组中移除加成
              if (key in this.baseAttributes) {
                this.baseAttributes[key] -= value
              } else if (key in this.combatAttributes) {
                this.combatAttributes[key] = Math.max(0, this.combatAttributes[key] - value)
              } else if (key in this.combatResistance) {
                this.combatResistance[key] = Math.max(0, this.combatResistance[key] - value)
              } else if (key in this.specialAttributes) {
                this.specialAttributes[key] -= value
              }
            }
          })
        }
        this.reconcileCurrentHealth()
        // 将装备返回到背包
        this.items.push(artifact)
        this.equippedArtifacts[slot] = null
        this.saveData()
        return true
      }
      return false
    },
    // 获取装备总加成
    getArtifactBonus(type) {
      return this.artifactBonuses[type] || 1
    },
    // 获得丹方残页
    gainPillFragment(recipeId) {
      if (!this.pillFragments[recipeId]) {
        this.pillFragments[recipeId] = 0
      }
      this.pillFragments[recipeId]++
      // 检查是否可以合成完整丹方
      const recipe = pillRecipes.find(r => r.id === recipeId)
      if (recipe && this.pillFragments[recipeId] >= recipe.fragmentsNeeded) {
        this.pillFragments[recipeId] -= recipe.fragmentsNeeded
        if (!this.pillRecipes.includes(recipeId)) {
          this.pillRecipes.push(recipeId)
          this.unlockedPillRecipes++
        }
      }
      this.saveData()
    },
    // 炼制丹药
    craftPill(recipeId) {
      const recipe = pillRecipes.find(r => r.id === recipeId)
      if (!recipe || !this.pillRecipes.includes(recipeId)) {
        return { success: false, message: '未掌握丹方' }
      }
      const fragments = this.pillFragments[recipeId] || 0
      const result = tryCreatePill(recipe, this.herbs, this, fragments, this.luck * this.effectiveAlchemyRate)
      if (result.success) {
        // 消耗材料
        recipe.materials.forEach(material => {
          for (let i = 0; i < material.count; i++) {
            const index = this.herbs.findIndex(h => h.id === material.herb)
            if (index > -1) {
              this.herbs.splice(index, 1)
            }
          }
        })
        // 创建丹药
        const effect = calculatePillEffect(recipe, this.level)
        const pill = {
          id: `${recipe.id}_${Date.now()}`,
          name: recipe.name,
          description: recipe.description,
          type: 'pill',
          effect
        }
        this.items.push(pill)
        this.pillsCrafted++
        this.recordTaskEvent('alchemy')
        this.recordStagePreparation('alchemy', {
          amount: 1,
          action: `alchemy:${recipe.name}`
        })
        this.saveData()
      }
      return result
    },
    // 使用丹药
    useItem(item) {
      if (item.type === 'pill') {
        const now = Date.now()
        // 添加效果
        this.activeEffects.push({
          ...item.effect,
          startTime: now,
          endTime: now + item.effect.duration * 1000
        })
        // 移除已使用的丹药
        const index = this.items.findIndex(i => i.id === item.id)
        if (index > -1) {
          this.items.splice(index, 1)
          this.pillsConsumed++
          this.recordStagePreparation('alchemy', { amount: 1, action: `服用丹药：${item.name}` })
        }
        // 清理过期效果
        this.activeEffects = this.activeEffects.filter(effect => effect.endTime > now)
        this.saveData()
        return true
      }
      return false
    },
    // 获取当前有效的丹药效果
    getActiveEffects() {
      const now = Date.now()
      return this.activeEffects.filter(effect => effect.endTime > now)
    },
    // 添加装备到背包
    addEquipment(equipment) {
      if (!this.items) {
        this.items = []
      }
      this.items.push(equipment)
      this.saveData()
    },
    // 升级灵宠
    upgradePet(pet, essenceCount) {
      if (this.petEssence < essenceCount) {
        return { success: false, message: '灵宠精华不足' }
      }
      // 消耗精华并提升等级
      this.petEssence -= essenceCount
      const petIndex = this.items.findIndex(item => item.id === pet.id)
      if (petIndex > -1) {
        const currentPet = this.items[petIndex]
        currentPet.level = (currentPet.level || 1) + 1
        // 根据品质和等级提升战斗属性
        const qualityMultiplier =
          {
            divine: 2.0,
            celestial: 1.8,
            mystic: 1.6,
            spiritual: 1.4,
            mortal: 1.2
          }[currentPet.rarity] || 1.2
        // 更新战斗属性
        currentPet.combatAttributes = {
          attack: Math.floor(currentPet.combatAttributes.attack * (1 + 0.01 * qualityMultiplier)),
          health: Math.floor(currentPet.combatAttributes.health * (1 + 0.01 * qualityMultiplier)),
          defense: Math.floor(currentPet.combatAttributes.defense * (1 + 0.01 * qualityMultiplier)),
          speed: Math.floor(currentPet.combatAttributes.speed * (1 + 0.01 * qualityMultiplier)),

          critRate: currentPet.combatAttributes.critRate + 0.01 * qualityMultiplier,
          comboRate: currentPet.combatAttributes.comboRate + 0.01 * qualityMultiplier,
          counterRate: currentPet.combatAttributes.counterRate + 0.01 * qualityMultiplier,
          stunRate: currentPet.combatAttributes.stunRate + 0.01 * qualityMultiplier,
          dodgeRate: currentPet.combatAttributes.dodgeRate + 0.01 * qualityMultiplier,
          vampireRate: currentPet.combatAttributes.vampireRate + 0.01 * qualityMultiplier,

          critResist: currentPet.combatAttributes.critResist + 0.01 * qualityMultiplier, // 抗暴击
          comboResist: currentPet.combatAttributes.comboResist + 0.01 * qualityMultiplier, // 抗连击
          counterResist: currentPet.combatAttributes.counterResist + 0.01 * qualityMultiplier, // 抗反击
          stunResist: currentPet.combatAttributes.stunResist + 0.01 * qualityMultiplier, // 抗眩晕
          dodgeResist: currentPet.combatAttributes.dodgeResist + 0.01 * qualityMultiplier, // 抗闪避
          vampireResist: currentPet.combatAttributes.vampireResist + 0.01 * qualityMultiplier, // 抗吸血

          healBoost: currentPet.combatAttributes.healBoost + 0.01 * qualityMultiplier,
          critDamageBoost: currentPet.combatAttributes.critDamageBoost + 0.01 * qualityMultiplier,
          critDamageReduce: currentPet.combatAttributes.critDamageReduce + 0.01 * qualityMultiplier,
          finalDamageBoost: currentPet.combatAttributes.finalDamageBoost + 0.01 * qualityMultiplier,
          finalDamageReduce: currentPet.combatAttributes.finalDamageReduce + 0.01 * qualityMultiplier,
          combatBoost: currentPet.combatAttributes.combatBoost + 0.01 * qualityMultiplier,
          resistanceBoost: currentPet.combatAttributes.resistanceBoost + 0.01 * qualityMultiplier
        }
        // 如果是当前出战的灵宠，重新应用属性加成
        if (this.activePet && this.activePet.id === pet.id) {
          this.applyPetBonuses()
        }
      }
      this.saveData()
      return { success: true, message: '升级成功' }
    },
    // 升星灵宠
    evolvePet(pet, foodPet) {
      // 检查是否是相同品质和名字的灵宠
      if (pet.rarity != foodPet.rarity || pet.name != foodPet.name) {
        return { success: false, message: '只能使用相同品质和名字的灵宠进行升星' }
      }
      const petIndex = this.items.findIndex(item => item.id === pet.id)
      const foodPetIndex = this.items.findIndex(item => item.id === foodPet.id)
      if (petIndex > -1 && foodPetIndex > -1) {
        // 返还作为升星材料的灵宠已消耗的精华
        const returnEssence = (foodPet.level - 1) * 10 // 假设每级消耗10精华
        this.petEssence += returnEssence
        // 移除作为材料的灵宠
        this.items.splice(foodPetIndex, 1)
        // 提升目标灵宠星级
        this.items[petIndex].star = (this.items[petIndex].star || 0) + 1
        this.saveData()
        return { success: true, message: '升星成功' }
      }
      return { success: false, message: '升星失败' }
    }
  }
})
