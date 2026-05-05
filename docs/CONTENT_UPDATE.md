# 教程内容更新 SOP

## 加密教程（/learn/crypto-vc/）

**源文件位置**：`XYVC/learn-src/docs/crypto-vc/<chapter>/<lesson>/index.md`

**本地预览**：

```bash
cd XYVC/learn-src
npm run dev
# 访问 http://localhost:5173/learn/crypto-vc/
```

**发布流程**：编辑 index.md → commit → push → Cloudflare Pages 自动构建部署

**学霸笔记图片**：放至 `XYVC/learn-src/docs/public/images/{start|advanced}/<lesson>-notes.{jpeg|png}`，在 md 中用 `/images/start/<lesson>-notes.jpeg` 引用

---

## 数字创业教程（/learn/digital-startup/）

**内容母版**：飞书 Wiki [数创班课程](https://yl23q26jon.feishu.cn/wiki/HEeSwkKKZiJFVBkia2qcu40Lnfg)

**重新拉取**（`XYVC/scripts/pull-digital-startup.sh` 尚未生成，手动执行以下命令）：

```bash
# 1. 导出飞书文档为 docx，放入 /tmp/digital-startup-docx/chapter-N.docx
# 2. 转换为 Markdown（依赖 pandoc）
for i in 1 2 3 4 5; do
  pandoc /tmp/digital-startup-docx/chapter-${i}.docx \
    -o XYVC/learn-src/docs/digital-startup/chapter-${i}.md \
    --wrap=none
done
# 注意：lark-cli +media-download 要求 --output 是相对路径，绝对路径会被拒。
# 重新拉取脚本里 cd 到目标目录后再调用。
```

**拉取后必做**：人工 review 每个 chapter-N.md，检查以下段落是否被过滤干净：
- 作业说明
- Office hour 通知
- 团队项目描述

确认无误后 commit 整个 `digital-startup/` 目录。

---

## Cloudflare Pages 设置

| 项目 | 值 |
|------|----|
| Build command | `bash build.sh` |
| Build output directory | `dist` |
| Root directory | （留空） |

**构建失败回退**：Dashboard → Deployments → 找到上一个成功部署 → Rollback

---

## 紧急回退

**普通情况**：在 main 分支 push revert commit，CF Pages 自动重建

**极端情况**：
1. GitHub Actions → workflow_dispatch "Deploy to GitHub Pages"
2. 阿里云 DNS 将 A 记录切回 GH Pages（`185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153`）

---

## Sitemap 维护

新增教程页面后，手动在 `XYVC/sitemap.xml` 追加对应 `<url>` 条目，`lastmod` 填当天日期，然后在 Google Search Console 重新提交 `https://xiaoyuanvc.com/sitemap.xml`。
