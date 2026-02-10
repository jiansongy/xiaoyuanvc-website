# XYVC (xiaoyuanvc.com) UI/UX 待办事项

> 基于 2026-02-10 整体设计风格审计，按优先级排列。
> 总体评分：**85/100**，设计系统完整度高，以下为可提升项。

---

## P0 — 严重（影响用户体验或无障碍）

### 1. 替换所有 Emoji 为 SVG 图标 ✅
- **位置**: `index.html:94` Hero badge、`index.html:193-205` Pain cards、`index.html:471-481` Contact links
- **问题**: Emoji 跨设备渲染不一致（Android/Windows/iOS 差异大），Pain cards 48px 大尺寸 emoji 在专业品牌场景下显得随意
- **方案**: 替换为与 About section Bento 卡片一致的 SVG 图标 + 渐变圆形背景；Contact links 的 emoji 替换为 16px inline SVG
- **工作量**: ~1h
- [x] Hero badge 🚀 → SVG 火箭图标
- [x] Pain card 😶 → SVG 图标 + 渐变背景
- [x] Pain card 🐢 → SVG 图标 + 渐变背景
- [x] Pain card 📉 → SVG 图标 + 渐变背景
- [x] Contact link 📚 → inline SVG
- [x] Contact link 🎓 → inline SVG
- [x] Contact link 🔗 → inline SVG
- [x] Social link 🎙️ → inline SVG
- [x] Social link 📺 → inline SVG

### 2. 添加全局 Focus 状态样式 ✅
- **位置**: `styles.css` — 全局无 `:focus-visible` 样式
- **问题**: 键盘用户 Tab 到按钮/链接时看不到焦点环，无障碍不达标
- **方案**: 添加全局规则
  ```css
  :focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }
  ```
- **工作量**: 10min
- [x] 添加全局 `:focus-visible` 样式
- [ ] 验证 Tab 键在导航、按钮、链接上的可见焦点环

### 3. 三级文本色对比度不达标 ✅
- **位置**: `styles.css:36` — `--color-text-tertiary: #94A3B8`
- **问题**: `#94A3B8` on `#FAFBFE` 对比度约 2.8:1，低于 WCAG AA 4.5:1 要求
- **影响范围**: `.stat__label`, `.team-card__desc`, `.contact__qr-desc`, `.footer__slogan`, `.footer__copyright`, `.footer__filing a`
- **方案**: `--color-text-tertiary` 从 `#94A3B8` 改为 `#64748B`（slate-500，对比度约 4.6:1）
- **工作量**: 5min
- [x] 修改 CSS 变量值
- [ ] 目视检查各使用场景的视觉效果

---

## P1 — 重要（影响转化率或专业感）

### 4. 修复 OG image 路径 ✅
- **位置**: `index.html:18, 24`
- **问题**: 引用 `hero-illustration.jpg`，实际文件为 `hero-illustration-ghibli.png`，社交分享无缩略图
- **工作量**: 5min
- [x] 将 og:image 和 twitter:image 路径改为正确的文件名
- [ ] 或制作专用的 1200×630 OG image

### 5. 备案链接使用 HTTP ✅
- **位置**: `index.html:512`
- **问题**: `http://www.beian.gov.cn/` 应为 HTTPS
- **工作量**: 1min
- [x] 改为 `https://www.beian.gov.cn/`

### 6. 导航栏添加 CTA 按钮 ✅
- **位置**: `index.html:73-82` — 导航仅有文字链接
- **问题**: 导航栏是全站最高频曝光的 UI 区域，缺少品牌色 CTA 按钮是转化率损失
- **方案**: 在导航最右侧添加小号 `.btn-primary`（如"立即学习"或"免费体验"），保持 sticky 可见
- **工作量**: 30min
- [x] HTML 中添加 CTA 按钮（"免费学习"）
- [x] CSS 适配桌面端和移动端布局
- [x] 移动端菜单中也需要体现

### 7. 增加重复 CTA section ✅
- **位置**: 全站仅 Hero 有 1 处明确 CTA
- **问题**: 用户浏览到 Products/Testimonials 后犹豫时没有即时行动入口
- **方案**:
  - Products section 后添加 CTA bar（如"开启你的创业之旅"）
  - Footer 前添加最终 CTA section（如"立即加入校园VC"）
- **工作量**: ~1h
- [x] 设计 CTA bar 组件样式
- [x] 在 Products section 后插入 CTA
- [x] 在 Footer 前插入最终 CTA（品牌渐变背景）

### 8. Hero CTA 文案优化 ✅
- **位置**: `index.html:105`
- **问题**: "进入学习站 →" 直接跳外部站，用户还没充分了解就被引走；文案偏功能性，缺乏感性驱动
- **方案**: 主 CTA 改为更感性的文案（如"开启创业之旅 →"），或增加一个锚点到 Products section
- **工作量**: 10min
- [x] 确定新的 CTA 文案（"开启创业之旅 →"）
- [x] 更新 HTML

---

## P2 — 中等（设计优化）

### 9. 卡片交互暗示不一致 ✅
- **位置**: `.about__card`, `.pain-card`, `.team-card`, `.testimonial-card` 的 hover 效果
- **问题**: 这些卡片有 hover transform（translateY + shadow 提升），但不可点击且无 `cursor: pointer`，给用户错误的交互暗示
- **方案 A**: 非交互卡片移除 `transform: translateY(-4px)`，仅保留 subtle shadow 变化
- **方案 B**: 添加 `cursor: pointer` 并将整张卡片包裹为可点击区域
- **工作量**: 20min
- [x] 采用方案 A
- [x] 修改对应 CSS（移除 about/pain/team/testimonial 卡片的 translateY）
- [x] `.product-card` 保持 hover（有内部 CTA 链接）

### 10. 丰富 Testimonials 至 4+ 条
- **位置**: `index.html:381-405` — 仅 2 条学员反馈
- **问题**: 社会证明说服力取决于数量，2 条且无具体成果描述偏弱
- **方案**:
  - 增至 4-6 条
  - 添加学员具体成果（创业成绩、获奖、融资额）
  - 考虑使用学员真实头像替代文字 avatar
- **工作量**: 内容收集 + ~1h 前端
- [ ] 收集 4-6 条真实学员反馈（含成果数据）⚠️ 需要真实内容
- [ ] 获取学员真实头像
- [ ] 更新 HTML
- [ ] 调整 grid 布局（2x2 或 carousel）

### 11. 精简 About section 信息层级
- **位置**: About section — Bento 4 卡 + Pain Points 3 卡 = 7 张卡片
- **问题**: "解决问题" 卡片和 Pain Points 说的是同一件事，信息重复
- **方案**:
  - 将 Pain Points 融入 "解决问题" 卡片的展开说明
  - 或将 About 精简为 3 个核心卡片 + 1 个大号 mission statement
- **工作量**: ~1h
- [ ] 确定新的信息架构方案 ⚠️ 需要确认方向
- [ ] 重构 HTML 结构
- [ ] 调整 CSS grid

### 12. Video section 添加 fallback ✅
- **位置**: `index.html:137-145`
- **问题**: 无 `<source>` 多格式 fallback，无文字 fallback，视频加载失败时显示黑色方块
- **方案**: 添加 `<source>` 标签 + 文字 fallback
- **工作量**: 10min
- [x] 添加 `<source>` 标签和文字 fallback 内容

---

## P3 — 低优先级（锦上添花）

### 13. Gallery 添加 Lightbox
- **问题**: 18 张照片在 4 列中缩略图很小，用户无法放大查看细节
- **方案**: 纯 CSS/JS lightbox（零依赖），点击缩略图弹出全屏查看
- **工作量**: ~2h
- [ ] 实现 lightbox 组件
- [ ] 添加键盘导航（左右箭头、Escape 关闭）
- [ ] 移动端适配

### 14. 移除 Footer logo 呼吸动画 ✅
- **位置**: `styles.css:1079-1086`
- **问题**: logo 的 opacity 呼吸效果属于"装饰性持续动画"，按 UX 最佳实践仅应用于 loading indicator
- **工作量**: 5min
- [x] 删除 `@keyframes breathe` 和对应动画声明

### 15. 暗色模式支持
- **问题**: 仅有浅色方案，暗色模式已是 2026 年用户基本期望
- **优势**: CSS 变量体系已为切换做好准备，实现成本低
- **工作量**: ~3h
- [ ] 定义 `@media (prefers-color-scheme: dark)` 下的变量覆盖
- [ ] 卡片、导航、Footer 的暗色适配
- [ ] 验证所有文本对比度
- [ ] 可选：添加手动切换开关

### 16. 导航栏浮动化（Floating Nav）
- **问题**: 当前导航紧贴屏幕边缘（`top: 0; left: 0; right: 0`），现代趋势是浮动导航
- **方案**: `top: 12px; left: 16px; right: 16px; border-radius: 12px;` + 毛玻璃背景
- **工作量**: ~30min
- [ ] 决定是否采纳（风格偏好）
- [ ] 修改 CSS
- [ ] 调整 Hero section padding 以适配

### 17. Schema.org 结构化数据扩展
- **现状**: 仅有 `EducationalOrganization`
- **方案**: 添加 `Course`（数创班课程）和 `FAQPage` schema
- **工作量**: ~30min
- [ ] 添加 Course schema
- [ ] 添加 FAQ schema（如果添加 FAQ section）

---

## 现有优势（无需改动）

以下是审计中确认做得很好的部分，保持即可：

- [x] CSS 变量设计系统完整（40+ 变量）
- [x] 零外部依赖的性能模型
- [x] 图片 WebP 格式 + lazy loading
- [x] `prefers-reduced-motion` 完整支持（CSS + JS）
- [x] ARIA 属性（hamburger aria-label/aria-expanded）
- [x] 所有图片有描述性 alt 属性
- [x] 外部链接 `rel="noopener noreferrer"`
- [x] Escape 键关闭移动菜单
- [x] 语义化 HTML（nav/section/footer/header）
- [x] Schema.org EducationalOrganization 结构化数据
- [x] 数字计数器动画（18万+ 格式化）
- [x] 交错进场动画（80ms stagger）
- [x] 视频 viewport 自动播放/暂停
- [x] 三档响应式断点（1200/768/375）
- [x] Inter 字体 + 系统中文字体 fallback

---

*审计工具: UI/UX Pro Max Design Intelligence*
*审计日期: 2026-02-10*
*执行日期: 2026-02-10 — 完成 11/17 项（P0 全部 + P1 全部 + P2 部分 + P3 部分）*
