# 校园VC · 视觉设计语言白皮书 (Visual Design Language)

> **Vision**: 让每一个迷茫的灵魂，在这里点燃创业的火种
> **Style Archetype**: Airy Light — 通透人文感 × 科技前沿感的融合

---

## 1. 设计基因 (Design DNA)

### 核心隐喻

**"清晨的校园 + 发射台"** — 界面如同清晨阳光洒进大学校园的感觉：通透、温暖、充满可能性；同时暗含一座发射台的力量感，暗示每一个年轻人都即将起飞。

这不是冰冷的科技后台，也不是幼稚的校园涂鸦。它是一所 **未来大学的数字门面** — 兼具学术的严谨与创业的锐气。

### 用户情绪

用户在浏览时应感到：
- **第一秒**: 清爽、专业（"这不是野鸡机构"）
- **第三秒**: 被点燃（"我也想创业"）
- **持续浏览**: 信任、向往（"这些人真的在做事"）

### 使用场景适配

选择 **浅色模式 (Airy Light)**，原因：
1. **教育属性**: 创业教育面向大学生群体，浅色传递温暖、开放、可亲近感
2. **品牌信任**: 高校创业学院负责人需要看到"正规机构"的气质，浅色更具公信力
3. **阅读舒适**: 信息密度较高（产品/团队/书籍），浅色背景下文字阅读更轻松
4. **AI+Crypto 前沿感**: 通过局部渐变、微光效和品牌蓝来注入科技基因，而非全盘暗黑

---

## 2. 色彩美学 (Color & Mood)

### 画布基调 (Canvas)

| 层级 | 色值 | 命名 | 用途 |
|------|------|------|------|
| 主背景 | `#FAFBFE` | 晨雾白 | 页面主背景，带一丝冷蓝调，区别于死白 |
| 区块背景 | `#F1F5F9` | 薄雾灰 | 交替区块背景，营造节奏感 |
| 卡片表面 | `#FFFFFF` | 纯白 | 卡片/容器表面，用阴影"浮"起 |
| 深色区块 | `#0F172A` | 深空蓝 | 页脚/特殊强调区块 |

### 品牌主色 (Primary)

| 色值 | 命名 | 性格 | 用途 |
|------|------|------|------|
| `#2563EB` | 火种蓝 | 信任、前沿、智慧 | 主按钮、链接、强调元素 |
| `#3B82F6` | 天际蓝 | 轻盈、活力 | Hover 状态、次级强调 |
| `#1D4ED8` | 深邃蓝 | 沉稳、权威 | Active 状态、标题强调 |
| `#DBEAFE` | 浅蓝纱 | 温柔、呼吸 | 背景色块、Tag 底色 |

> **设计决策**: 选择蓝色系统一 learn.xiaoyuanvc.com 的品牌蓝 `#2563EB`，抛弃现有官网的暖橙/粉色体系。蓝色同时传达"科技"（AI/Crypto）和"教育"（信任/专业）双重语义，是校园VC最精准的品牌色。

### 辅助色 (Accent)

| 色值 | 命名 | 用途 |
|------|------|------|
| `#F59E0B` | 火种金 | 数据高亮、成就徽章、CTA 辅助 |
| `#10B981` | 生长绿 | 成功状态、增长数据 |
| `#8B5CF6` | 创新紫 | Crypto/Web3 相关模块标识 |

### 语义色谱 (Semantic)

| 语义 | 色值 | 用途 |
|------|------|------|
| 成功 | `#10B981` | 正向反馈、数据增长 |
| 警告 | `#F59E0B` | 提醒注意 |
| 信息 | `#3B82F6` | 信息提示 |
| 危险 | `#EF4444` | 错误状态 |

### 渐变色系 (Gradients)

| 名称 | 色值 | 用途 |
|------|------|------|
| 火种渐变 | `linear-gradient(135deg, #2563EB, #7C3AED)` | Hero 区域 CTA、品牌强调 |
| 晨光渐变 | `linear-gradient(180deg, #FAFBFE, #F1F5F9)` | 区块过渡 |
| 深空渐变 | `linear-gradient(180deg, #0F172A, #1E293B)` | 页脚背景 |

---

## 3. 版式与数字 (Typography)

### 字体策略

| 用途 | 字体 | 回退栈 | 理由 |
|------|------|--------|------|
| 中文正文 | **系统默认** | `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif` | 国内用户设备覆盖最广，无需加载 |
| 英文/数字 | **Inter** | `Inter, -apple-system, BlinkMacSystemFont, sans-serif` | 几何感强、等宽数字优秀，与蓝色系极搭 |
| 代码/数据 | **JetBrains Mono** | `"JetBrains Mono", "SF Mono", monospace` | 数据展示区域的等宽字体 |

### 字号体系

| 级别 | 桌面端 | 移动端 | 字重 | 用途 |
|------|--------|--------|------|------|
| Display | 64px / 4rem | 40px / 2.5rem | 800 | Hero 标题 |
| H1 | 48px / 3rem | 32px / 2rem | 700 | 区块标题 |
| H2 | 36px / 2.25rem | 24px / 1.5rem | 700 | 副标题 |
| H3 | 24px / 1.5rem | 20px / 1.25rem | 600 | 卡片标题 |
| H4 | 20px / 1.25rem | 18px / 1.125rem | 600 | 小标题 |
| Body | 16px / 1rem | 16px / 1rem | 400 | 正文 |
| Small | 14px / 0.875rem | 14px / 0.875rem | 400 | 辅助文字 |
| Caption | 12px / 0.75rem | 12px / 0.75rem | 400 | 标注/备案号 |

### 微排版

- **行高 (Leading)**: 正文 1.75，标题 1.2，营造松弛的阅读感
- **字间距 (Tracking)**: 标题 `-0.02em`（收紧增强力量感），正文 `0`
- **数据排版**: 关键数字使用 `font-variant-numeric: tabular-nums`，字号放大 1.5 倍，字重 800，配合品牌色

---

## 4. 界面形态与组件 (UI Morphology)

### 容器美学

| 属性 | 值 | 设计意图 |
|------|------|----------|
| 圆角 | `16px`（大卡片）/ `12px`（小卡片）/ `8px`（按钮） | 友好但不幼稚 |
| 边框 | `1px solid rgba(0,0,0,0.06)` | 极浅分割线，若隐若现 |
| 阴影 (静态) | `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)` | 纸张漂浮感 |
| 阴影 (悬停) | `0 4px 16px rgba(37,99,235,0.08), 0 8px 32px rgba(0,0,0,0.06)` | 蓝色光晕上浮 |
| 材质 | 实色白底，**拒绝**磨砂玻璃（教育场景需清晰可读） | 信息可读性优先 |

### Bento Layout 便当盒布局

**Hero 区块**: 左文右图，经典 60/40 分割
```
┌────────────────────────────────────────────┐
│  Logo                    Nav               │
├──────────────────┬─────────────────────────┤
│  标题 + 副标题    │                         │
│  描述文案         │     品牌插画             │
│  CTA 按钮        │                         │
├──────┬──────┬────┴─────────────────────────┤
│ 18万+ │ 200+ │ 1万+                        │
└──────┴──────┴──────────────────────────────┘
```

**品牌介绍**: 4 列等宽 Bento 网格
```
┌──────────┬──────────┬──────────┬──────────┐
│   使命    │   愿景    │  用户画像  │  解决问题  │
└──────────┴──────────┴──────────┴──────────┘
```

**产品展示**: 2×2 Bento 网格，卡片内上图下文
```
┌────────────────────┬────────────────────┐
│  创业教育智慧系统    │    数创班课程        │
│  (左大，含截图)      │    (右大，含流程图)   │
├────────────────────┼────────────────────┤
│  大创社群            │    加密创投 CSS      │
│  (左小)             │    (右小)            │
└────────────────────┴────────────────────┘
```

**创始人区块**: 左右分割，创始人信息 + 书籍卡片
```
┌────────────────────┬────────────────────┐
│   创始人头像+介绍    │   《从零到英雄》     │
│   身份标签列表       │   封面 + 推荐语      │
└────────────────────┴────────────────────┘
```

**团队区块**: 4 列均等卡片网格
```
┌──────┬──────┬──────┬──────┐
│ 项方伟 │ 郑羽轩 │ 曹红波 │ 殷嘉傲 │
└──────┴──────┴──────┴──────┘
┌──────┬──────┬──────┬──────┐
│  4+  │  10+ │ 200+ │ 500强 │
└──────┴──────┴──────┴──────┘
```

### 深度与层级

| Z 层级 | 元素 | 视觉表现 |
|--------|------|----------|
| Z-0 | 页面背景 | `#FAFBFE` 纯色 |
| Z-1 | 区块背景 | `#F1F5F9` 或白色 |
| Z-2 | 卡片 | 白底 + 弥散阴影 |
| Z-3 | 悬停卡片 | 阴影加深 + 微上浮 `translateY(-4px)` |
| Z-4 | 导航栏 | 固定顶部，`backdrop-filter: blur(12px)` 半透明白 |
| Z-5 | Modal / 视频播放 | 暗幕遮罩 + 内容居中 |

---

## 5. 超级可视化 (Super Visualization)

### 关键数据展示

Hero 区的三组核心数据（18万+、200+、1万+）采用 **计数器动画**：
- 数字从 0 滚动到目标值，使用 `IntersectionObserver` 触发
- 字号 48px，字重 800，使用 `火种蓝` 色
- 下方附灰色小字标签
- 数字使用 `tabular-nums` 等宽排列

### 产品数据条

产品卡片中的数据进度条：
- 使用品牌渐变色（`火种渐变`）
- 从左到右动画填充
- 右侧数字同步计数动画

### 团队统计条

底部四格统计数字：
- 大数字 + 小标签结构
- 数字使用 `火种蓝`，标签使用灰色
- 四列均分，中间用极细竖线分隔

---

## 6. 交互物理与动效 (Interaction Physics)

### 触感反馈

| 元素 | 悬停效果 | 过渡 |
|------|----------|------|
| 卡片 | `translateY(-4px)` + 阴影加深 + 蓝色光晕 | `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` |
| 按钮 | 背景色加深 + `scale(1.02)` | `transition: all 0.2s ease` |
| 链接 | 下划线从左滑入 | `background-size: 0% → 100%` |
| 导航项 | 文字变蓝 + 底部指示线滑入 | `transition: color 0.2s` |
| 团队头像 | 轻微放大 `scale(1.05)` | `transition: transform 0.3s` |

### 进场编排 (Staggered Animation)

页面滚动时，各区块元素使用 **交错淡入** 动画：

```
进场基础: opacity 0→1, translateY(24px→0)
时长: 600ms
缓动: cubic-bezier(0.4, 0, 0.2, 1)
交错: 子元素间隔 80ms

示例 — 品牌介绍四卡片:
  卡片1: delay 0ms
  卡片2: delay 80ms
  卡片3: delay 160ms
  卡片4: delay 240ms
```

### 导航滚动行为

- 点击导航项，页面 `smooth scroll` 至对应区块
- 滚动过程中，导航栏自动高亮当前区块对应的导航项
- 导航栏在向下滚动时添加 `backdrop-filter: blur(12px)` 半透明效果

### 降级处理

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. 情感化细节 (Emotional Details)

### 加载状态

- 视频区域加载时：显示品牌蓝色脉冲动画圆点（三点波浪），而非默认 spinner
- 图片 lazy load：使用蓝灰色 `placeholder` 底色 + 淡入

### 空状态

- 如果视频加载失败：显示品牌插画 + "视频正在路上，请稍后再来" 文案
- 图片加载失败：显示品牌蓝色占位框 + 校园VC logo 水印

### 滚动到底部彩蛋

- 页脚 logo 有微妙的呼吸动画（`opacity` 0.8→1 循环），暗示品牌的生命力

### 二维码交互

- 二维码图片在悬停时轻微放大（`scale(1.05)`），方便手机扫描
- 周围添加微弱的蓝色光晕，引导视觉焦点

---

## 附录: CSS 变量速查表

```css
:root {
  /* Canvas */
  --color-bg-primary: #FAFBFE;
  --color-bg-secondary: #F1F5F9;
  --color-bg-card: #FFFFFF;
  --color-bg-dark: #0F172A;
  --color-bg-dark-secondary: #1E293B;

  /* Brand */
  --color-brand: #2563EB;
  --color-brand-hover: #3B82F6;
  --color-brand-active: #1D4ED8;
  --color-brand-light: #DBEAFE;

  /* Accent */
  --color-accent-gold: #F59E0B;
  --color-accent-green: #10B981;
  --color-accent-purple: #8B5CF6;

  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;
  --color-error: #EF4444;

  /* Text */
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-tertiary: #94A3B8;
  --color-text-inverse: #FFFFFF;

  /* Gradient */
  --gradient-brand: linear-gradient(135deg, #2563EB, #7C3AED);
  --gradient-dawn: linear-gradient(180deg, #FAFBFE, #F1F5F9);
  --gradient-dark: linear-gradient(180deg, #0F172A, #1E293B);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 96px;
  --space-section: 120px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
  --shadow-md: 0 4px 16px rgba(37,99,235,0.08), 0 8px 32px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 32px rgba(37,99,235,0.12), 0 16px 48px rgba(0,0,0,0.08);

  /* Typography */
  --font-sans: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Inter, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "SF Mono", monospace;

  /* Transition */
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;

  /* Layout */
  --max-width: 1200px;
  --nav-height: 72px;
}
```
