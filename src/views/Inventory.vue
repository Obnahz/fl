<template>
  <n-layout>
    <n-layout-header bordered>
      <n-page-header>
        <template #title>背包</template>
      </n-page-header>
    </n-layout-header>
    <n-layout-content>
      <n-card :bordered="false">
        <n-tabs type="line">
          <n-tab-pane name="equipment" tab="装备">
            <section class="equipment-summary" aria-label="装备总览">
              <div>
                <n-text depth="3">已装备</n-text>
                <strong>{{ equippedCount }} / {{ Object.keys(equipmentTypes).length }}</strong>
              </div>
              <div>
                <n-text depth="3">装备战力</n-text>
                <strong>{{ equippedScore }}</strong>
              </div>
              <div>
                <n-text depth="3">行囊装备</n-text>
                <strong>{{ inventoryEquipmentCount }}</strong>
              </div>
            </section>
            <n-space class="set-summary" align="center" size="small" wrap>
              <n-text depth="3">套装：</n-text>
              <n-tag
                v-for="set in activeSetStates"
                :key="set.id"
                size="small"
                :style="{ color: set.color }"
              >
                {{ set.name }} {{ set.count }} 件
              </n-tag>
              <n-text depth="3" v-if="activeSetStates.length === 0">尚未形成套装</n-text>
            </n-space>
            <n-grid responsive="screen" cols="1 s:2 m:3" :x-gap="12" :y-gap="8">
              <n-grid-item v-for="(name, type) in equipmentTypes" :key="type">
                <n-card size="small" hoverable @click="showEquipmentList(type)">
                  <template #header>
                    <n-space justify="space-between">
                      <span>{{ name }}</span>
                      <n-button
                        size="small"
                        type="error"
                        @click.stop="unequipItem(type)"
                        v-if="playerStore.equippedArtifacts[type]"
                      >
                        卸下
                      </n-button>
                    </n-space>
                  </template>
                  <n-space vertical size="small" v-if="playerStore.equippedArtifacts[type]">
                    <n-tag
                      size="small"
                      :style="{ color: playerStore.equippedArtifacts[type].qualityInfo?.color }"
                    >
                      {{ playerStore.equippedArtifacts[type].qualityInfo?.name || '装备' }}
                    </n-tag>
                    <strong>{{ playerStore.equippedArtifacts[type].name }}</strong>
                    <n-text depth="3">战力 {{ getEquipmentScore(playerStore.equippedArtifacts[type]) }}</n-text>
                  </n-space>
                  <n-text depth="3" v-else>未装备</n-text>
                  <template #footer>
                    <n-space justify="space-between">
                      <n-text depth="3">{{ getEquipmentStatSummary(playerStore.equippedArtifacts[type]) }}</n-text>
                      <n-button
                        size="small"
                        type="info"
                        @click.stop="showEquipmentDetails(playerStore.equippedArtifacts[type])"
                        v-if="playerStore.equippedArtifacts[type]"
                      >
                        详细
                      </n-button>
                    </n-space>
                  </template>
                </n-card>
              </n-grid-item>
            </n-grid>
          </n-tab-pane>
          <n-tab-pane name="herbs" tab="灵草">
            <n-grid :cols="2" :x-gap="12" :y-gap="8" v-if="groupedHerbs.length">
              <n-grid-item v-for="herb in groupedHerbs" :key="herb.id">
                <n-card hoverable>
                  <template #header>
                    <n-space justify="space-between">
                      <span>{{ herb.name }}({{ herb.count }})</span>
                    </n-space>
                  </template>
                  <p>{{ herb.description }}</p>
                </n-card>
              </n-grid-item>
            </n-grid>
            <n-empty v-else />
          </n-tab-pane>
          <n-tab-pane name="pills" tab="丹药">
            <n-grid :cols="2" :x-gap="12" :y-gap="8" v-if="groupedPills.length">
              <n-grid-item v-for="pill in groupedPills" :key="pill.id">
                <n-card hoverable>
                  <template #header>
                    <n-space justify="space-between">
                      <span>{{ pill.name }}({{ pill.count }})</span>
                      <n-button size="small" type="primary" @click="usePill(pill)">服用</n-button>
                    </n-space>
                  </template>
                  <p>{{ pill.description }}</p>
                </n-card>
              </n-grid-item>
            </n-grid>
            <n-empty v-else />
          </n-tab-pane>
          <n-tab-pane name="formulas" tab="丹方">
            <n-tabs type="segment">
              <n-tab-pane name="complete" tab="完整丹方">
                <n-grid :cols="2" :x-gap="12" :y-gap="8" v-if="groupedFormulas.complete.length">
                  <n-grid-item v-for="formula in groupedFormulas.complete" :key="formula.id">
                    <n-card hoverable>
                      <template #header>
                        <n-space justify="space-between">
                          <span>{{ formula.name }}</span>
                          <n-space>
                            <n-tag type="success" size="small">完整</n-tag>
                            <n-tag type="info" size="small">{{ pillGrades[formula.grade].name }}</n-tag>
                            <n-tag type="warning" size="small">{{ pillTypes[formula.type].name }}</n-tag>
                          </n-space>
                        </n-space>
                      </template>
                      <p>{{ formula.description }}</p>
                    </n-card>
                  </n-grid-item>
                </n-grid>
                <n-empty v-else />
              </n-tab-pane>
              <n-tab-pane name="incomplete" tab="残缺丹方">
                <n-grid :cols="2" :x-gap="12" :y-gap="8" v-if="groupedFormulas.incomplete.length">
                  <n-grid-item v-for="formula in groupedFormulas.incomplete" :key="formula.id">
                    <n-card hoverable>
                      <template #header>
                        <n-space justify="space-between">
                          <span>{{ formula.name }}</span>
                          <n-space>
                            <n-tag type="warning" size="small">残缺</n-tag>
                            <n-tag type="info" size="small">{{ pillGrades[formula.grade].name }}</n-tag>
                            <n-tag type="warning" size="small">{{ pillTypes[formula.type].name }}</n-tag>
                          </n-space>
                        </n-space>
                      </template>
                      <p>{{ formula.description }}</p>
                      <n-progress
                        type="line"
                        :percentage="Number(((formula.fragments / formula.fragmentsNeeded) * 100).toFixed(2))"
                        :show-indicator="true"
                        indicator-placement="inside"
                      >
                        收集进度: {{ formula.fragments }}/{{ formula.fragmentsNeeded }}
                      </n-progress>
                    </n-card>
                  </n-grid-item>
                </n-grid>
                <n-empty v-else />
              </n-tab-pane>
            </n-tabs>
          </n-tab-pane>
          <n-tab-pane name="pets" tab="灵宠">
            <n-space style="margin-bottom: 16px">
              <n-select
                v-model:value="selectedRarityToRelease"
                :options="options"
                placeholder="选择放生品阶"
                style="width: 150px"
              />
              <n-button
                @click="showBatchReleaseConfirm = true"
                :disabled="!playerStore.items.filter(item => item.type === 'pet').length"
              >
                一键放生
              </n-button>
            </n-space>
            <n-modal v-model:show="showBatchReleaseConfirm" preset="dialog" title="批量放生确认" style="width: 600px">
              <p>
                确定要放生{{
                  selectedRarityToRelease === 'all' ? '所有' : petRarities[selectedRarityToRelease].name
                }}品阶的未出战灵宠吗？此操作不可撤销。
              </p>
              <n-space justify="end" style="margin-top: 16px">
                <n-button size="small" @click="showBatchReleaseConfirm = false">取消</n-button>
                <n-button size="small" type="error" @click="batchReleasePets">确认放生</n-button>
              </n-space>
            </n-modal>
            <n-pagination
              v-if="filteredPets.length > 12"
              v-model:page="currentPage"
              :page-size="pageSize"
              :item-count="filteredPets.length"
              @update:page-size="onPageSizeChange"
              :page-slot="7"
            />
            <n-grid v-if="displayPets.length" :cols="2" :x-gap="12" :y-gap="8" style="margin-top: 16px">
              <n-grid-item v-for="pet in displayPets" :key="pet.id">
                <n-card hoverable>
                  <template #header>
                    <n-space justify="space-between">
                      <span>{{ pet.name }}</span>
                      <n-button size="small" type="primary" @click="useItem(pet)">
                        {{ playerStore.activePet?.id === pet.id ? '召回' : '出战' }}
                      </n-button>
                    </n-space>
                  </template>
                  <p>{{ pet.description }}</p>
                  <n-space vertical>
                    <n-tag :style="{ color: petRarities[pet.rarity].color }">
                      {{ petRarities[pet.rarity].name }}
                    </n-tag>
                    <n-space justify="space-between">
                      <n-text>等级: {{ pet.level || 1 }}</n-text>
                      <n-text>星级: {{ pet.star || 0 }}</n-text>
                      <n-button size="small" @click="showPetDetails(pet)">详情</n-button>
                    </n-space>
                  </n-space>
                </n-card>
              </n-grid-item>
            </n-grid>
            <n-empty v-else />
          </n-tab-pane>
        </n-tabs>
      </n-card>
    </n-layout-content>
  </n-layout>
  <!-- 灵宠详情弹窗 -->
  <n-modal v-model:show="showPetModal" preset="dialog" title="灵宠详情" style="width: 600px">
    <template v-if="selectedPet">
      <n-descriptions bordered>
        <n-descriptions-item label="名称">{{ selectedPet.name }}</n-descriptions-item>
        <n-descriptions-item label="品质">
          <n-tag :style="{ color: petRarities[selectedPet.rarity].color }">
            {{ petRarities[selectedPet.rarity].name }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="等级">{{ selectedPet.level || 1 }}</n-descriptions-item>
        <n-descriptions-item label="星级">{{ selectedPet.star || 0 }}</n-descriptions-item>
        <n-descriptions-item label="境界">{{ Math.floor((selectedPet.star || 0) / 5) }}阶</n-descriptions-item>
      </n-descriptions>
      <n-divider>属性加成</n-divider>
      <n-descriptions bordered>
        <n-descriptions-item label="攻击加成">
          +{{ (getPetBonus(selectedPet).attack * 100).toFixed(1) }}%
        </n-descriptions-item>
        <n-descriptions-item label="防御加成">
          +{{ (getPetBonus(selectedPet).defense * 100).toFixed(1) }}%
        </n-descriptions-item>
        <n-descriptions-item label="生命加成">
          +{{ (getPetBonus(selectedPet).health * 100).toFixed(1) }}%
        </n-descriptions-item>
      </n-descriptions>
      <n-divider>灵宠属性</n-divider>
      <n-collapse>
        <n-collapse-item title="展开" name="1">
          <n-divider>基础属性</n-divider>
          <n-descriptions bordered :column="2">
            <n-descriptions-item label="攻击力">{{ selectedPet.combatAttributes?.attack || 0 }}</n-descriptions-item>
            <n-descriptions-item label="生命值">{{ selectedPet.combatAttributes?.health || 0 }}</n-descriptions-item>
            <n-descriptions-item label="防御力">{{ selectedPet.combatAttributes?.defense || 0 }}</n-descriptions-item>
            <n-descriptions-item label="速度">{{ selectedPet.combatAttributes?.speed || 0 }}</n-descriptions-item>
          </n-descriptions>
          <n-divider>战斗属性</n-divider>
          <n-descriptions bordered :column="3">
            <n-descriptions-item label="暴击率">
              {{ ((selectedPet.combatAttributes?.critRate || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="连击率">
              {{ ((selectedPet.combatAttributes?.comboRate || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="反击率">
              {{ ((selectedPet.combatAttributes?.counterRate || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="眩晕率">
              {{ ((selectedPet.combatAttributes?.stunRate || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="闪避率">
              {{ ((selectedPet.combatAttributes?.dodgeRate || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="吸血率">
              {{ ((selectedPet.combatAttributes?.vampireRate || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
          </n-descriptions>
          <n-divider>战斗抗性</n-divider>
          <n-descriptions bordered :column="3">
            <n-descriptions-item label="抗暴击">
              {{ ((selectedPet.combatAttributes?.critResist || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="抗连击">
              {{ ((selectedPet.combatAttributes?.comboResist || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="抗反击">
              {{ ((selectedPet.combatAttributes?.counterResist || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="抗眩晕">
              {{ ((selectedPet.combatAttributes?.stunResist || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="抗闪避">
              {{ ((selectedPet.combatAttributes?.dodgeResist || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="抗吸血">
              {{ ((selectedPet.combatAttributes?.vampireResist || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
          </n-descriptions>
          <n-divider>特殊属性</n-divider>
          <n-descriptions bordered :column="3">
            <n-descriptions-item label="强化治疗">
              {{ ((selectedPet.combatAttributes?.healBoost || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="强化爆伤">
              {{ ((selectedPet.combatAttributes?.critDamageBoost || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="弱化爆伤">
              {{ ((selectedPet.combatAttributes?.critDamageReduce || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="最终增伤">
              {{ ((selectedPet.combatAttributes?.finalDamageBoost || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="最终减伤">
              {{ ((selectedPet.combatAttributes?.finalDamageReduce || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="战斗属性提升">
              {{ ((selectedPet.combatAttributes?.combatBoost || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
            <n-descriptions-item label="战斗抗性提升">
              {{ ((selectedPet.combatAttributes?.resistanceBoost || 0) * 100).toFixed(1) }}%
            </n-descriptions-item>
          </n-descriptions>
        </n-collapse-item>
      </n-collapse>
      <n-divider>操作</n-divider>
      <n-space vertical>
        <n-space justify="space-between">
          <span>升级（消耗{{ getUpgradeCost(selectedPet) }} / {{ playerStore.petEssence }}灵宠精华）</span>
          <n-button size="small" type="primary" @click="upgradePet(selectedPet)" :disabled="!canUpgrade(selectedPet)">
            升级
          </n-button>
        </n-space>
        <n-space justify="space-between">
          <span>升星（需要相同品质和名字的灵宠）</span>
          <n-select
            v-model:value="selectedFoodPet"
            :options="getAvailableFoodPets(selectedPet)"
            placeholder="选择升星材料"
            style="width: 200px"
          />
          <n-button size="small" type="warning" @click="evolvePet(selectedPet)" :disabled="!selectedFoodPet">
            升星
          </n-button>
        </n-space>
        <n-space justify="space-between">
          <span>放生灵宠（不会返还已消耗的道具）</span>
          <n-button size="small" type="error" @click="confirmReleasePet(selectedPet)">放生灵宠</n-button>
          <n-modal v-model:show="showReleaseConfirm" preset="dialog" title="灵宠放生" style="width: 600px">
            <template v-if="petToRelease">
              <p>确定要放生 {{ petToRelease.name }} 吗？此操作不可撤销，且不会返还已消耗的道具。</p>
              <n-space justify="end" style="margin-top: 16px">
                <n-button size="small" @click="cancelReleasePet">取消</n-button>
                <n-button size="small" type="error" @click="releasePet">确认放生</n-button>
              </n-space>
            </template>
          </n-modal>
        </n-space>
      </n-space>
    </template>
  </n-modal>
  <!-- 装备列表弹窗 -->
  <n-modal
    v-model:show="showEquipmentModal"
    preset="dialog"
    :title="`${equipmentTypes[selectedEquipmentType]}列表`"
    style="width: min(800px, calc(100vw - 24px))"
  >
    <n-space vertical>
      <n-space justify="space-between">
        <n-select v-model:value="selectedQuality" :options="qualityOptions" style="width: 150px" />
        <n-button type="warning" :disabled="filteredEquipmentList.length === 0" @click="batchSellEquipments">
          一键卖出
        </n-button>
      </n-space>
      <n-pagination
        v-model:page="currentEquipmentPage"
        :page-size="equipmentPageSize"
        :item-count="filteredEquipmentList.length"
        v-if="filteredEquipmentList.length > equipmentPageSize"
        @update:page-size="onEquipmentPageSizeChange"
        :page-slot="7"
      />
      <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="8" v-if="equipmentList.length">
        <n-grid-item v-for="equipment in equipmentList" :key="equipment.id" @click="showEquipmentDetails(equipment)">
          <n-card hoverable>
            <template #header>
              <n-space justify="space-between">
                <span>{{ equipment.name }} · 战力 {{ getEquipmentScore(equipment) }}</span>
                <n-button size="small" type="warning" @click.stop="sellEquipment(equipment)">卖出</n-button>
              </n-space>
            </template>
            <n-space vertical>
              <n-tag :style="{ color: equipment.qualityInfo.color }">
                {{ equipment.qualityInfo.name }}
              </n-tag>
              <n-tag size="small" :style="{ color: getEquipmentSet(equipment)?.color }">
                {{ getEquipmentSet(equipment)?.name || '无套装' }}
              </n-tag>
              <n-text>境界要求：{{ getRealmName(equipment.requiredRealm).name }}</n-text>
              <n-text depth="3">战力 {{ getEquipmentScore(equipment) }}</n-text>
              <n-tag size="small" :type="getComparisonType(equipment)">
                {{ getComparisonLabel(equipment) }}
              </n-tag>
            </n-space>
          </n-card>
        </n-grid-item>
      </n-grid>
      <n-empty description="没有任何装备" v-else></n-empty>
    </n-space>
  </n-modal>
  <!-- 装备详情弹窗 -->
  <n-modal
    v-model:show="showEquipmentDetailModal"
    preset="dialog"
    :title="selectedEquipment?.name || '装备详情'"
    style="width: min(720px, calc(100vw - 24px))"
  >
    <n-descriptions bordered>
      <n-descriptions-item label="品质">
        <span :style="{ color: selectedEquipment?.qualityInfo.color }">
          {{ selectedEquipment?.qualityInfo.name }}
        </span>
      </n-descriptions-item>
      <n-descriptions-item label="类型">
        {{ equipmentTypes[selectedEquipment?.type] }}
      </n-descriptions-item>
      <n-descriptions-item label="强化等级">+{{ selectedEquipment?.enhanceLevel || 0 }}</n-descriptions-item>
      <n-descriptions-item label="装备战力">{{ getEquipmentScore(selectedEquipment) }}</n-descriptions-item>
      <n-descriptions-item label="所属套装">{{ selectedEquipmentSet?.name || '无套装' }}</n-descriptions-item>
      <template v-if="selectedEquipment?.stats">
        <n-descriptions-item v-for="(value, stat) in selectedEquipment.stats" :key="stat" :label="getStatName(stat)">
          {{ formatStatValue(stat, value) }}
        </n-descriptions-item>
      </template>
    </n-descriptions>
    <section class="set-detail" v-if="selectedEquipmentSet">
      <n-divider>{{ selectedEquipmentSet.name }}</n-divider>
      <n-space vertical size="small">
        <div v-for="bonus in selectedEquipmentSet.bonuses" :key="bonus.pieces" class="set-bonus-line">
          <n-tag size="small" :type="selectedSetPieceCount >= bonus.pieces ? 'success' : 'default'">
            {{ bonus.pieces }} 件
          </n-tag>
          <n-text :depth="selectedSetPieceCount >= bonus.pieces ? 1 : 3">{{ bonus.description }}</n-text>
        </div>
      </n-space>
    </section>
    <div
      class="stats-comparison"
      v-if="equipmentComparison && selectedEquipment?.id != playerStore.equippedArtifacts[selectedEquipment?.slot]?.id"
    >
      <n-divider>属性对比</n-divider>
      <n-alert :type="selectedComparison.difference > 0 ? 'success' : selectedComparison.difference < 0 ? 'warning' : 'info'">
        {{ selectedComparisonLabel }}
      </n-alert>
      <div class="comparison-table-wrap">
      <n-table class="comparison-table" :bordered="false" :single-line="false">
        <thead>
          <tr>
            <th>属性</th>
            <th>当前装备</th>
            <th>选中装备</th>
            <th>属性变化</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(comparison, stat) in equipmentComparison" :key="stat">
            <td>{{ getStatName(stat) }}</td>
            <td>{{ formatStatValue(stat, comparison.current) }}</td>
            <td>{{ formatStatValue(stat, comparison.selected) }}</td>
            <td>
              <n-gradient-text :type="comparison.diff > 0 ? 'success' : comparison.diff < 0 ? 'error' : 'info'">
                {{ comparison.diff > 0 ? '+' : '' }}{{ formatStatValue(stat, comparison.diff) }}
              </n-gradient-text>
            </td>
          </tr>
        </tbody>
      </n-table>
      </div>
    </div>
    <template #action>
      <n-space class="equipment-actions" justify="space-between">
        <n-space>
          <n-button
            type="primary"
            @click="showEnhanceConfirm = true"
            :disabled="(selectedEquipment?.enhanceLevel || 0) >= 100"
          >
            强化
          </n-button>
          <n-button type="info" :disabled="playerStore.refinementStones < 10" @click="handleReforgeEquipment">
            洗练
          </n-button>
        </n-space>
        <n-space>
          <n-button
            @click="equipItem(selectedEquipment)"
            :disabled="playerStore.level < selectedEquipment?.requiredRealm"
            v-if="selectedEquipment?.id != playerStore.equippedArtifacts[selectedEquipment?.slot]?.id"
          >
            装备
          </n-button>
          <n-button
            @click="unequipItem(selectedEquipment?.slot)"
            :disabled="playerStore.level < selectedEquipment?.requiredRealm"
            v-else
          >
            卸下
          </n-button>
          <n-button
            type="error"
            @click="sellEquipment(selectedEquipment)"
            v-if="selectedEquipment?.id != playerStore.equippedArtifacts[selectedEquipment?.slot]?.id"
          >
            出售
          </n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
  <!-- 强化确认弹窗 -->
  <n-modal
    v-model:show="showEnhanceConfirm"
    preset="dialog"
    title="装备强化"
    style="width: min(520px, calc(100vw - 24px))"
  >
    <n-space vertical>
      <n-descriptions bordered :column="1">
        <n-descriptions-item label="强化等级">+{{ enhanceLevel }} → +{{ enhanceLevel + 1 }}</n-descriptions-item>
        <n-descriptions-item label="成功率">{{ Math.round(enhanceSuccessRate * 100) }}%</n-descriptions-item>
        <n-descriptions-item label="强化石">{{ playerStore.reinforceStones }} → {{ Math.max(0, playerStore.reinforceStones - enhanceCost) }}</n-descriptions-item>
      </n-descriptions>
      <n-alert type="warning">强化失败仍会消耗 {{ enhanceCost }} 枚强化石，但装备不会掉级。</n-alert>
    </n-space>
    <template #action>
      <n-space justify="end">
        <n-button @click="showEnhanceConfirm = false">取消</n-button>
        <n-button
          type="primary"
          @click="handleEnhanceEquipment"
          :disabled="playerStore.reinforceStones < enhanceCost"
        >
          强化 · {{ enhanceCost }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
  <!-- 洗练确认弹窗 -->
  <n-modal
    v-model:show="showReforgeConfirm"
    preset="dialog"
    title="洗练结果确认"
    style="width: min(620px, calc(100vw - 24px))"
  >
    <template v-if="reforgeResult">
      <div class="reforge-compare">
        <div class="old-stats">
          <h3>原始属性</h3>
          <div v-for="(value, key) in reforgeResult.oldStats" :key="key">
            {{ getStatName(key) }}: {{ formatStatValue(key, value) }}
          </div>
        </div>
        <div class="new-stats">
          <h3>新属性</h3>
          <div v-for="(value, key) in reforgeResult.newStats" :key="key">
            {{ getStatName(key) }}: {{ formatStatValue(key, value) }}
          </div>
        </div>
      </div>
      <n-alert :type="reforgeScoreDifference >= 0 ? 'success' : 'warning'">
        新属性战力 {{ reforgeNewScore }}，{{ reforgeScoreDifference >= 0 ? '提升' : '下降' }}
        {{ Math.abs(reforgeScoreDifference) }}。本次洗练已消耗 10 枚洗练石，保留旧属性也不会返还。
      </n-alert>
    </template>
    <template #action>
      <n-button type="primary" @click="confirmReforgeResult(true)">确认新属性</n-button>
      <n-button @click="confirmReforgeResult(false)">保留原属性</n-button>
    </template>
  </n-modal>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { ref, computed, watch } from 'vue'
  import { useMessage } from 'naive-ui'
  import { getStatName, formatStatValue } from '../plugins/stats'
  import { getRealmName } from '../plugins/realm'
  import { pillRecipes, pillGrades, pillTypes, calculatePillEffect } from '../plugins/pills'
  import {
    enhanceEquipment,
    getEnhanceCost,
    getEnhanceSuccessRate,
    reforgeEquipment
  } from '../plugins/equipment'
  import { compareEquipment, EQUIPMENT_SETS, getEquipmentScore } from '../plugins/equipmentRules'

  // 分页相关
  const currentPage = ref(1)
  const pageSize = ref(12)

  // 过滤后的灵宠列表
  const filteredPets = computed(() => {
    const pets = playerStore.items.filter(item => item.type === 'pet')
    if (selectedRarityToRelease.value === 'all') {
      return pets
    }
    return pets.filter(pet => pet.rarity === selectedRarityToRelease.value)
  })

  // 当前页显示的灵宠
  const displayPets = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredPets.value.slice(start, end)
  })

  // 页大小改变处理
  const onPageSizeChange = size => {
    pageSize.value = size
    currentPage.value = 1
  }

  const playerStore = usePlayerStore()
  const message = useMessage()

  // 使用丹药
  const usePill = pill => {
    const result = playerStore.usePill(pill)
    if (result.success) {
      message.success(result.message)
    } else {
      message.error(result.message)
    }
  }

  // 灵宠品质配置
  const petRarities = {
    divine: {
      name: '神品',
      color: '#FF0000',
      probability: 0.02,
      essenceBonus: 50
    },
    celestial: {
      name: '仙品',
      color: '#FFD700',
      probability: 0.08,
      essenceBonus: 30
    },
    mystic: {
      name: '玄品',
      color: '#9932CC',
      probability: 0.15,
      essenceBonus: 20
    },
    spiritual: {
      name: '灵品',
      color: '#1E90FF',
      probability: 0.25,
      essenceBonus: 10
    },
    mortal: {
      name: '凡品',
      color: '#32CD32',
      probability: 0.5,
      essenceBonus: 5
    }
  }

  // 灵宠详情相关
  const showPetModal = ref(false)
  const selectedPet = ref(null)
  const selectedFoodPet = ref(null)

  // 放生确认弹窗
  const showReleaseConfirm = ref(false)
  const showBatchReleaseConfirm = ref(false)
  const petToRelease = ref(null)

  // 显示放生确认弹窗
  const confirmReleasePet = pet => {
    petToRelease.value = pet
    showReleaseConfirm.value = true
  }

  // 取消放生
  const cancelReleasePet = () => {
    petToRelease.value = null
    showReleaseConfirm.value = false
  }

  // 执行放生
  const releasePet = () => {
    if (petToRelease.value) {
      // 如果灵宠正在出战，先取消出战
      if (playerStore.activePet?.id === petToRelease.value.id) {
        playerStore.activePet = null
      }
      // 从背包中移除灵宠
      const index = playerStore.items.findIndex(item => item.id === petToRelease.value.id)
      if (index > -1) {
        playerStore.items.splice(index, 1)
        playerStore.saveData()
        message.success('已放生灵宠')
      }
      // 关闭所有相关弹窗
      showReleaseConfirm.value = false
      showPetModal.value = false
      petToRelease.value = null
    }
  }

  // 选中的放生品阶
  const selectedRarityToRelease = ref('all')

  // 批量放生函数
  const batchReleasePets = () => {
    playerStore.items = playerStore.items.filter(
      item =>
        item.type !== 'pet' ||
        item.id === playerStore.activePet?.id ||
        (selectedRarityToRelease.value !== 'all' && item.rarity !== selectedRarityToRelease.value)
    )
    showBatchReleaseConfirm.value = false
    message.success(
      `已放生${
        selectedRarityToRelease.value === 'all' ? '所有' : petRarities[selectedRarityToRelease.value].name
      }品阶的未出战灵宠`
    )
  }

  // 显示灵宠详情
  const showPetDetails = pet => {
    selectedPet.value = pet
    selectedFoodPet.value = null
    showPetModal.value = true
  }

  // 计算灵宠属性加成
  const getPetBonus = pet => {
    if (!pet) return { attack: 0, defense: 0, health: 0 }
    const qualityBonusMap = {
      divine: 0.5,
      celestial: 0.3,
      mystic: 0.2,
      spiritual: 0.1,
      mortal: 0.05
    }
    const starBonusPerQuality = {
      divine: 0.1,
      celestial: 0.08,
      mystic: 0.06,
      spiritual: 0.04,
      mortal: 0.02
    }
    const baseBonus = qualityBonusMap[pet.rarity] || 0.05
    const starBonus = (pet.star || 0) * (starBonusPerQuality[pet.rarity] || 0.02)
    const totalBonus = baseBonus + starBonus
    const phase = Math.floor((pet.star || 0) / 5)
    const phaseBonus = phase * (baseBonus * 0.5)
    const finalBonus = totalBonus + phaseBonus
    return {
      attack: finalBonus,
      defense: finalBonus,
      health: finalBonus
    }
  }

  // 获取升级所需精华数量
  const getUpgradeCost = pet => {
    return (pet.level || 1) * 10
  }

  // 检查是否可以升级
  const canUpgrade = pet => {
    const cost = getUpgradeCost(pet)
    return playerStore.petEssence >= cost
  }

  // 获取可用作升星材料的灵宠列表
  const getAvailableFoodPets = pet => {
    if (!pet) return []
    return playerStore.items
      .filter(
        item =>
          item.type === 'pet' &&
          item.id !== pet.id &&
          item.star === pet.star &&
          item.rarity === pet.rarity &&
          item.name === pet.name
      )
      .map(item => ({
        label: `${item.name} (${item.level || 1}级 ${item.star || 0}星)`,
        value: item.id
      }))
  }

  // 升级灵宠
  const upgradePet = pet => {
    const result = playerStore.upgradePet(pet, getUpgradeCost(pet))
    if (result.success) {
      message.success(result.message)
    } else {
      message.error(result.message)
    }
  }

  // 升星灵宠
  const evolvePet = pet => {
    if (!selectedFoodPet.value) {
      message.error('请选择用于升星的灵宠')
      return
    }
    // 通过id查找对应的灵宠对象
    const foodPet = playerStore.items.find(item => item.id === selectedFoodPet.value)
    if (!foodPet) {
      message.error('升星材料灵宠不存在')
      return
    }
    const result = playerStore.evolvePet(pet, foodPet)
    if (result.success) {
      message.success(result.message)
      selectedFoodPet.value = null
      showPetModal.value = false
    } else {
      message.error(result.message)
    }
  }

  // 装备类型配置
  const equipmentTypes = {
    weapon: '武器',
    head: '头部',
    body: '衣服',
    legs: '裤子',
    feet: '鞋子',
    shoulder: '肩甲',
    hands: '手套',
    wrist: '护腕',
    necklace: '项链',
    ring1: '戒指1',
    ring2: '戒指2',
    belt: '腰带',
    artifact: '法宝'
  }
  const equippedItems = computed(() => Object.values(playerStore.equippedArtifacts).filter(Boolean))
  const equippedCount = computed(() => equippedItems.value.length)
  const equippedScore = computed(
    () =>
      equippedItems.value.reduce((total, item) => total + getEquipmentScore(item), 0) +
      getEquipmentScore({ stats: playerStore.activeEquipmentSetBonuses })
  )
  const inventoryEquipmentCount = computed(() =>
    playerStore.items.filter(item => item?.slot && equipmentTypes[item.slot]).length
  )
  const activeSetStates = computed(() => playerStore.equipmentSetState.filter(set => set.count > 0))

  const getEquipmentSet = equipment => EQUIPMENT_SETS[equipment?.setId] || null
  const getEquipmentComparison = equipment =>
    compareEquipment(equipment, playerStore.equippedArtifacts[equipment?.slot || equipment?.type])
  const getComparisonType = equipment => {
    const comparison = getEquipmentComparison(equipment)
    if (comparison.verdict === 'new-slot' || comparison.difference > 0) return 'success'
    if (comparison.difference < 0) return 'warning'
    return 'info'
  }
  const getComparisonLabel = equipment => {
    const comparison = getEquipmentComparison(equipment)
    if (comparison.verdict === 'new-slot') return '可装备'
    if (comparison.difference > 0) return `提升 ${comparison.difference}`
    if (comparison.difference < 0) return `下降 ${Math.abs(comparison.difference)}`
    return '战力持平'
  }

  const getEquipmentStatSummary = equipment => {
    if (!equipment?.stats) return '点击选择装备'
    return Object.entries(equipment.stats)
      .slice(0, 2)
      .map(([stat, value]) => `${getStatName(stat)} ${formatStatValue(stat, value)}`)
      .join(' · ')
  }

  // 当前选中的装备类型
  const selectedType = ref('')

  // 显示装备类型弹窗
  const showEquipmentList = type => {
    selectedType.value = type
    selectedEquipmentType.value = type
    currentEquipmentPage.value = 1
    selectedQuality.value = 'all'
    showEquipmentModal.value = true
  }

  // 卸下装备
  const unequipItem = slot => {
    const result = playerStore.unequipArtifact(slot)
    if (result) {
      showEquipmentDetailModal.value = false
      message.success('当前装备已卸下')
    } else {
      message.error('卸下装备失败')
    }
  }

  // 装备列表相关
  const showEquipmentModal = ref(false)
  const selectedEquipmentType = ref('')
  const selectedQuality = ref('all')
  const currentEquipmentPage = ref(1)
  const equipmentPageSize = ref(8)

  watch(selectedQuality, () => {
    currentEquipmentPage.value = 1
  })

  // 装备品质选项
  const qualityOptions = computed(() => {
    const equipmentsByQuality = {}
    playerStore.items
      .filter(item => !selectedEquipmentType.value || item.type === selectedEquipmentType.value)
      .forEach(item => {
        equipmentsByQuality[item.quality] = (equipmentsByQuality[item.quality] || 0) + 1
      })
    return [
      { label: '全部品质', value: 'all' },
      { label: '仙品', value: 'mythic', disabled: !equipmentsByQuality['mythic'] },
      { label: '极品', value: 'legendary', disabled: !equipmentsByQuality['legendary'] },
      { label: '上品', value: 'epic', disabled: !equipmentsByQuality['epic'] },
      { label: '中品', value: 'rare', disabled: !equipmentsByQuality['rare'] },
      { label: '下品', value: 'uncommon', disabled: !equipmentsByQuality['uncommon'] },
      { label: '凡品', value: 'common', disabled: !equipmentsByQuality['common'] }
    ]
  })

  // 过滤后的装备列表
  const filteredEquipmentList = computed(() => {
    let list = playerStore.items.filter(item => {
      if (!selectedEquipmentType.value) return false
      if (item.type !== selectedEquipmentType.value) return false
      if (selectedQuality.value !== 'all' && item.quality !== selectedQuality.value) return false
      return true
    })
    return list
  })

  // 当前页显示的装备
  const equipmentList = computed(() => {
    const start = (currentEquipmentPage.value - 1) * equipmentPageSize.value
    const end = start + equipmentPageSize.value
    return filteredEquipmentList.value.slice(start, end)
  })

  // 装备页大小改变处理
  const onEquipmentPageSizeChange = size => {
    equipmentPageSize.value = size
    currentEquipmentPage.value = 1
  }

  // 批量卖出装备
  const batchSellEquipments = async () => {
    const result = await playerStore.batchSellEquipments(
      selectedQuality.value === 'all' ? null : selectedQuality.value,
      selectedEquipmentType.value
    )
    if (result.success) {
      message.success(result.message)
    } else {
      message.error(result.message || '批量卖出失败')
    }
  }

  // 卖出单件装备
  const sellEquipment = async equipment => {
    const result = await playerStore.sellEquipment(equipment)
    if (result.success) {
      message.success(result.message)
      showEquipmentDetailModal.value = false
    } else {
      message.error(result.message || '卖出失败')
    }
  }

  // 显示装备详情
  const showEquipmentDetails = equipment => {
    selectedEquipment.value = equipment
    showEquipmentDetailModal.value = true
  }

  // 装备详情相关
  const showEquipmentDetailModal = ref(false)
  const selectedEquipment = ref(null)

  // 强化确认弹窗
  const showEnhanceConfirm = ref(false)
  const enhanceLevel = computed(() => selectedEquipment.value?.enhanceLevel || 0)
  const enhanceCost = computed(() => getEnhanceCost(enhanceLevel.value))
  const enhanceSuccessRate = computed(() => getEnhanceSuccessRate(enhanceLevel.value))

  // 强化装备
  const handleEnhanceEquipment = () => {
    if (!selectedEquipment.value) return
    const result = enhanceEquipment(selectedEquipment.value, playerStore.reinforceStones)
    if (result.cost) playerStore.reinforceStones -= result.cost
    showEnhanceConfirm.value = false
    if (result.success) {
      selectedEquipment.value.stats = { ...result.newStats }
      selectedEquipment.value.enhanceLevel = result.newLevel
      playerStore.syncEquippedArtifactStats(selectedEquipment.value, result.oldStats)
      message.success(`强化成功，消耗 ${result.cost} 枚强化石，当前剩余 ${playerStore.reinforceStones}`)
      playerStore.saveData()
    } else {
      message.error(`${result.message || '强化失败'}${result.cost ? `，已消耗 ${result.cost} 枚强化石` : ''}`)
      if (result.cost) playerStore.saveData()
    }
  }

  // 洗练确认弹窗
  const showReforgeConfirm = ref(false)
  const reforgeResult = ref(null)
  const reforgeOldScore = computed(() =>
    reforgeResult.value ? getEquipmentScore({ stats: reforgeResult.value.oldStats }) : 0
  )
  const reforgeNewScore = computed(() =>
    reforgeResult.value ? getEquipmentScore({ stats: reforgeResult.value.newStats }) : 0
  )
  const reforgeScoreDifference = computed(() => reforgeNewScore.value - reforgeOldScore.value)

  // 洗练装备
  const handleReforgeEquipment = () => {
    if (!selectedEquipment.value) return
    const result = reforgeEquipment(selectedEquipment.value, playerStore.refinementStones, false)
    if (result.success) {
      playerStore.refinementStones -= result.cost
      reforgeResult.value = result
      showReforgeConfirm.value = true
    } else {
      message.error(result.message || '洗练失败')
    }
  }

  // 确认洗练结果
  const confirmReforgeResult = confirm => {
    if (!reforgeResult.value) return
    if (confirm) {
      // 用户确认后，应用新属性
      selectedEquipment.value.stats = reforgeResult.value.newStats
      playerStore.syncEquippedArtifactStats(selectedEquipment.value, reforgeResult.value.oldStats)
      message.success('已确认新属性')
    } else {
      // 用户取消，保留原属性
      message.info('已保留原有属性')
    }
    showReforgeConfirm.value = false
    reforgeResult.value = null
    playerStore.saveData()
  }

  // 使用装备
  const equipItem = equipment => {
    const result = playerStore.equipArtifact(equipment, equipment.type)
    if (result.success) {
      message.success(result.message)
      showEquipmentModal.value = false
      showEquipmentDetailModal.value = false
    } else {
      message.error(result.message || '装备失败')
    }
  }

  // 计算灵草分组
  const groupedHerbs = computed(() => {
    const groups = {}
    playerStore.herbs.forEach(herb => {
      if (!groups[herb.name]) {
        groups[herb.name] = {
          ...herb,
          count: 1
        }
      } else {
        groups[herb.name].count++
      }
    })
    return Object.values(groups)
  })

  // 计算丹方分组
  const groupedFormulas = computed(() => {
    // 从pillRecipes中获取完整丹方
    const complete = playerStore.pillRecipes
      .map(recipeId => {
        const recipe = pillRecipes.find(r => r.id === recipeId)
        return recipe
          ? {
              id: recipe.id,
              name: recipe.name,
              description: recipe.description,
              grade: recipe.grade,
              type: recipe.type,
              isComplete: true
            }
          : null
      })
      .filter(Boolean)

    // 从pillFragments中获取残缺丹方
    const incomplete = Object.entries(playerStore.pillFragments)
      .map(([recipeId, fragments]) => {
        const recipe = pillRecipes.find(r => r.id === recipeId)
        return recipe
          ? {
              id: recipe.id,
              name: recipe.name,
              description: recipe.description,
              grade: recipe.grade,
              type: recipe.type,
              isComplete: false,
              fragments,
              fragmentsNeeded: recipe.fragmentsNeeded
            }
          : null
      })
      .filter(Boolean)

    return { complete, incomplete }
  })

  // 计算丹药分组
  const groupedPills = computed(() => {
    const groups = {}
    playerStore.items
      .filter(item => item.type === 'pill')
      .forEach(pill => {
        if (!groups[pill.name]) {
          groups[pill.name] = {
            ...pill,
            count: 1
          }
        } else {
          groups[pill.name].count++
        }
      })
    return Object.values(groups)
  })
  // 使用物品
  const useItem = item => {
    if (item.type === 'pet') {
      const result = playerStore.usePet(item)
      if (result.success) {
        message.success(result.message)
      } else {
        message.error(result.message || '操作失败')
      }
    }
  }

  // 装备属性对比计算
  const equipmentComparison = computed(() => {
    if (!selectedEquipment.value) return null
    const slot = selectedEquipment.value.slot || selectedEquipment.value.type
    const currentEquipment = playerStore.equippedArtifacts[slot]
    if (!currentEquipment) return null
    const comparison = {}
    const allStats = new Set([...Object.keys(selectedEquipment.value.stats), ...Object.keys(currentEquipment.stats)])
    allStats.forEach(stat => {
      const selectedValue = selectedEquipment.value.stats[stat] || 0
      const currentValue = currentEquipment.stats[stat] || 0
      const diff = selectedValue - currentValue
      comparison[stat] = {
        current: currentValue,
        selected: selectedValue,
        diff: diff,
        isPositive: diff > 0
      }
    })
    return comparison
  })
  const selectedComparison = computed(() =>
    compareEquipment(
      selectedEquipment.value,
      playerStore.equippedArtifacts[selectedEquipment.value?.slot || selectedEquipment.value?.type]
    )
  )
  const selectedComparisonLabel = computed(() => {
    if (selectedComparison.value.verdict === 'new-slot') return `当前栏位为空，装备后增加 ${selectedComparison.value.candidateScore} 战力。`
    if (selectedComparison.value.difference > 0) return `替换后预计提升 ${selectedComparison.value.difference} 战力。`
    if (selectedComparison.value.difference < 0) return `替换后预计下降 ${Math.abs(selectedComparison.value.difference)} 战力。`
    return '替换前后单件战力持平。'
  })
  const selectedEquipmentSet = computed(() => getEquipmentSet(selectedEquipment.value))
  const selectedSetPieceCount = computed(
    () => playerStore.equipmentSetState.find(set => set.id === selectedEquipment.value?.setId)?.count || 0
  )

  const options = [
    { label: '全部品阶', value: 'all' },
    { label: '神品', value: 'divine' },
    { label: '仙品', value: 'celestial' },
    { label: '玄品', value: 'mystic' },
    { label: '灵品', value: 'spiritual' },
    { label: '凡品', value: 'mortal' }
  ]
</script>

<style scoped>
  .equipment-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 0 0 16px;
  }

  .equipment-summary > div {
    min-width: 0;
    padding-left: 12px;
    border-left: 3px solid var(--jade);
  }

  .equipment-summary strong,
  .equipment-summary .n-text {
    display: block;
  }

  .equipment-summary strong {
    margin-top: 2px;
    font-size: 18px;
  }

  .set-summary {
    margin-bottom: 16px;
  }

  .set-detail {
    margin-top: 12px;
  }

  .set-bonus-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .comparison-table-wrap {
    overflow-x: auto;
  }

  .comparison-table {
    min-width: 520px;
  }

  .n-card {
    cursor: pointer;
  }

  .reforge-compare {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin: 16px 0;
  }

  .old-stats,
  .new-stats {
    flex: 1;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background-color: color-mix(in srgb, var(--jade-pale) 34%, var(--surface));
  }

  .old-stats h3,
  .new-stats h3 {
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 16px;
    color: var(--jade-deep);
  }

  .set-summary,
  .equipment-summary,
  .comparison-table-wrap {
    color: var(--ink);
  }

  .equipment-actions {
    flex-wrap: wrap;
  }

  .n-card {
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  }

  .n-card:hover {
    border-color: color-mix(in srgb, var(--jade) 55%, var(--line)) !important;
    box-shadow: 0 12px 28px rgba(16, 39, 25, 0.14) !important;
  }

  @media (max-width: 520px) {
    .equipment-summary {
      grid-template-columns: 1fr;
    }

    .equipment-actions,
    .equipment-actions > .n-space {
      align-items: stretch !important;
      flex-direction: column !important;
      width: 100%;
    }

    .reforge-compare {
      flex-direction: column;
    }

    .set-summary {
      align-items: flex-start;
    }
  }
</style>
