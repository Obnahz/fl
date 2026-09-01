// 使用 CryptoJS 进行数据加密和解密
import CryptoJS from 'crypto-js'
import { STAGE_GOAL_VERSION, STAGE_PREPARATION_KEYS } from './stageGoals.js'

export const COMPACT_SAVE_PREFIX = 'XJ2C:'

const bytesToBase64 = bytes => {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

const base64ToBytes = value => {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

const compressText = async text => {
  if (typeof CompressionStream === 'undefined') return new TextEncoder().encode(text)
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

const decompressText = async bytes => {
  if (typeof DecompressionStream === 'undefined') return new TextDecoder().decode(bytes)
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new TextDecoder().decode(await new Response(stream).arrayBuffer())
}

// Export format: gzip the complete JSON snapshot before AES encryption. No state is discarded.
export const encryptCompactData = async data => {
  const json = JSON.stringify(data)
  const compressed = await compressText(json)
  const encrypted = CryptoJS.AES.encrypt(bytesToBase64(compressed), 'vue-idle-xiuxian').toString()
  return `${COMPACT_SAVE_PREFIX}${encrypted}`
}

export const decryptCompactData = async payload => {
  if (typeof payload !== 'string' || !payload.startsWith(COMPACT_SAVE_PREFIX)) return null
  const bytes = CryptoJS.AES.decrypt(payload.slice(COMPACT_SAVE_PREFIX.length), 'vue-idle-xiuxian')
  const compressedBase64 = bytes.toString(CryptoJS.enc.Utf8)
  if (!compressedBase64) return null
  return JSON.parse(await decompressText(base64ToBytes(compressedBase64)))
}

// 数据加密
export const encryptData = data => {
  try {
    const jsonStr = JSON.stringify(data)
    return CryptoJS.AES.encrypt(jsonStr, 'vue-idle-xiuxian').toString()
  } catch (error) {
    console.error('数据加密失败:', error)
    return null
  }
}

// 数据解密
export const decryptData = encryptedData => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, 'vue-idle-xiuxian')
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8)
    return JSON.parse(decryptedStr)
  } catch (error) {
    console.error('数据解密失败:', error)
    return null
  }
}

// 数据校验
export const validateData = data => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false

  const requiredFields = ['name', 'level', 'realm', 'cultivation', 'maxCultivation', 'spirit', 'baseAttributes']
  for (const field of requiredFields) {
    if (!Object.hasOwn(data, field)) return false
  }

  if (typeof data.name !== 'string' || typeof data.realm !== 'string') return false
  if (!Number.isInteger(data.level) || data.level < 1) return false
  if (!Number.isFinite(data.cultivation) || data.cultivation < 0) return false
  if (!Number.isFinite(data.maxCultivation) || data.maxCultivation <= 0) return false
  if (!Number.isFinite(data.spirit) || data.spirit < 0) return false
  if (data.saveVersion !== undefined && (!Number.isInteger(data.saveVersion) || data.saveVersion < 0 || data.saveVersion > 9)) return false
  if (data.currentHealth !== undefined && (!Number.isFinite(data.currentHealth) || data.currentHealth < 0)) return false
  if (data.equipmentPity !== undefined && (!Number.isInteger(data.equipmentPity) || data.equipmentPity < 0 || data.equipmentPity > 8)) return false

  const attributes = data.baseAttributes
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return false
  for (const field of ['attack', 'health', 'defense', 'speed']) {
    if (!Number.isFinite(attributes[field]) || attributes[field] < 0) return false
  }
  if (attributes.health <= 0) return false

  for (const field of ['items', 'herbs', 'pills', 'activeEffects']) {
    if (data[field] !== undefined && !Array.isArray(data[field])) return false
  }
  if (
    data.unlockedSkills !== undefined &&
    (!Array.isArray(data.unlockedSkills) || data.unlockedSkills.some(skillId => typeof skillId !== 'string'))
  ) {
    return false
  }
  if (
    data.activeTechniqueId !== undefined &&
    data.activeTechniqueId !== null &&
    typeof data.activeTechniqueId !== 'string'
  ) {
    return false
  }
  const isValidProgressMap = (value, minimum) =>
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([id, amount]) => id.length > 0 && Number.isInteger(amount) && amount >= minimum
    )
  if (data.techniqueLevels !== undefined && !isValidProgressMap(data.techniqueLevels, 1)) return false
  if (data.techniqueFragments !== undefined && !isValidProgressMap(data.techniqueFragments, 0)) return false

  if (data.stageGoal !== undefined) {
    const goal = data.stageGoal
    if (!goal || typeof goal !== 'object' || Array.isArray(goal)) return false
    if (goal.version !== undefined && goal.version !== STAGE_GOAL_VERSION) return false
    if (goal.level !== undefined && (!Number.isInteger(goal.level) || goal.level < 1)) return false
    if (goal.status !== undefined && !['preparing', 'ready', 'settled'].includes(goal.status)) return false
    const isStageMap = value =>
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      STAGE_PREPARATION_KEYS.every(key => value[key] === undefined || (Number.isFinite(value[key]) && value[key] >= 0))
    for (const field of ['preparations', 'costs', 'risks']) {
      if (goal[field] !== undefined && !isStageMap(goal[field])) return false
    }
    if (goal.lastAction !== undefined && goal.lastAction !== null && typeof goal.lastAction !== 'string') return false
    for (const field of ['outcome', 'lastOutcome']) {
      if (goal[field] === undefined || goal[field] === null) continue
      if (typeof goal[field] !== 'object' || Array.isArray(goal[field])) return false
      if (goal[field].success !== undefined && typeof goal[field].success !== 'boolean') return false
      if (goal[field].reason !== undefined && typeof goal[field].reason !== 'string') return false
      if (goal[field].settledAt !== undefined && !Number.isFinite(goal[field].settledAt)) return false
    }
  }

  return true
}
