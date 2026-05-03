# preview-v2 Audit Report
Date: 2026-04-30

---

## 1. CSS Variable Completeness

### Variables used across the 4 HTML inline `<style>` blocks (23 total):

```
--color-accent-gold      --color-accent-green     --color-accent-purple
--color-bg-card          --color-bg-dark           --color-bg-secondary
--color-border           --color-brand             --color-brand-light
--color-text-primary     --color-text-secondary    --color-text-tertiary
--duration-fast          --duration-normal         --ease-out
--gradient-brand         --radius-full             --radius-lg
--radius-md              --radius-sm               --radius-xl
--shadow-lg              --shadow-md               --shadow-sm
```

### Missing from `XYVC/styles.css` :root block

| Variable | Used in | Fallback present? | Recommendation |
|---|---|---|---|
| `--color-border` | `resources.html` (6 places, border rules) | Partial — 3 of 6 have `rgba(0,0,0,0.06)` fallback | Add `--color-border: rgba(0,0,0,0.08);` to `:root` in `styles.css`. This matches the existing `--shadow-sm` style tone. Alternatively use `rgba(0,0,0,0.06)` to match the inline fallback already in resources.html. |

**`--color-bg-card`** — defined at line 12 of `styles.css` as `#ffffff`. Present. No issue.

### Action required
Add one line to `styles.css` `:root` block:
```css
--color-border: rgba(0, 0, 0, 0.08);
```

---

## 2. Logo Proportion Audit

Actual logo file dimensions (both `logo-color.png` and `logo-white.png`):
- **500 × 247 px** → aspect ratio = 500 ÷ 247 ≈ **2.024**

### Current HTML attributes vs correct values

| Location | File(s) | Current `width` | Current `height` | Correct width at that height | Status |
|---|---|---|---|---|---|
| nav `<img>` | index.html, resources.html | 113 | 40 | 40 × 2.024 = **81 px** | DISTORTED — width too wide by ~39% |
| nav `<img>` | student.html, teacher.html | 140 | 40 | 81 px | DISTORTED — even wider |
| footer `<img>` | all 4 files | 113 | 56 | 56 × 2.024 = **113 px** | CORRECT — matches ratio |

### Recommendations
- **nav**: change `width="113"` and `width="140"` to `width="81"` (keep `height="40"`).
  Or, drop explicit `width` and let CSS control it: `height: 40px; width: auto;`
- **footer**: `width="113" height="56"` is already correct — no change needed.

---

## 3. Other Issues Found

### 3a. Orphaned / unresolved internal links
The preview-v2 files use **two inconsistent href patterns** simultaneously:

| Pattern | Where | Issue |
|---|---|---|
| `href="student.html"` | All 4 files (nav links) | Relative to preview-v2/ — correct while files are in preview-v2/ |
| `href="../resources/ai-era-entrepreneurship-skills.html"` | resources.html | Points to parent XYVC/resources/ — works only before deploy |
| `href="../index.html#contact"` | resources.html | Will need to become `../index.html#contact` after resources.html moves to resources/ |

After deploy, `resources.html` becomes `resources/index.html`. All its `href="../resources/..."` links must become `href="<file>.html"` (sibling), and `href="../index.html"` links remain `../index.html` (one level up).

### 3b. Image missing `alt` attribute
`index.html` line ~326 contains a multi-line `<img>` tag (split across lines) that has `alt=""` — verified on second scan, it does have `alt`. **No actual missing alt tags found.**

### 3c. Asset `src="../assets/partners/shangdong-digital-valley.png"` — potential typo
Filename is `shangdong` (missing 'h'). The correct romanization of 山东 is **Shandong**. File exists with the typo name, so it works — but worth noting for future rename.

### 3d. `preview.css` and `preview.js` in preview-v2/
These two files (`preview-v2/preview.css`, `preview-v2/preview.js`) are not referenced by any of the 4 HTML files. They appear to be stale dev artifacts. Can be deleted before deploy.

### 3e. `href="https://top-east.com.cn/services/estate_view?id=14"` in resources.html
This looks like a test/placeholder link to a real estate listing site. Verify this is intentional.

### 3f. Dual `<h2>` tags in sections (deferred from previous audit)
Multiple sections use two `<h2>` elements within the same section — noted as P2 in prior audit (2026-04-26). Not blocking for deploy but degrades heading hierarchy for SEO/accessibility.
