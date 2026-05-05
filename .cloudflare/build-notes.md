# Cloudflare Pages 构建配置（PR 合入后必须改）

> 仓库已从「纯静态站点」升级为「主站 + VitePress 子站」混合部署。CF Pages Dashboard 必须同步更新构建命令与输出目录，否则线上不会出现 `/learn/`。

## 必须修改的两项

| 字段                       | 原值（旧） | 新值（必须改）  |
| -------------------------- | ---------- | --------------- |
| Build command              | （空）     | `bash build.sh` |
| Build output directory     | `/`（空）  | `dist`          |

## 可选

- Node.js version：≥ 18（VitePress 1.6 要求）
- 环境变量：无新增
- `_redirects` / `_headers`：仍保留在仓库根目录，`build.sh` 会原样复制到 `dist/` 顶层，行为不变。

## 验证清单（合入后）

- [ ] 访问 `https://xiaoyuanvc.com/` — 返回主站首页
- [ ] 访问 `https://xiaoyuanvc.com/learn/` — 返回 VitePress 学习站首页
- [ ] 访问 `https://xiaoyuanvc.com/learn/crypto-vc/start/chapter1-overview/` — 返回加密创投第一章概述
- [ ] 访问 `https://xiaoyuanvc.com/_redirects`（应仍生效，CF 自动处理）

## 本地验证

```bash
cd /Users/jasonyin/Desktop/Documents/Dev/XYVC
bash build.sh
ls dist/index.html dist/learn/index.html
```
