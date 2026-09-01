const qualityStoneMap = {
  mythic: 16,
  legendary: 11,
  epic: 7,
  rare: 4,
  uncommon: 2,
  common: 1
}

export const getEquipmentSalvageStones = equipment => qualityStoneMap[equipment?.quality] || 1

const handleEquipmentMessage = ({ data }) => {
  const { type, items = [], equipment } = data || {}
  if (type === 'single') {
    self.postMessage({
      type: 'single',
      stoneAmount: getEquipmentSalvageStones(equipment),
      itemId: equipment?.id
    })
  } else if (type === 'batch') {
    self.postMessage({
      type: 'batch',
      totalStones: items.reduce((total, item) => total + getEquipmentSalvageStones(item), 0),
      itemsToRemove: items.map(item => item.id),
      count: items.length
    })
  }
}

if (typeof self !== 'undefined') self.onmessage = handleEquipmentMessage
