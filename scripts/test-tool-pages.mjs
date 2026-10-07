import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tools = ["find-what-you-want", "find-your-idea", "rate-your-idea", "hard-tech-check", "entrecoach"];
for (const tool of tools) {
  const html = readFileSync(resolve(root, "dist/resources", `${tool}.html`), "utf8");
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=|application\/ld\+json/i.test(match[1])) continue;
    new Script(match[2], { filename: `${tool}.html` });
  }
  const searchScript = '<script src="/assets/site-search.js" defer></script>';
  assert.equal(html.split(searchScript).length - 1, 1, `${tool}: search script must be injected once`);
  assert.ok(html.indexOf(searchScript) > html.lastIndexOf("printWin.document.write("), `${tool}: search script must not enter the print template`);
  console.log(`PASS ${tool}: built scripts parse and search injection is outside print template`);
}
