# preview-v2 上线复盘与后续待办

日期：2026-04-30
最后更新：2026-05-03（已补到最新首页文案、日报、联系方式、SEO 兜底、后台验证状态）

这份文档记录校园VC 新官网 `preview-v2` 上线后的最新状态。重点是两件事：

1. 现在代码和线上网站已经完成了什么。
2. 还有哪些事必须由你登录后台完成，不能在代码里代替。

一句话结论：**新网站代码已经上线，主要页面可访问，结构化数据可解析，核心文案口径已修正；GSC sitemap 已重新提交，GA4 Realtime 已看到实时用户，剩下的是 Cloudflare 账号、缓存清理和真 301 规则。**

## 已经上线的页面

正式线上地址：

- `https://xiaoyuanvc.com/`
- `https://xiaoyuanvc.com/student.html`
- `https://xiaoyuanvc.com/teacher.html`
- `https://xiaoyuanvc.com/resources/`

相关提交：

- `22870cb`：把 `preview-v2` 搬到正式路径，发布首页、学生页、教师页、资源页，更新 sitemap、GA4 事件、部署脚本和上线资源。
- `6345974`：统一公开数字口径，确保网站使用 `19万+ / 1000+ / 100万` 这套说法。
- `2f54d00`：把这份上线复盘文档补回 `docs/plans/`，并把新网站页尾标语统一为 `10年推动100万大学生创业`。
- `0627d0e`：全站删除错误句子 `希望在未来影响100万名青年创业者`，更新 2026-05-03 的数创日报和加密日报，并给首页联系方式标题补冒号。
- 本次提交：更新首页“我是学生 / 我是教师”卡片文案，并把这份复盘文档补到最新状态。
- `4d49199`：补上旧资源页 `/resources.html` 的 HTML 跳转兜底，给 `preview-v2` 页面加 `noindex,follow`，并清理本机过程文件。
- `fa57098`：把新版本 2026-05-03 加密日报图重新压缩并推送到官网。
- `36e2376`：删除首页 FAQ 里带空格的旧品牌句变体，确保 `青年创业者` 这类错误口径不再出现。

## 已完成的代码改动

### 1. 首页

已完成：

- 用新版 `preview-v2/index.html` 替换旧首页。
- 保留校园VC 的定位：`AI+Crypto 的创业大学`。
- 统一数字口径：
  - `19万+`：创业教育智慧系统学习人数。
  - `1000+`：数创班累计直接辅导学生。
  - `100万`：长期品牌愿景。
- 火种节补充副标题：`连续 8 年大学生创业盛会`。
- 首页受众卡片已改成更直接的说明：
  - 学生卡：`6 周做出第一个 AI 创业项目，两个免费教程：数创班和加密创投营，两个收费社群：大创社群和 CSS 社群。`
  - 教师卡：`数创班的学生能做出 AI 原型和路演成果的 6 周实战课。老师全程观摩真实课堂，学校拿到可汇报的创新创业成果。`

原理解释：

这些数字不只出现在页面正文，也会出现在 FAQ 结构化数据和 `llms.txt` 里。如果不同地方写成 `900+`、`1000+`、`19万+` 混在一起，搜索引擎和 AI 摘要工具可能会引用到互相矛盾的信息。

### 2. 学生页

已完成：

- 正式发布 `student.html`。
- 加入学习群二维码区域。
- 把“加学习群”按钮指向 `#join-group`。
- 增加学生群二维码相关 GA4 点击事件。

原理解释：

以前“扫码入群”更像一句提示，用户点了不一定知道会发生什么。现在按钮会跳到页面内的二维码区域，路径更清楚，也方便 GA4 统计这个动作。

### 3. 教师页

已完成：

- 正式发布 `teacher.html`。
- JSON-LD 从 `EducationalOccupationalProgram` 改为 `Course`。
- 增加 `audienceType: Educator`。
- 删除教师页里已经不用的 CSS：
  - `.school-tags`
  - `.scb-intro`
  - `.quote-chip`

原理解释：

教师页卖的是面向高校老师的课程/合作方案，不是学历项目或职业培养项目。用 `Course` 更准确，`audienceType: Educator` 也能让搜索引擎理解这页是给老师看的。

### 4. 资源页

已完成：

- 正式发布 `resources/index.html`。
- 11 篇文章按主题分组：
  - `AI 创业`
  - `加密创投`
  - `数字创业`
- 增加分组锚点：
  - `#articles-ai`
  - `#articles-crypto`
  - `#articles-digital`
- 修复 `preview-v2/resources.html` 搬到 `resources/index.html` 后的相对链接。

原理解释：

文件位置变了，相对路径的计算方式也会变。比如 `preview-v2/resources.html` 里的链接，搬到 `resources/index.html` 后，如果不改，可能会指到错误目录。所以资源页的自链、学生页/教师页链接、文章链接都要按正式路径重新计算。

### 5. 品牌愿景句

已完成：

新网站所有品牌愿景句统一改为：

```text
10年推动100万大学生创业
```

已覆盖这些位置：

- `index.html`
- `student.html`
- `teacher.html`
- `resources/index.html`
- `preview-v2/index.html`
- `preview-v2/student.html`
- `preview-v2/teacher.html`
- `preview-v2/resources.html`
- `llms.txt`
- 首页 JSON-LD 描述
- 首页 hero 副标题
- 首页图片 alt 文案

已经明确删除，不再使用这句错误文案：

```text
希望在未来影响100万名青年创业者
```

原理解释：

这不是只改页尾 slogan。品牌愿景会被用户、搜索引擎、JSON-LD 结构化数据、图片 alt 和 AI 摘要工具从不同位置读取。如果一处写 `10年推动100万大学生创业`，另一处还保留旧句子，就会让官网对外口径不一致。

### 6. 今天的日报图片

已完成：

- `assets/daily/scb-daily-latest.png` 已更新为 2026-05-03 数创日报。
- `assets/daily/css-daily-latest.png` 已更新为 2026-05-03 加密日报最新版。
- 原始日报图约 5 MB，已压缩到官网展示尺寸 `768x1376`：
  - 数创日报：`164571B`
  - 加密日报：`177432B`

原理解释：

首页只需要展示日报图片，不需要上传原始 1536px 大图。压缩后的图仍清晰可读，但加载更快，也更适合移动端。

### 7. 联系方式标题

已完成：

首页联系方式区域的二维码标题已经加上中文冒号：

- `微信公众号：`
- `殷教授的助教老师：`

原理解释：

二维码标题后面加冒号，可以让标题和二维码/说明之间的层级更清楚，减少“标题像普通标签一样飘着”的视觉问题。

### 8. GA4 事件

已完成：

`main.js` 里已经加入这些事件：

- `hero_hook_click`
- `navboard_click`
- `partner_logo_click`
- `interactive_tool_click`
- `student_group_qr_click`
- `qr_view`

原理解释：

这些事件用来区分不同用户行为。点首页主按钮、点资源导航卡片、点合作伙伴 logo、点工具入口、查看二维码，不应该在 GA4 里都混成普通点击。

### 9. `llms.txt`

已完成：

`llms.txt` 已同步新网站核心事实：

- `19万+` 学习人数。
- `1000+` 数创班直接辅导学生。
- `100万` 长期品牌愿景。
- 增加学生页、教师页、资源页入口链接。

原理解释：

`llms.txt` 是给 AI 工具理解网站用的。如果它还写旧数字，即使页面上已经改对，AI 摘要仍可能引用旧说法。

### 10. SEO / GEO 路径保护

已完成：

- 文章和工具继续使用正式路径 `/resources/...`，没有迁移到 `/articles/` 或 `/tools/`。
- `sitemap.xml` 继续提交正式 URL，不包含 `preview-v2`。
- 新增根目录 `resources.html`，兼容旧分享链接 `/resources.html`，打开后会跳到 `/resources/`。
- `preview-v2/index.html`、`preview-v2/student.html`、`preview-v2/teacher.html`、`preview-v2/resources.html` 都加了 `noindex,follow`。

当前限制：

- 线上响应头显示当前仍由 GitHub Pages 服务，`server: GitHub.com`。
- GitHub Pages 不读取 `_redirects`，所以 `_redirects` 里的规则现在不是线上真正的 HTTP `301`。
- `/resources.html` 现在是 HTML 跳转兜底，不是真 HTTP `301`。

原理解释：

SEO / GEO 已经有效的文章页，最重要的是继续让原有正式 URL 返回 `200`，并用 sitemap、canonical 和 noindex 避免重复页面分散权重。真正的 HTTP `301` 需要 Cloudflare Pages 或 Cloudflare Redirect Rules 生效，不能只靠仓库里的 `_redirects` 文件。

## 已验证的证据

### Git 状态

最新已验证提交：

```text
本次提交；具体 hash 以 git log -1 为准
```

本地分支和 `origin/main` 已对齐：

```text
HEAD...origin/main = 0 0
```

本机过程文件已清理，当前工作区没有未提交文件：

```text
git status --short --branch
## main...origin/main
```

### 线上页面可访问

线上 23 个关键 URL 已经返回 HTTP `200`。

4 个主页面：

- `/`
- `/student.html`
- `/teacher.html`
- `/resources/`

8 个互动工具页：

- `/resources/tools-presentation.html`
- `/resources/my-explorations.html`
- `/resources/find-your-idea.html`
- `/resources/find-what-you-want.html`
- `/resources/rate-your-idea.html`
- `/resources/hard-tech-check.html`
- `/resources/ai-ready-check.html`
- `/resources/ai-opportunity.html`

11 篇文章页：

- `/resources/ai-startup-roadmap.html`
- `/resources/no-code-ai-startup.html`
- `/resources/ai-era-entrepreneurship-skills.html`
- `/resources/crypto-investing-guide.html`
- `/resources/chinese-web3-startup-course.html`
- `/resources/what-is-digital-entrepreneurship-education.html`
- `/resources/platforms-comparison.html`
- `/resources/zero-to-hero-book.html`
- `/resources/hackathon-starter-guide.html`
- `/resources/digital-nomad-skills.html`
- `/resources/free-digital-entrepreneurship-courses.html`

通俗解释：主要页面都能从线上域名正常打开。

### JSON-LD 可解析

线上结构化数据解析通过：

- `/`：
  - `EducationalOrganization`
  - `FAQPage`
- `/student.html`：
  - `Course`
- `/teacher.html`：
  - `Course`
- `/resources/`：
  - `ItemList`

通俗解释：页面里的结构化数据不是坏 JSON，类型也符合预期。这个检查不能代替 Google 官方富媒体结果测试，但能先排除语法错误和明显类型错误。

### Lighthouse

移动端 Lighthouse 检查结果：

- 上线前四页检查：
  - `/`：Accessibility 100，Best Practices 100，SEO 100
  - `/student.html`：100，100，100
  - `/teacher.html`：100，100，100
  - `/resources/`：100，100，100
- 最新文案修正后，首页复查：
  - Accessibility 100
  - Best Practices 96
  - SEO 100

通俗解释：最新版改动主要是文案，不是布局重构。首页仍然超过上线阈值。

### 为什么之前看到的文档还是旧版

原因：这份文档在 `2f54d00` 时已经补回并推送，但后续又追加了几轮改动：

- 全站删除错误品牌句。
- 更新 2026-05-03 两张日报图。
- 给联系方式标题加冒号。
- 修改首页“我是学生 / 我是教师”卡片文案。

这些后续改动发生后，文档没有立刻同步更新，所以你看到的是上一版复盘，不是最新状态。现在这份文档已经补齐这些后续变化。

## 后台验证状态

下面这些事原本必须登录后台验证。现在状态如下。

### 1. GA4 Realtime 检查

状态：**已验证可见实时数据。**

已看到的证据：

- GA4 Realtime pages 页面显示：
  - `ACTIVE USERS IN LAST 30 MINUTES = 1`
  - `VIEWS IN LAST 30 MINUTES = 5`
  - 页面路径包含 `/` 和 `/index.html`
- 官网浏览器网络请求显示：
  - 成功加载 `gtag.js?id=G-LP5EB2HW33`
  - 成功发送 `page_view` 到 `google-analytics.com/g/collect`
  - 请求返回 `204`
- 在学生页点击“扫码入群”后，浏览器 `dataLayer` 已出现：
  - `student_group_qr_click`
  - `qr_view`

原理解释：

这说明两件事：第一，官网浏览器端确实在发 GA4 数据；第二，GA4 后台 Realtime 能看到这个账号下的实时访问。Realtime 里的事件卡片可能有延迟或需要切到事件维度查看，但从 `dataLayer` 和 Realtime users/page views 看，埋点链路已经不是“完全没数据”的状态。

### 2. Google Search Console 提交 sitemap

状态：**已完成。**

你已在 Google Search Console 重新提交：

```text
https://xiaoyuanvc.com/sitemap.xml
```

原理解释：

代码里的 `sitemap.xml` 已更新。重新提交 sitemap 的作用是通知 Google 更快重新抓取首页、学生页、教师页、资源页和文章页。

### 3. Cloudflare 缓存和真 301

状态：**未完成，原因是当前没有 Cloudflare 账号 / 项目。**

当前事实：

- 没有替官网开过 Cloudflare 账号。
- 当前线上响应头仍显示 `server: GitHub.com`，说明官网还在 GitHub Pages 上服务。
- 因为没有 Cloudflare 项目，所以现在不能做 Cloudflare Purge Cache。
- 因为 GitHub Pages 不读取 `_redirects`，所以 `_redirects` 里的规则目前不是线上真正的 HTTP `301`。

原理解释：

目前已做的是代码侧兜底：`/resources.html` 会通过 HTML 跳转到 `/resources/`，`preview-v2` 页面带 `noindex,follow`。这能降低 SEO/GEO 风险，但不等同于服务器级 HTTP `301`。如果后续要严格做 301，需要新建 Cloudflare 项目或在 Cloudflare Redirect Rules 里配置规则。

## 当前判断

代码上线已经完成，线上网站已经可访问并通过主要技术检查。

现在可以说：代码上线、GSC sitemap、GA4 Realtime 基础验证已经完成。

但不要把 Cloudflare 收尾说成完成，除非下面事项已经做完或你明确决定暂时不做：

- 开通 / 接入 Cloudflare。
- 配置服务器级 HTTP `301`，尤其是 `/resources.html -> /resources/` 和不希望被访问的 `preview-v2` 路径。
- Cloudflare CDN 清缓存。
