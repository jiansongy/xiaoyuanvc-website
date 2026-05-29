#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DIST = path.resolve(__dirname, "..", "dist");
const SCRIPT = '<script src="/assets/site-search.js" defer></script>';

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "t") continue;
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) walk(file, files);
    else if (file.endsWith(".html")) files.push(file);
  }
  return files;
}

function inject(file) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("/assets/site-search.js")) return false;
  if (!/<\/body>/i.test(html)) return false;
  html = html.replace(/<\/body>/i, `  ${SCRIPT}\n</body>`);
  fs.writeFileSync(file, html);
  return true;
}

if (!fs.existsSync(DIST)) {
  throw new Error(`Missing dist directory: ${DIST}`);
}

const count = walk(DIST).filter(inject).length;
console.log(`Injected site search script into ${count} HTML files`);
