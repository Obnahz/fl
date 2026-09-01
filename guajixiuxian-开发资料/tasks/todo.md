# 开发任务：轻量摸鱼挂机版本路线

## 执行原则

- 每个版本只引入一个主要决策循环。
- 任务、奖励和推荐操作必须复用现有行为与资源。
- 先完成可测试的纵向切片，再扩展视觉和内容数量。
- 未通过检查点前，不进入下一阶段。

## V1.1：今日修行

## Task 1: 设计任务数据与存档迁移

**Description:** 为每日任务、活跃度和领奖状态增加可迁移的本地存档结构，并定义统一的任务事件统计接口。

**Acceptance criteria:**
- [x] 旧存档加载后具有安全的默认任务状态。
- [x] 同一天重复加载不会重复发放奖励。
- [x] 修炼、历练、炼丹、秘境等行为可写入任务进度。

**Verification:**
- [x] 新增存档迁移与任务状态测试。
- [x] `pnpm test` 通过。
- [x] 浏览器导入第五版旧存档并确认自动补齐今日任务。

**Dependencies:** None

**Files likely touched:**
- `src/stores/player.js`
- `src/plugins/gameRules.js`
- `tests/save-validation.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 2: 完成每日任务与活跃度奖励流程

**Description:** 实现任务生成、进度更新、领奖、日更重置与防重复领奖逻辑，奖励复用现有资源。

**Acceptance criteria:**
- [x] 每天有有限且明确的任务列表。
- [x] 每项任务可以领取一次，活跃度宝箱可以按门槛领取。
- [x] 时区和本地日期变化不会造成奖励重复或无法领取。

**Verification:**
- [x] 任务规则单元测试通过。
- [x] `pnpm test` 通过。
- [x] 手动完成一项修炼任务并领取奖励。

**Dependencies:** Task 1

**Files likely touched:**
- `src/plugins/tasks.js`
- `src/stores/player.js`
- `tests/tasks.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 3: 建立今日待办界面

**Description:** 新增任务视图与首页摘要，使玩家能快速查看、领取并跳转到相应玩法。

**Acceptance criteria:**
- [x] 返回玩家首屏能显示待领取奖励和推荐任务。
- [x] 完整任务页面可查看进度、奖励和领取状态。
- [x] 窄屏下不出现横向溢出，操作区域可触达。

**Verification:**
- [x] `pnpm run build` 通过。
- [x] 桌面和手机宽度手动走通查看、跳转、领取流程。

**Dependencies:** Task 2

**Files likely touched:**
- `src/views/Tasks.vue`
- `src/views/Home.vue`
- `src/router/index.js`
- `src/App.vue`

**Estimated scope:** Medium: 3-5 files

## Task 3B: 增加七日短目标

**Description:** 在每日任务核心稳定后，增加连续七日的轻量目标与阶段奖励，继续复用现有行为和资源。

**Acceptance criteria:**
- [x] 七日进度独立于每日重置，旧存档具有安全默认值。
- [x] 每天只开放一个短目标，完成与领奖状态可读且不可重复领取。
- [x] 第七日奖励提供称号或头像框预留位，不直接扩大核心战力差距。

**Verification:**
- [x] 七日进度、跨日开放和防重复领奖测试通过。
- [x] 桌面与手机宽度下可以查看七日进度。

**Dependencies:** Task 3

**Estimated scope:** Medium: 3-5 files

## Checkpoint: V1.1

- [x] 所有测试通过，生产构建成功。
- [x] 新老存档均可进入游戏并完成一个每日任务。
- [x] 人工检查任务奖励：每日奖励仅使用现有资源，单日上限保持轻量。

### V1.1 人体验收重点

- [x] 返回游戏后，首页或修炼页首屏能显示一个明确的推荐行动。
- [x] 玩家能在 10 秒内理解推荐行动的目标、进度和奖励。
- [x] 完成一次行为后，任务进度、活跃度和可领取状态立即可见。
- [x] 关闭任务层后，原有挂机、修炼、历练和秘境流程不受影响。

## V1.2：宗门与委托

## Task 4: 建立宗门状态与贡献规则

**Description:** 新增单人宗门、贡献、等级和可切换修炼方向的纯本地状态与规则。

**Acceptance criteria:**
- [x] 玩家可选择一个宗门并获得基础成长方向。
- [x] 宗门状态可安全写入和迁移存档。
- [x] 切换方向存在合理限制，且不会叠加异常增益。

**Verification:**
- [x] 宗门规则与迁移测试通过。
- [x] `pnpm test` 通过。

**Dependencies:** V1.1 Checkpoint

**Files likely touched:**
- `src/plugins/sect.js`
- `src/stores/player.js`
- `tests/sect.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 5: 实现宗门委托和商店

**Description:** 使用现有资源与战斗结算实现短时、定时、挑战三类委托，并提供贡献兑换。

**Acceptance criteria:**
- [x] 每类委托都有明确成本、时长、奖励和领取状态。
- [x] 宗门商店有刷新与购买上限校验。
- [x] 所有奖励通过统一结算入口发放。

**Verification:**
- [x] 委托与商店规则测试通过。
- [x] `pnpm test` 通过。
- [x] 手动完成一项委托并兑换一次物品。

**Dependencies:** Task 4

**Files likely touched:**
- `src/plugins/sect.js`
- `src/stores/player.js`
- `src/workers/`
- `tests/sect.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 6: 完成宗门界面与入口

**Description:** 新增宗门页面，提供宗门选择、委托、贡献商店和成长方向管理。

**Acceptance criteria:**
- [x] 新玩家和已有玩家都有清晰的首次进入状态。
- [x] 委托进度与可领取状态在页面上可识别。
- [x] 现有导航在桌面和手机上仍可用。

**Verification:**
- [x] `pnpm run build` 通过。
- [x] 手动走通宗门选择、接取委托、领取、兑换流程。

**Dependencies:** Task 5

**Files likely touched:**
- `src/views/Sect.vue`
- `src/router/index.js`
- `src/App.vue`

**Estimated scope:** Medium: 3-5 files

## Task 6B: 兑现宗门奖励方向

**Description:** 将宗门与修行方向中已展示的历练、战斗、灵草和秘境收益加成接入现有奖励结算，不增加新资源或新页面。

**Acceptance criteria:**
- [x] 历练普通奖励、历练战斗奖励和灵草数量应用对应加成。
- [x] 秘境灵石奖励应用秘境与战斗加成。
- [x] 小额整数奖励保留可测试的增益机会，且奖励只结算一次。

**Verification:**
- [x] 宗门奖励倍率与固定随机值测试通过。
- [x] `pnpm test` 与 `pnpm run build` 通过。

**Dependencies:** Task 6

**Estimated scope:** Medium: 3-5 files

## Checkpoint: V1.2

- [x] 所有测试通过，生产构建成功。
- [x] 宗门委托与任务系统同时生效且奖励无重复。
- [x] 人工审核资源产出、消耗和升级门槛。
- [x] 宗门页面展示的奖励类加成都已在对应玩法中生效。

## V1.3：洞府经营与周目标

## Task 7: 建立洞府值守与离线待领取状态

**Description:** 新增可迁移的洞府状态，先提供聚灵阵与炼器台两种值守选择；离线收益先进入待领取结算，不再自动直接写入资源。

**Acceptance criteria:**
- [x] 玩家任一时刻只选择一个值守建筑，切换不会丢失已积累收益。
- [x] 离线时长最多结算 8 小时，收益来源、时长和数量可追溯。
- [x] 收取操作幂等，旧存档迁移后具有安全默认状态。

**Verification:**
- [x] 洞府规则、存档迁移和防重复收取测试通过。
- [x] `pnpm test` 通过。

**Dependencies:** V1.2 Checkpoint

**Estimated scope:** Medium: 3-5 files

## Task 8: 完成洞府回归操作面

**Description:** 新增紧凑洞府页面，展示值守选择、待领取来源和“收取全部”，收取后给出前往修炼或装备强化的下一步入口。

**Acceptance criteria:**
- [x] 返回游戏时能看见离线时长、值守建筑和准确收益。
- [x] 收取全部后资源只增加一次，并出现与收益匹配的下一步操作。
- [x] 桌面与手机宽度下选择、收取和跳转均可触达。

**Verification:**
- [x] `pnpm run build` 通过。
- [x] 自动浏览器走通选择值守、模拟离线、收取与跳转。

**Dependencies:** Task 7

**Estimated scope:** Medium: 3-5 files

## Checkpoint: V1.3A 洞府值守

- [x] 所有测试通过，生产构建成功。
- [x] 离线收益有明确来源、上限和一次性领取状态。
- [x] 玩家可以复盘：我上次选择了这个值守，所以回来获得了这类资源。

## V2.0：板块重新分工与中循环

## Task 9：定义阶段目标与准备状态

**Description:** 建立一个不新增资源的阶段目标契约，描述当前目标、剩余时间、准备项、风险、结算条件和复盘信息。先只服务一个境界/秘境纵向切片。

**Acceptance criteria:**
- [ ] 玩家能看到当前阶段目标、完成条件和剩余时间。
- [ ] 准备状态只使用现有资源和行为，不引入新货币。
- [ ] 旧存档加载时自动补齐安全默认值。

**Verification:**
- [ ] 增加阶段目标规则单元测试。
- [ ] 新旧存档均能创建、加载和清除阶段目标。
- [ ] 桌面与 320px 宽度下目标、风险和进度不重叠。

**Dependencies:** V1.3A Checkpoint

**Files likely touched:**
- `src/plugins/stageGoals.js`
- `src/stores/player.js`
- `tests/stage-goals.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 10：接入修炼、探索与洞府分工

**Description:** 让修炼负责推进目标，探索负责提供机会与风险，洞府负责决定离线期间积累的资源类型；三者都写入同一阶段状态。

**Acceptance criteria:**
- [ ] 三种行为会改变至少两类后续状态。
- [ ] 探索风险可在行动前读取，离线收益来源可追溯。
- [ ] 原有修炼、探索和洞府流程仍可独立使用。

**Verification:**
- [ ] 覆盖灵力不足、受伤、离线收益和阶段切换测试。
- [ ] 手动完成一次“修炼路线”和一次“探索路线”并对照状态变化。

**Dependencies:** Task 9

**Files likely touched:**
- `src/stores/player.js`
- `src/plugins/explorationRules.js`
- `src/plugins/cave.js`
- `tests/stage-goals.test.js`

**Estimated scope:** Large: 5-8 files

## Task 11：接入炼丹、装备与宗门分工

**Description:** 让炼丹提供时机型优势，装备提供目标适配，宗门提供长期偏向与机会成本；不增加新的资源池。

**Acceptance criteria:**
- [ ] 丹药、装备和宗门方向至少各有一个明确适用场景与代价。
- [ ] 三者的效果能被阶段目标或结算读取，而不是只增加最终数值。
- [ ] 旧的炼丹、强化、宗门委托流程不被阻断。

**Verification:**
- [ ] 增加跨系统结算测试，覆盖准备、消耗和撤销。
- [ ] 手动走通一次“丹药准备”和一次“装备/宗门准备”。

**Dependencies:** Task 9

**Files likely touched:**
- `src/stores/player.js`
- `src/plugins/pills.js`
- `src/plugins/equipmentRules.js`
- `src/plugins/sect.js`
- `tests/stage-goals.test.js`

**Estimated scope:** Large: 5-8 files

## Task 12：让秘境与突破完成统一结算

**Description:** 将玩家的准备状态带入秘境或突破结算，明确展示选择、代价、帮助、风险和结果，形成可复盘的中循环闭环。

**Acceptance criteria:**
- [ ] 同一阶段至少有两条合理且互相牺牲的路线。
- [ ] 秘境/突破结算会读取并消耗阶段准备。
- [ ] 失败结果能指出玩家放弃了什么、承担了什么、下次可改变什么。

**Verification:**
- [ ] 增加成功、失败、提前退出和重复结算测试。
- [ ] 完成一次 30 秒试玩并记录玩家复盘原话。

**Dependencies:** Task 10, Task 11

**Files likely touched:**
- `src/views/Cultivation.vue`
- `src/views/Dungeon.vue`
- `src/plugins/dungeon.js`
- `src/plugins/gameRules.js`
- `tests/stage-goals.test.js`

**Estimated scope:** Large: 5-8 files

## Task 13：建立内容扩充模板与首个纵向切片

**Description:** 只为一个境界/秘境补齐少量有差异的功法、地点、丹药、装备和选项，验证内容差异来自选择关系而非数字放大。

**Acceptance criteria:**
- [ ] 每个新增内容都有适用场景、代价、克制或反制和获取出口。
- [ ] 新增内容至少改变一种路线选择关系。
- [ ] 首个纵向切片可以重复游玩并产生不同准备结果。

**Verification:**
- [ ] 完成 30 秒、10 分钟和次日回访试玩记录。
- [ ] 玩家能说出当前目标、选择理由和失败复盘。

**Dependencies:** Task 12

**Files likely touched:**
- `src/plugins/techniques.js`
- `src/plugins/locations.js`
- `src/plugins/pills.js`
- `src/plugins/equipmentRules.js`
- `src/plugins/dungeon.js`

**Estimated scope:** Large: 5-8 files

## Checkpoint: V2.0 板块重新分工

- [ ] `pnpm test` 全部通过。
- [ ] `pnpm run build` 通过。
- [ ] 新旧存档均能完成阶段目标流程。
- [ ] 玩家回到游戏后 10 秒内知道下一步。
- [ ] 结算能解释至少一次成功和一次失败。
- [ ] 未通过上述检查前，不继续横向增加新板块。
