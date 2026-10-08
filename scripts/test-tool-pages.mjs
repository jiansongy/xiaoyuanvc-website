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
  for (const shared of ["tool-session.js", "tool-shell.js"]) {
    assert.ok(html.includes(`src="./${shared}"`) || html.includes(`src="/resources/${shared}"`), `${tool}: shared ${shared} must load`);
  }
  const searchScript = '<script src="/assets/site-search.js" defer></script>';
  assert.equal(html.split(searchScript).length - 1, 1, `${tool}: search script must be injected once`);
  assert.ok(html.indexOf(searchScript) > html.lastIndexOf("printWin.document.write("), `${tool}: search script must not enter the print template`);
  console.log(`PASS ${tool}: built scripts parse and search injection is outside print template`);
}

for (const shared of ["tool-session.js", "tool-shell.js"]) {
  new Script(readFileSync(resolve(root, "dist/resources", shared), "utf8"), { filename: shared });
}
console.log("PASS shared tool session and shell scripts parse");

const redirectRules = readFileSync(resolve(root, "_redirects"), "utf8");
const originSync = readFileSync(resolve(root, "scripts/xyvc-sync.sh"), "utf8");
for (const tool of tools) {
  assert.ok(redirectRules.includes(`/resources/${tool}/ /resources/${tool} 301`));
  assert.ok(originSync.includes(`location = /resources/${tool}/ { return 301 /resources/${tool}$is_args$args; }`));
}
console.log("PASS five trailing-slash links normalize on both origins and retain query parameters");
