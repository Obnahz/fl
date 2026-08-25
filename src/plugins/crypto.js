// 使用 CryptoJS 进行数据加密和解密
import CryptoJS from 'crypto-js'

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
  if (data.saveVersion !== undefined && (!Number.isInteger(data.saveVersion) || data.saveVersion < 0 || data.saveVersion > 5)) return false
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

  return true
}
