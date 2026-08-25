# 开发任务：轻量摸鱼挂机版本路线

## V1.1：今日修行

## Task 1: 设计任务数据与存档迁移

**Description:** 为每日任务、活跃度、七日目标和领奖状态增加可迁移的本地存档结构，并定义统一的任务事件统计接口。

**Acceptance criteria:**
- [ ] 旧存档加载后具有安全的默认任务状态。
- [ ] 同一天重复加载不会重复发放奖励。
- [ ] 修炼、历练、炼丹、秘境等行为可写入任务进度。

**Verification:**
- [ ] 新增存档迁移与任务状态测试。
- [ ] `pnpm test` 通过。
- [ ] 手动导入旧存档并确认可正常开始游戏。

**Dependencies:** None

**Files likely touched:**
- `src/stores/player.js`
- `src/plugins/gameRules.js`
- `tests/save-validation.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 2: 完成每日任务与活跃度奖励流程

**Description:** 实现任务生成、进度更新、领奖、日更重置与防重复领奖逻辑，奖励复用现有资源。

**Acceptance criteria:**
- [ ] 每天有有限且明确的任务列表。
- [ ] 每项任务可以领取一次，活跃度宝箱可以按门槛领取。
- [ ] 时区和本地日期变化不会造成奖励重复或无法领取。

**Verification:**
- [ ] 任务规则单元测试通过。
- [ ] `pnpm test` 通过。
- [ ] 手动完成一项修炼任务并领取奖励。

**Dependencies:** Task 1

**Files likely touched:**
- `src/plugins/tasks.js`
- `src/stores/player.js`
- `tests/tasks.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 3: 建立今日待办界面

**Description:** 新增任务视图与首页摘要，使玩家能快速查看、领取并跳转到相应玩法。

**Acceptance criteria:**
- [ ] 首页能显示待领取奖励和推荐任务。
- [ ] 完整任务页面可查看进度、奖励和领取状态。
- [ ] 窄屏下不出现横向溢出，操作区域可触达。

**Verification:**
- [ ] `pnpm run build` 通过。
- [ ] 桌面和手机宽度手动走通查看、跳转、领取流程。

**Dependencies:** Task 2

**Files likely touched:**
- `src/views/Tasks.vue`
- `src/views/Home.vue`
- `src/router/index.js`
- `src/App.vue`

**Estimated scope:** Medium: 3-5 files

## Checkpoint: V1.1

- [ ] 所有测试通过，生产构建成功。
- [ ] 新老存档均可进入游戏并完成一个每日任务。
- [ ] 人工检查任务奖励不会破坏现有资源产出节奏。

## V1.2：宗门与委托

## Task 4: 建立宗门状态与贡献规则

**Description:** 新增单人宗门、贡献、等级和可切换修炼方向的纯本地状态与规则。

**Acceptance criteria:**
- [ ] 玩家可选择一个宗门并获得基础成长方向。
- [ ] 宗门状态可安全写入和迁移存档。
- [ ] 切换方向存在合理限制，且不会叠加异常增益。

**Verification:**
- [ ] 宗门规则与迁移测试通过。
- [ ] `pnpm test` 通过。

**Dependencies:** V1.1 Checkpoint

**Files likely touched:**
- `src/plugins/sect.js`
- `src/stores/player.js`
- `tests/sect.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 5: 实现宗门委托和商店

**Description:** 使用现有资源与战斗结算实现短时、定时、挑战三类委托，并提供贡献兑换。

**Acceptance criteria:**
- [ ] 每类委托都有明确成本、时长、奖励和领取状态。
- [ ] 宗门商店有刷新与购买上限校验。
- [ ] 所有奖励通过统一结算入口发放。

**Verification:**
- [ ] 委托与商店规则测试通过。
- [ ] `pnpm test` 通过。
- [ ] 手动完成一项委托并兑换一次物品。

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
- [ ] 新玩家和已有玩家都有清晰的首次进入状态。
- [ ] 委托进度与可领取状态在页面上可识别。
- [ ] 现有导航在桌面和手机上仍可用。

**Verification:**
- [ ] `pnpm run build` 通过。
- [ ] 手动走通宗门选择、接取委托、领取、兑换流程。

**Dependencies:** Task 5

**Files likely touched:**
- `src/views/Sect.vue`
- `src/router/index.js`
- `src/App.vue`

**Estimated scope:** Medium: 3-5 files

## Checkpoint: V1.2

- [ ] 所有测试通过，生产构建成功。
- [ ] 宗门委托与任务系统同时生效且奖励无重复。
- [ ] 人工审核资源产出、消耗和升级门槛。
