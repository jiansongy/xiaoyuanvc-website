# Cloudflare Pages 切换指南

把 xiaoyuanvc.com 从 GitHub Pages 切到 Cloudflare Pages。零停机方案，可随时回滚。

## 仓库侧已准备好

- ✅ `CNAME` 文件（`xiaoyuanvc.com`）保留
- ✅ `_headers`（HSTS、CSP、X-Frame-Options 等）— Cloudflare Pages 会自动读
- ✅ `_redirects`（已更新为 Cloudflare 兼容语法）
- ✅ `404.html` — Cloudflare Pages 自动用作 404 兜底

## 你要做的（约 15-30 分钟）

### 第 1 步：在 Cloudflare Pages 连接仓库

1. 打开 https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
2. 授权 GitHub，选 `jiansongy/xiaoyuanvc-website` 仓库
3. **Build settings**：
   - Framework preset: **None**
   - Build command: 留空（这是纯静态站，不需要构建）
   - Build output directory: `/`（根目录；如果 UI 不接受 `/`，填 `.`）
   - Root directory: 留空或 `/`（仓库根目录）
4. Save and Deploy

第一次部署完，会拿到一个 `xiaoyuanvc-website.pages.dev` 临时域名。

### 第 2 步：用 .pages.dev 域名先验证

打开 `https://xiaoyuanvc-website.pages.dev`，挨个测：
- 首页 / `/student.html` / `/teacher.html` / `/resources/`
- 错误 URL 走到 404 页（如 `/foo`）
- 字体加载、JSON-LD、图片资源全 200
- F12 → Network 看 Response Headers 有没有 HSTS、CSP 等（应该有）

如果有问题，在仓库里改完 push，Cloudflare 自动重部署。

### 第 3 步：绑定自定义域名

1. CF Pages 项目 → Custom domains → Set up a custom domain
2. 添加 `xiaoyuanvc.com`
3. 如果要让 `www.xiaoyuanvc.com` 也可访问，添加 `www.xiaoyuanvc.com`
4. CF 会提示更新 DNS：
   - **根域名 `xiaoyuanvc.com` 要接到 Cloudflare Pages，官方推荐把这个域名作为 Cloudflare zone，并把域名注册商里的 nameservers 切到 Cloudflare。**
   - 如果 DNS 已经在 Cloudflare，CF 会自动创建 Pages 需要的 DNS 记录。
   - 如果 DNS 不在 Cloudflare，通常只能给子域名加 CNAME；根域名 apex 迁移会受 DNS 服务商能力限制。

注意：添加 `www.xiaoyuanvc.com` 不等于自动把 `www` 301 到根域名。要做 `www -> https://xiaoyuanvc.com` 的 301，需要在 Cloudflare 里单独配置 Bulk Redirect 或 Redirect Rule。

### 第 4 步：DNS 切换（这一步是真正的"上线"）

完成第 3 步后，CF 自动把 xiaoyuanvc.com 流量路由到 Pages。从 GH Pages 切到 CF Pages 是几分钟内完成的（DNS TTL）。

切换后用命令确认：

```bash
curl -I https://xiaoyuanvc.com/
curl -I https://xiaoyuanvc.com/resources.html
curl -I https://xiaoyuanvc.com/preview-v2/
```

期望看到：

- `https://xiaoyuanvc.com/` 返回 `200`，响应头不再是 `server: GitHub.com`。
- `https://xiaoyuanvc.com/resources.html` 返回 HTTP `301`，`location: /resources/` 或完整的 `https://xiaoyuanvc.com/resources/`。
- `https://xiaoyuanvc.com/preview-v2/` 返回 HTTP `301` 到首页。

### 第 5 步：禁用 GitHub Pages 部署（避免双部署冲突）

切换 24 小时后，确认 CF Pages 稳定服务，再做：

```bash
# 方法 A：删除 workflow 文件
rm .github/workflows/pages.yml
git add .github/workflows/pages.yml
git commit -m "chore: disable GitHub Pages deploy in favor of Cloudflare Pages"
git push

# 方法 B：仓库 Settings → Pages → Source 选 "None"
```

## 切换后立即生效的好处

1. **`_redirects` 真生效**：仓库里的 301 规则（`/resources.html` → `/resources/`，`preview-v2` → 首页等）会被执行
2. **`_headers` 真生效**：HSTS、X-Frame-Options、CSP 是 server header，安全等级提升一档
3. **国内访问加速**：CF 全球节点 vs GH Pages 单美国
4. **PR 预览**：每个 PR 自动生成预览域名，QA 友好
5. **回滚一键**：CF Pages 历史 deployment 可一键 rollback

## 紧急回滚

如果切换后发现严重问题：

1. CF Pages → Deployments → 选回上一个稳定版本 → Rollback
2. 或者：DNS 切回 GitHub Pages 原配置，等待 DNS 生效
3. 仓库代码不会被破坏，可以独立调试

## 风险点

- DNS TTL 期间（一般 5-15 分钟）流量会同时打到两边，但因为内容一致，用户无感
- HSTS 一旦生效，浏览器会强制 HTTPS 一年——切之前确认 SSL 证书 CF 这边已就绪（CF 会自动签发，等 5-10 分钟）

## 切换后的 deploy 流程变化

- 之前：`git push` → GH Actions → GH Pages
- 之后：`git push` → CF Pages 自动构建部署（更快）
- DEPLOY-PLAN.md 里的 deploy.sh 仍然是上线动作（mv 文件、改路径），CF 部署是上线之后的自动步骤
