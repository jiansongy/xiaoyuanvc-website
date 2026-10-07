import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'resources/entrecoach.html'), 'utf8');

function harness() {
  let source = html.slice(html.indexOf('(function () {'), html.lastIndexOf('</script>'));
  source = source.slice(0, source.indexOf('  /* ============================================================\n   * 启动'));
  source += `render = function () {};
    globalThis.coach = { parseDraft, escMarkdown, coachSystemPrompt, autoDraft, acceptMilestone, reset, contextSummary,
      state: function () { return S; }, status: function () { return aiStatus; }, busy: function () { return generating; } };
    })();`;
  const storage = new Map();
  const element = { addEventListener() {} };
  const context = vm.createContext({
    document: { getElementById() { return element; } }, window: {},
    localStorage: { getItem(k) { return storage.get(k) || null; }, setItem(k, v) { storage.set(k, v); }, removeItem(k) { storage.delete(k); } },
    setTimeout() { return 1; }, clearTimeout() {}, AbortController,
  });
  vm.runInContext(source, context);
  const api = context.coach;
  api.state().stage = 'coaching';
  api.state().idea = '帮助大学生第一次登台';
  return { api, context, storage };
}

function response(content) {
  return { ok: true, json: async () => ({ choices: [{ message: { content } }] }) };
}

const first = { team_name: '开场', team_roles: '组织、访谈、原型', one_line_idea: '帮大学生第一次登台（假设，待验证）' };

test('malformed, incomplete and wrong-type output cannot become a draft', () => {
  const { api } = harness();
  for (const value of ['{"team_name":', '[]', 'null', '{"team_name":"开场"}',
    JSON.stringify({ ...first, team_roles: {} }), JSON.stringify({ ...first, team_roles: ' ' }),
    JSON.stringify({ ...first, unknown: '错误字段' })]) {
    assert.throws(() => api.parseDraft(0, value), /AI 返回/);
  }
  assert.equal(api.parseDraft(0, JSON.stringify(first)).team_name, '开场');
});

test('legacy bracket definitions remain one escaped sentence', () => {
  const { api } = harness();
  const result = api.escMarkdown('【同学】在【报名时】因为【怯场】，很难【登台】<img src=x onerror=alert(1)>', 'problem_statement');
  assert.equal((result.match(/<p /g) || []).length, 1);
  assert.doesNotMatch(result, /blk-kv|<img|【|】/);
  assert.match(result, /同学在报名时因为怯场，很难登台/);
  assert.match(result, /&lt;img/);
});

test('failed updates and failed replacements preserve the previous draft', async () => {
  for (const instruction of ['', '只改队名']) {
    const { api, context } = harness();
    api.state().drafts.M1 = { ...first };
    context.fetch = async () => response('{"team_name":"新名字"}');
    await api.autoDraft(true, instruction);
    assert.equal(JSON.stringify(api.state().drafts.M1), JSON.stringify(first));
    assert.equal(api.status().kind, 'error');
    assert.equal(api.busy(), false);
  }
});

test('accept and duplicate calls are blocked while a draft is updating', async () => {
  const { api, context } = harness();
  api.state().drafts.M1 = { ...first };
  let finish;
  let calls = 0;
  context.fetch = (url, options) => {
    assert.equal(JSON.parse(options.body).response_format.type, 'json_object');
    calls++; return new Promise(resolve => { finish = resolve; });
  };
  const pending = api.autoDraft(true, '改队名');
  assert.equal(api.busy(), true);
  assert.equal(api.status().kind, 'loading');
  assert.equal(api.acceptMilestone(), null);
  assert.equal(api.state().milestoneIndex, 0);
  await api.autoDraft(true);
  assert.equal(calls, 1);
  finish(response(JSON.stringify({ ...first, team_name: '第一步' })));
  await pending;
  assert.equal(api.state().drafts.M1.team_name, '第一步');
  assert.equal(api.status().kind, 'success');
  assert.equal(api.busy(), false);
});

test('a response from before reset cannot overwrite a new session', async () => {
  const { api, context } = harness();
  let finish;
  context.fetch = () => new Promise(resolve => { finish = resolve; });
  const pending = api.autoDraft();
  api.reset();
  finish(response(JSON.stringify(first)));
  await pending;
  assert.equal(Object.keys(api.state().drafts).length, 0);
  assert.equal(api.state().stage, 'welcome');
  assert.equal(api.busy(), false);
});

test('a response cannot land after its milestone has changed', async () => {
  const { api, context } = harness();
  let finish;
  context.fetch = () => new Promise(resolve => { finish = resolve; });
  const pending = api.autoDraft();
  api.state().milestoneIndex = 1;
  finish(response(JSON.stringify(first)));
  await pending;
  assert.equal(Object.keys(api.state().drafts).length, 0);
});

test('incomplete legacy drafts cannot advance until repaired', () => {
  const { api } = harness();
  api.state().drafts.M1 = { team_name: '旧队名' };
  assert.equal(api.acceptMilestone(), null);
  assert.equal(api.state().milestoneIndex, 0);
});

test('accepted edits persist and enter the next milestone context', () => {
  const { api, storage } = harness();
  api.state().drafts.M1 = { ...first, one_line_idea: '帮助校内同学尝试开放麦' };
  assert.ok(api.acceptMilestone());
  assert.match(api.contextSummary(), /帮助校内同学尝试开放麦/);
  const saved = JSON.parse(storage.get('xyvc-entrecoach-v1'));
  assert.equal(saved.answers.M1.one_line_idea, '帮助校内同学尝试开放麦');
  assert.equal(saved.artifacts.M1.kind, 'simulation');
});

test('truncated completions cannot replace the previous draft', async () => {
  const { api, context } = harness();
  api.state().drafts.M1 = { ...first };
  context.fetch = async () => ({ ok: true, json: async () => ({ choices: [{ finish_reason: 'length', message: { content: JSON.stringify({ ...first, team_name: '截断' }) } }] }) });
  await api.autoDraft(true);
  assert.equal(api.state().drafts.M1.team_name, first.team_name);
  assert.match(api.status().message, /未生成完整结果/);
});
