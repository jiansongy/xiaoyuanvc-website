# www.xiaoyuanvc.com SEO 修复清单

> 审计日期：2026-02-04
> 审计工具：Claude Code SEO Audit
> 发起人：Jason
> 接收人：www 站负责同事

---

## 背景

对 xiaoyuanvc.com 全域做了一次 SEO 审计。learn.xiaoyuanvc.com（学习站）的问题已在本地修复并部署。以下是 **www.xiaoyuanvc.com** 需要修复的问题，按优先级排序。

当前状态：Google 仅收录了 www 站 1 个页面（`site:www.xiaoyuanvc.com` 只有首页），且该页面几乎无可抓取内容。

---

## P0 — 紧急（阻止搜索引擎收录）

### 1. robots.txt 添加 Sitemap 声明

当前 robots.txt 内容正确（允许所有爬虫），但缺少 Sitemap 引用。

**在文件末尾添加一行：**

```
Sitemap: https://www.xiaoyuanvc.com/sitemap.xml
```

完整文件应为：

```
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: https://www.xiaoyuanvc.com/sitemap.xml
```

### 2. 创建 sitemap.xml

在网站根目录创建 `sitemap.xml`，列出所有可索引页面。即使目前只有首页，也应创建：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.xiaoyuanvc.com/</loc>
    <lastmod>2026-02-04</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

后续新增页面时同步更新此文件。

### 3. 注册 Google Search Console

1. 前往 https://search.google.com/search-console
2. 添加资源 → 输入 `https://www.xiaoyuanvc.com/`
3. 完成域名验证（DNS TXT 记录或 HTML 文件方式）
4. 提交 sitemap URL：`https://www.xiaoyuanvc.com/sitemap.xml`

建议同时注册百度站长平台：https://ziyuan.baidu.com/

---

## P1 — 高优先级（影响排名和点击率）

### 4. 首页缺少基本 HTML meta 标签

审计发现首页缺少以下关键元素。请在 `<head>` 中补齐：

```html
<!-- 字符编码 -->
<meta charset="UTF-8">

<!-- 移动端适配（必须） -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- 语言 -->
<html lang="zh-CN">

<!-- SEO 描述（150 字以内，会显示在搜索结果中） -->
<meta name="description" content="校园VC — 10年推动100万大学生创业。提供数字创业教程、加密创投教程、创业社群和实战营。清华创业导师殷建松主理。">

<!-- 规范链接 -->
<link rel="canonical" href="https://www.xiaoyuanvc.com/">

<!-- Open Graph（社交分享） -->
<meta property="og:type" content="website">
<meta property="og:locale" content="zh_CN">
<meta property="og:site_name" content="校园VC">
<meta property="og:title" content="校园VC — 大学生创业教育">
<meta property="og:description" content="10年推动100万大学生创业。AI+Crypto 创业大学，数字创业教程与加密创投教程。">
<meta property="og:url" content="https://www.xiaoyuanvc.com/">
<meta property="og:image" content="https://www.xiaoyuanvc.com/og-image.png">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="校园VC — 大学生创业教育">
<meta name="twitter:description" content="10年推动100万大学生创业。AI+Crypto 创业大学。">

<!-- Favicon -->
<link rel="icon" href="/favicon.ico">
```

> 注意：OG 标签使用 `property` 属性，不是 `name`。

### 5. 首页 title 优化

当前：`校园VC-大学生创业教育`

建议改为（50-60 字符，核心关键词靠前）：

```html
<title>校园VC — 大学生AI+Crypto创业教育 | 数字创业教程</title>
```

### 6. 首页需要可抓取的 HTML 内容

当前首页对搜索引擎爬虫几乎不可见。可能原因：
- 页面内容完全由 JavaScript 渲染（SPA），爬虫拿不到内容
- 或者页面本身就是空壳

**搜索引擎需要看到的最低内容：**

```
- H1 标题（含核心关键词）
- 公司介绍段落（2-3 句话）
- 教程/产品链接（指向 learn.xiaoyuanvc.com）
- 创始人/团队信息
- 联系方式
```

**如果是 SPA 框架（React/Vue 等）：**
- 考虑使用 SSR（服务端渲染）或 SSG（静态生成）
- 或者至少为首页提供一个静态 HTML fallback
- 可用 Google Search Console 的「URL 检查」→「查看已抓取的网页」确认爬虫看到的内容

### 7. 添加指向 learn 站的链接

在首页明显位置添加：

```html
<a href="https://learn.xiaoyuanvc.com/">校园VC学习站 — 免费教程</a>
<a href="https://learn.xiaoyuanvc.com/zh/scb-tutorial/cognition/what-is-digital-entrepreneurship/">数字创业教程</a>
<a href="https://learn.xiaoyuanvc.com/zh/bitcoin-tutorial/start/chapter1-overview/">加密创投教程</a>
```

这能帮助：
- 搜索引擎发现 learn 子域的内容
- 从 www 主域传递权重到 learn 子域

---

## P2 — 建议（提升搜索表现）

### 8. 添加结构化数据（JSON-LD）

在首页 `<head>` 中添加：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "校园VC",
  "url": "https://www.xiaoyuanvc.com",
  "logo": "https://www.xiaoyuanvc.com/logo.png",
  "description": "10年推动100万大学生创业，AI+Crypto 创业大学",
  "founder": {
    "@type": "Person",
    "name": "殷建松",
    "jobTitle": "创始人",
    "affiliation": {
      "@type": "Organization",
      "name": "清华大学 x-lab"
    }
  },
  "sameAs": [
    "https://learn.xiaoyuanvc.com",
    "https://www.xiaoyuzhoufm.com/podcast/621ef071dade2c0f9ef1a6ab"
  ]
}
</script>
```

### 9. 添加法律/信任页面

搜索引擎（尤其 Google 的 E-E-A-T 评估）看重这些页面：

| 页面 | 路径建议 | 内容 |
|------|---------|------|
| 关于我们 | `/about` | 公司介绍、团队、使命 |
| 隐私政策 | `/privacy` | 数据收集和使用说明 |
| 联系我们 | `/contact` | 邮箱、微信、地址 |

### 10. HTTPS 一致性检查

确认以下跳转均正确：
- `http://xiaoyuanvc.com` → `https://www.xiaoyuanvc.com`
- `http://www.xiaoyuanvc.com` → `https://www.xiaoyuanvc.com`
- `https://xiaoyuanvc.com` → `https://www.xiaoyuanvc.com`

（或反向统一到不带 www 的版本，但要保持一致）

---

## 检查清单

完成后逐项打勾：

- [ ] robots.txt 添加 Sitemap 声明
- [ ] 创建 sitemap.xml
- [ ] 注册 Google Search Console 并提交 sitemap
- [ ] 注册百度站长平台并提交 sitemap
- [ ] `<head>` 补齐 charset/viewport/lang/description/canonical
- [ ] `<head>` 添加 OG 标签和 Twitter Card
- [ ] 优化 `<title>` 标签
- [ ] 确认首页有可抓取的静态 HTML 内容（非纯 JS 渲染）
- [ ] 首页添加指向 learn.xiaoyuanvc.com 的链接
- [ ] 添加 JSON-LD 结构化数据
- [ ] 添加关于/隐私/联系页面
- [ ] 验证 HTTP → HTTPS 和 www 跳转一致性

---

*如有疑问请联系 Jason。learn 站的 SEO 问题（sitemap、robots.txt、OG 标签）已修复并部署。*
