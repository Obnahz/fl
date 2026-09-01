# 修仙 HTML 小游戏开源项目调研

调研时间：2026-08-23

## 结论先行

建议：**基于现有项目改造，但只选轻量纯前端底座，并把 MVP 控制在 4 个核心系统内**。

首选底座：[`shanawakiminouso-hub/xiuxian-idle`](https://github.com/shanawakiminouso-hub/xiuxian-idle)

备选底座：[`setube/vue-idle-xiuxian`](https://github.com/setube/vue-idle-xiuxian)

功能参考：[`JeasonLoop/react-xiuxian-game`](https://github.com/JeasonLoop/react-xiuxian-game)、[`setube/vue-XiuXianGame`](https://github.com/setube/vue-XiuXianGame)

不建议直接复用：[`Martinqi826/xiuxian`](https://github.com/Martinqi826/xiuxian)，因为仓库明确写明未设置开源协议，默认保留全部版权。

## 项目对比

| 项目 | 技术/部署 | 维护与社区信号 | 许可证 | 可复用价值 | 判断 |
|---|---|---|---|---|---|
| `shanawakiminouso-hub/xiuxian-idle` | 原生 HTML/CSS/JS；零依赖、无构建，双击 `index.html` 即可运行 | 33 commits、1 star、0 forks；能运行，但社区和维护信号较弱 | MIT | 数据与逻辑分离、修炼/突破、奇遇、灵宠、装备、离线收益、导入导出存档 | **最适合 MVP 底座** |
| `setube/vue-idle-xiuxian` | Vue + Vite + Pinia + Naive UI；npm 或 Docker Compose | 32 commits、282 stars、94 forks；有一定社区关注，但本次检索未能从页面稳定确认最近提交日期，维护度评为中等 | MIT | 角色、探索、背包、成就、灵宠、装备、抽奖、炼丹、设置、数据管理 | **适合继续扩展** |
| `JeasonLoop/react-xiuxian-game` | React 19 + TypeScript + Vite；npm/pnpm；可选 Docker/后端 | 426 commits、39 forks；更新日志可见至 2026-06-30，但 README 版本和配置说明存在滞后 | MIT | 组件拆分、属性/装备/灵宠/宗门/炼丹/抽奖/成就、localStorage、事件模板/服务层 | **适合参考架构或中期改造** |
| `setube/vue-XiuXianGame` | Vue + Element Plus + Pinia；本地安装或 Docker | 297 commits、1.8k stars、311 forks；社区信号最好 | CC BY-NC 4.0 | 成熟玩法和界面组织，适合研究系统拆分和数值设计 | **个人非商业可参考；商业项目不要直接用** |
| `sushou1024/XiuXian` | Vue 3 + TS + FastAPI；SQLite/PostgreSQL、WebSocket、Docker | 277 commits，但 0 stars/0 forks；代码量和依赖较重 | Apache-2.0 | AI 叙事、账号/云存档、开放世界、后端接口、CI/CD | **不适合第一版，适合后期联网方向** |
| `Martinqi826/xiuxian` | 单文件 HTML + CSS + JS；双击或本地 HTTP 服务即可运行 | 51 commits、2 stars、1 fork；项目迭代记录完整 | **无开源协议** | 单文件 MVP、境界/修炼/战斗/天劫/丹药/宗门/灵宠等设计参考 | **只能联系作者获授权后再用** |

## 重点观察

### 1. 最容易部署的项目

`xiuxian-idle` 和 `Martinqi826/xiuxian` 都是纯前端、浏览器本地存档，不需要数据库或服务器。前者目录结构更适合二次开发，后者单文件更适合阅读和快速试玩法，但许可证风险使其不适合作为直接底座。

### 2. 最适合长期维护的项目

`vue-idle-xiuxian` 的目录和技术栈比较标准，功能已经覆盖放置修仙常见模块，并且是 MIT。它比原生项目多一层构建和框架成本，但更适合后续加入页面、组件和数据表。

### 3. 最完整但不适合直接拿来做 MVP 的项目

`vue-XiuXianGame` 和 `react-xiuxian-game` 都有大量现成系统。前者许可证限制为非商业使用；后者的更新日志显示 2026-03-18 已移除 AI 依赖，但 README 仍保留 AI Key 和 Docker 配置说明，说明文档与代码状态需要先核对。两者直接接手都会把“先做一个小游戏”扩大成“先维护一个完整产品”。

### 4. 不建议第一版接入 AI

AI 事件生成很有吸引力，但会引入 API Key、费用、网络失败、内容一致性和安全问题。MVP 用本地事件表 + 加权随机足够验证修炼循环是否好玩，后续再把事件生成替换成可选 AI 服务。

## 最简单的 MVP

### 核心循环

1. 创建角色：名字、一个随机灵根。
2. 修炼：点击“修炼”获得修为；每秒自动增长少量修为。
3. 突破：修为达到阈值后尝试突破，成功进入下一小境界，失败扣除部分修为。
4. 历练：消耗行动次数，触发 6~10 个固定随机事件，获得修为、灵石或受伤。
5. 存档：使用 `localStorage` 自动保存，并提供导出/导入字符串。

### MVP 不做

宗门、灵宠、装备、炼丹、抽奖、PVP、联网、账号系统、AI 事件、复杂地图、后端服务。

### 建议的第一版边界

- 5 个境界，每境 3 层。
- 3 种灵根，只影响修炼速度。
- 6~10 个历练事件。
- 1 个简单战斗/危险事件判定。
- 1 个主界面 + 1 个设置/存档面板。
- 目标是先验证 5 分钟内是否能完成“修炼 → 突破 → 历练 → 变强”的闭环。

## 最终建议

- **如果只是个人试玩或课程作业**：基于 `shanawakiminouso-hub/xiuxian-idle` 改造，最快。
- **如果准备继续做成较完整的网页游戏**：基于 `setube/vue-idle-xiuxian` 改造，更容易维护。
- **如果目标是 AI 文字冒险或联网游戏**：先用轻量 MVP 验证玩法，再参考 `react-xiuxian-game` 或 `sushou1024/XiuXian` 的模块设计，不要一开始整套接入。
- **不建议从零开发**：除非你明确想练习前端架构，或者已有独特玩法需要完全不同的底层模型。
