---
name: 挂机也成仙
description: 山门玉牒风格的修仙放置游戏界面
colors:
  night: "#101814"
  jade-deep: "#143f35"
  jade: "#287b61"
  jade-pale: "#d6e8d8"
  paper: "#ede6d5"
  surface: "#fffaf0"
  cinnabar: "#af4837"
  gold: "#bd9855"
  ivory: "#f4efdb"
  nav-muted: "#cad5c6"
  nav-active: "#fff5d3"
  status-paper: "#f8f0d9"
  status-muted: "#c9dbca"
  status-bright: "#fff9e9"
  status-light: "#e9efd9"
  dark-title: "#bee0c5"
  header-line: "rgba(244, 239, 219, .22)"
  header-hover: "rgba(244, 239, 219, .08)"
  status-line: "rgba(244, 239, 219, .2)"
  progress-rail: "rgba(244, 239, 219, .16)"
  header-shadow: "rgba(3, 10, 6, .22)"
  brand-shadow: "rgba(0, 0, 0, .28)"
  home-shadow: "rgba(6, 17, 10, .2)"
---

# Design System: 挂机也成仙

## Overview

**Creative North Star: “山门玉牒”**

玩家进入的是一座夜色山门，而非通用后台。深玉色的顶栏承担导航与门派归属感；下方的纸色界面像摊开的玉牒与账卷，让修为、灵力、装备和任务在频繁查看时仍保持一眼可读。现有玉制八卦图标是唯一的具象品牌资产，作为小而明确的信物出现，不扩散成重复装饰。

## Visual Rules

- **夜色与深玉**用于顶部山门、角色状态和高优先级确认。
- **账卷纸色**用于复杂操作、表格、表单和卡片内容，优先保障长时间阅读。
- **淡玉**只用于推荐、激活的低强度铺底；**旧金**只用于进度与路径；**朱砂**只用于风险、失败、删除和稀有警示。
- 导航是横向视图切换，激活状态以金色底线标记，不做胶囊标签。
- 卡片以细边框表达层次；角色状态带是例外，允许使用一层深色表面与柔和阴影。
- 修仙感来自材质逻辑、配色、标题字形和层级，不使用小说封面式人物、法阵粒子、夸张发光或游戏 HUD 装饰。

## Typography

- 界面正文使用系统中文无衬线字体，保证数据、按钮、描述和对话框清晰。
- 品牌名与卡片标题使用现有的楷体回退序列，且只在短标题中出现。
- 不使用负字距；数值保持可扫描和稳定。

## Responsive Behavior

- 外壳最小支持 320px。
- 角色状态由桌面自适应列缩为三列、再缩为两列；标签与数值不重叠。
- 窄屏缩小图标与边距，保留完整的横向菜单滚动和所有功能入口。

## Accessibility

- 焦点环为旧金色，所有主题下仍清晰可见。
- 减少动态效果偏好下，按压与过渡被压缩到近乎即时。
- 文本与数据始终放在高对比实体表面上，不依赖背景气氛读取。
