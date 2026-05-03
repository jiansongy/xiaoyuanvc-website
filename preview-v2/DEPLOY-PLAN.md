# Deploy Plan: preview-v2 → Production
Date: 2026-04-30
Working directory assumed: `/Users/jasonyin/Desktop/Documents/Dev/XYVC/`

---

## 前置备份清单

以下文件会被本次部署覆盖，部署前必须备份：

| 文件 | 备份命令 |
|---|---|
| `index.html` (根目录主页) | `cp index.html archive/index-2026-04-30.html` |
| `resources/index.html` (资源中心) | `cp resources/index.html archive/resources-index-2026-04-30.html` |

完整备份命令（在 XYVC/ 根目录执行）：
```bash
mkdir -p archive/2026-04-30
cp index.html archive/2026-04-30/index.html
cp resources/index.html archive/2026-04-30/resources-index.html
```

---

## 路径替换映射表

preview-v2 文件中所有路径均以 `../` 开头（相对父目录 XYVC/）。
搬迁后路径变化如下：

### index.html / student.html / teacher.html（移至 XYVC/ 根目录）

| preview-v2 原路径 | 上线路径 | 说明 |
|---|---|---|
| `../assets/...` | `assets/...` | 去掉 `../` |
| `../styles.css` | `styles.css` | 去掉 `../` |
| `../main.js` | `main.js` | 去掉 `../` |
| `href="student.html"` | 保持不变 | 同目录跳转 |
| `href="teacher.html"` | 保持不变 | 同目录跳转 |
| `href="resources.html"` | `href="resources/"` | 资源中心改为目录 URL |
| `href="resources.html#reading"` | `href="resources/#reading"` | 同上 |
| `href="resources.html#tools"` | `href="resources/#tools"` | 同上 |
| `href="resources.html#whitepaper"` | `href="resources/#whitepaper"` | 同上 |
| `href="index.html"` | 保持不变 | |
| `href="index.html#contact"` | 保持不变 | |
| `href="index.html#founder"` | 保持不变 | |

### resources.html（移至 XYVC/resources/index.html）

| preview-v2 原路径 | 上线路径 | 说明 |
|---|---|---|
| `../assets/...` | `../assets/...` | 进入 resources/ 后 `../` 正确指向 XYVC/assets/ — **保留** |
| `../styles.css` | `../styles.css` | **保留** |
| `../main.js` | `../main.js` | **保留** |
| `href="../index.html"` | `../index.html` | **保留** |
| `href="../index.html#contact"` | `../index.html#contact` | **保留** |
| `href="../index.html#founder"` | `../index.html#founder` | **保留** |
| `href="../resources/ai-era-entrepreneurship-skills.html"` | `ai-era-entrepreneurship-skills.html` | 去掉 `../resources/` — 同目录兄弟文件 |
| `href="../resources/find-your-idea.html"` | `find-your-idea.html` | 同上 |
| *(其余所有 `../resources/<file>.html`)* | `<file>.html` | 统一去掉 `../resources/` |
| `href="resources.html"` | `href="./"` | 资源中心自链改为当前目录 |
| `href="student.html"` | `href="../student.html"` | 从 `resources/` 返回根目录学生页 |
| `href="teacher.html"` | `href="../teacher.html"` | 从 `resources/` 返回根目录教师页 |

---

## 文件搬迁动作清单（不要执行，仅参考）

在 `XYVC/` 根目录执行，顺序重要：

```
1. mkdir -p archive/2026-04-30
2. cp index.html archive/2026-04-30/index.html
3. cp resources/index.html archive/2026-04-30/resources-index.html
4. mv preview-v2/index.html ./index.html
5. mv preview-v2/student.html ./student.html
6. mv preview-v2/teacher.html ./teacher.html
7. mv preview-v2/resources.html resources/index.html
```

---

## 路径替换 sed 命令

### index.html / student.html / teacher.html（在 XYVC/ 根目录执行）

```bash
# 去掉 ../ 前缀（assets、styles.css、main.js）
sed -i '' 's|"\.\./assets/|"assets/|g' index.html student.html teacher.html
sed -i '' 's|"\.\./styles\.css"|"styles.css"|g' index.html student.html teacher.html
sed -i '' 's|"\.\./main\.js"|"main.js"|g' index.html student.html teacher.html

# resources.html 链接 → resources/ 目录
sed -i '' 's|href="resources\.html#|href="resources/#|g' index.html student.html teacher.html
sed -i '' 's|href="resources\.html"|href="resources/"|g' index.html student.html teacher.html
```

### resources/index.html（在 XYVC/ 根目录执行）

```bash
# ../resources/<file>.html → <file>.html （兄弟文件，去掉 ../resources/ 前缀）
sed -i '' 's|href="\.\./resources/|href="|g' resources/index.html

# resources.html 自链 → 当前 resources/ 目录
sed -i '' 's|href="resources\.html"|href="./"|g' resources/index.html

# 根目录角色页链接从 resources/ 目录回跳
sed -i '' 's|href="student\.html"|href="../student.html"|g' resources/index.html
sed -i '' 's|href="teacher\.html"|href="../teacher.html"|g' resources/index.html

# ../assets/、../styles.css、../main.js、../index.html 保持不变，无需修改
```

---

## sitemap.xml 合并步骤

1. 检查 `sitemap.xml` 中是否已有 `student.html`、`teacher.html` 条目
2. 若无，在 `</urlset>` 前插入以下新条目：

```xml
  <url>
    <loc>https://xiaoyuanvc.com/student.html</loc>
    <lastmod>2026-04-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://xiaoyuanvc.com/teacher.html</loc>
    <lastmod>2026-04-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
```

3. 更新根 URL 和 `resources/` URL 的 `<lastmod>` 为 `2026-04-30`

---

## 回滚步骤

若部署后出现问题，在 XYVC/ 根目录执行：

```bash
cp archive/2026-04-30/index.html ./index.html
cp archive/2026-04-30/resources-index.html resources/index.html
# student.html 和 teacher.html 是全新文件，回滚只需删除
rm -f student.html teacher.html
```

提交回滚：
```bash
git add index.html resources/index.html
git rm --cached student.html teacher.html 2>/dev/null || true
git commit -m "rollback: restore pre-preview-v2 pages"
git push origin main
```
