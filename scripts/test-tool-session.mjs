import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script, createContext } from "node:vm";
const source = readFileSync(new URL("../resources/tool-session.js", import.meta.url), "utf8");
function fixture() {
  const values = new Map(), elements = new Map(); let failKey = "", navigated = "", accepted = true;
  const localStorage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => { if (k === failKey) throw new Error("quota"); values.set(k, v); }, removeItem: k => values.delete(k) };
  const document = { getElementById: id => elements.get(id), createElement: () => ({ style: {}, dataset: {}, setAttribute() {}, appendChild() {} }), body: { appendChild: el => elements.set(el.id, el) } };
  const scope = { window: {}, document, localStorage, confirm: () => accepted, location: { pathname: "/resources/find-your-idea", replace: url => { navigated = url; } }, setTimeout: () => 1, clearTimeout() {}, AbortController, DOMException, fetch: async () => ({ ok: true }) };
  new Script(source).runInContext(createContext(scope));
  return { session: scope.window.XYVCToolSession, values, elements, fail: k => { failKey = k; }, cancel: () => { accepted = false; }, navigation: () => navigated };
}
const sharedKey = "xyvc-unified-data-v2", key = "xyvc-find-idea-v1";
function seed(f) {
  f.values.set(key, JSON.stringify({ step: 4, ideas: ["old"] }));
  f.values.set(sharedKey, JSON.stringify({ tools: { "find-your-idea": { draftData: { marker: "old" }, history: [{ versionId: "kept" }], actionItems: ["old"] }, other: { draftData: { marker: "untouched" } } } }));
}
{
  const f = fixture(); seed(f); const token = f.session.token();
  assert.equal(f.session.reset("find-your-idea", key, { step: 0, ideas: [""] }), true);
  assert.equal(f.session.current(token), false);
  assert.equal(f.session.write(key, { ideas: ["late pagehide"] }), false);
  assert.deepEqual(JSON.parse(f.values.get(key)).ideas, [""]);
  const shared = JSON.parse(f.values.get(sharedKey));
  assert.deepEqual(shared.tools["find-your-idea"].history, [{ versionId: "kept" }]);
  assert.equal(shared.tools.other.draftData.marker, "untouched");
  assert.deepEqual(shared.tools["find-your-idea"].draftData, {});
  assert.equal(f.navigation(), "/resources/find-your-idea");
}
{
  const f = fixture(); seed(f); f.cancel(); const original = f.values.get(key);
  assert.equal(f.session.reset("find-your-idea", key, { step: 0 }), false);
  assert.equal(f.values.get(key), original); assert.equal(f.navigation(), "");
}
{
  const f = fixture(); seed(f); const oldShared = f.values.get(sharedKey), original = f.values.get(key); f.fail(key);
  assert.equal(f.session.reset("find-your-idea", key, { step: 0 }), false);
  assert.equal(f.values.get(sharedKey), oldShared); assert.equal(f.values.get(key), original);
  assert.equal(f.navigation(), ""); assert.equal(f.session.isResetting(), false);
}
{
  const f = fixture(); f.values.set(key, "{broken"); assert.equal(f.session.read(key), null);
  assert.equal(f.values.get(key), "{broken"); assert.equal(f.values.get(key + ":recovery"), "{broken");
  assert.equal(f.session.write(key, { step: 0 }), false);
}
console.log("PASS tool session: cancelled reset, late-save guard, history isolation, failed-write rollback and corrupt-record recovery");
