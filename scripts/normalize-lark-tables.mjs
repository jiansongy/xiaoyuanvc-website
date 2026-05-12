#!/usr/bin/env node
/**
 * normalize-lark-tables.mjs
 *
 * Converts <lark-table>...</lark-table> blocks (a leftover from older
 * 飞书文档 → 网页教程 exports) into standard Markdown tables. The first
 * <lark-tr> becomes the header row.
 *
 * VitePress (Vue) does not register <lark-table> as a component, so the
 * tags get silently dropped at build time — the table content disappears
 * entirely. Run this script after any new feishu export to normalize.
 *
 * Usage:
 *   node scripts/normalize-lark-tables.mjs              # dry run
 *   node scripts/normalize-lark-tables.mjs --apply      # write files
 *   node scripts/normalize-lark-tables.mjs --apply path/to/file.md ...
 *
 * Defaults: scans learn-src/docs/ recursively for *.md.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative } from "node:path";
import { readdirSync, statSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DEFAULT_SCAN = resolve(REPO_ROOT, "learn-src/docs");

const TABLE_RE = /<lark-table\b[^>]*>([\s\S]*?)<\/lark-table>/g;
const TR_RE = /<lark-tr\b[^>]*>([\s\S]*?)<\/lark-tr>/g;
const TD_RE = /<lark-td\b[^>]*>([\s\S]*?)<\/lark-td>/g;

function cleanCell(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
  return (lines.join("<br>") || " ").replaceAll("|", "\\|");
}

function larkToMd(block) {
  const rows = [];
  for (const trMatch of block.matchAll(TR_RE)) {
    const cells = [];
    for (const tdMatch of trMatch[1].matchAll(TD_RE)) {
      cells.push(cleanCell(tdMatch[1]));
    }
    rows.push(cells);
  }
  if (rows.length === 0) return null;
  const nCols = Math.max(...rows.map((r) => r.length));
  for (const r of rows) while (r.length < nCols) r.push(" ");
  const header = "| " + rows[0].join(" | ") + " |";
  const sep = "| " + Array(nCols).fill("---").join(" | ") + " |";
  const body = rows.slice(1).map((r) => "| " + r.join(" | ") + " |");
  return [header, sep, ...body].join("\n");
}

function convertFile(path, dryRun) {
  const text = readFileSync(path, "utf-8");
  const matches = [...text.matchAll(TABLE_RE)];
  if (matches.length === 0) return 0;
  // apply from end to start so offsets stay valid
  let out = text;
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const md = larkToMd(m[1]);
    if (md === null) continue;
    out = out.slice(0, m.index) + md + out.slice(m.index + m[0].length);
  }
  if (!dryRun) writeFileSync(path, out, "utf-8");
  return matches.length;
}

function walkMarkdown(root) {
  const results = [];
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".vitepress" || entry === "dist") continue;
      const full = resolve(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry.endsWith(".md")) results.push(full);
    }
  }
  walk(root);
  return results;
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const files = args.filter((a) => !a.startsWith("--"));
  const targets = files.length > 0 ? files.map((f) => resolve(f)) : walkMarkdown(DEFAULT_SCAN);

  let totalTables = 0;
  let touched = 0;
  for (const f of targets) {
    const n = convertFile(f, !apply);
    if (n > 0) {
      console.log(`  ${relative(REPO_ROOT, f)}: ${n} tables`);
      totalTables += n;
      touched += 1;
    }
  }
  console.log("");
  console.log(`Mode: ${apply ? "APPLIED" : "DRY-RUN"} | files touched: ${touched} | tables converted: ${totalTables}`);
}

main();
