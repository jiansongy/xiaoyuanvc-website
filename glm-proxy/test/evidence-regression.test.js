"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildHeuristicLayer,
  buildInputSnapshot,
  calculateInputSimilarity,
  scoreStudentStartupSelfCheck,
  selectActionIdForDimension,
} = require("../lib/student-startup-self-check");

function draft(overrides) {
  return Object.assign({
    product: "帮助大学生在多个课程之间整理作业截止时间的学习任务管理工具",
    audience: "同时修读多门课程、需要协调小组作业的大二学生",
    model: "先免费提供个人任务整理，再验证小组协作订阅需求",
    stage: "只有想法",
    team: "计算机专业，有校园学习社群运营经验",
    validationPlan: "本周计划访谈8人，下周制作原型",
  }, overrides);
}

function evidenceFlags(layer) {
  return layer.triggeredRules.filter(function (rule) {
    return rule.key === "interviews" || rule.key === "mvp";
  }).map(function (rule) { return rule.hit; });
}

const reasoning = {
  dimensionScores: { problem: 4, wedge: 4, mvp: 4, team: 4, growth: 4 },
  dimensionRationales: {
    problem: "需要用户反馈。", wedge: "需要触达用户。", mvp: "需要实际测试。",
    team: "需要验证交付能力。", growth: "需要更多证据。",
  },
  overallSummary: "先完成一次小规模验证。",
  strengths: [], risks: ["缺少真实反馈"], sectorLabel: "校园学习",
};

async function withAI(run, fail) {
  const oldFetch = global.fetch;
  const oldKey = process.env.GLM_API_KEY;
  const requests = [];
  process.env.GLM_API_KEY = "test-only";
  global.fetch = async function (_url, options) {
    requests.push(JSON.parse(options.body));
    if (fail) throw new Error("synthetic offline failure");
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(reasoning) } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try { return await run(requests); }
  finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GLM_API_KEY;
    else process.env.GLM_API_KEY = oldKey;
  }
}

function history(input, mode) {
  const heuristicLayer = buildHeuristicLayer(buildInputSnapshot(input));
  if (mode === "obsolete") {
    heuristicLayer.triggeredRules.forEach(function (rule) {
      if (rule.key === "interviews" || rule.key === "mvp") rule.hit = true;
    });
  }
  const outputSnapshot = {
    finalDimensionScores: { problem: 9, wedge: 9, mvp: 9, team: 9, growth: 9 },
    heuristicLayer: heuristicLayer,
  };
  if (mode === "missing") delete outputSnapshot.heuristicLayer;
  return { versionId: "historical-original", inputSnapshot: input, outputSnapshot: outputSnapshot,
    createdAt: "2026-10-10T00:00:00.000Z", isShared: false };
}

function payload(input, entry) {
  return { toolId: "student-startup-self-check", toolState: { draftData: input },
    toolHistory: entry ? [entry] : [] };
}

test("plans, denials and product keywords do not count as stage evidence", function () {
  for (const validationPlan of [
    "尚未访谈用户，尚未制作原型", "本周计划访谈8人，下周制作原型",
    "已访谈8人，已制作原型", "已访谈8人，尚未付款", "已做出无人机原型",
  ]) {
    const snapshot = buildInputSnapshot(draft({ validationPlan: validationPlan }));
    assert.deepEqual(evidenceFlags(buildHeuristicLayer(snapshot)), [false, false], validationPlan);
    assert.equal(selectActionIdForDimension("problem", snapshot), "Action_001");
  }
  const namedWebsite = buildInputSnapshot(draft({
    product: "面向大学生学习任务整理的调研网站与小程序", validationPlan: "",
  }));
  assert.deepEqual(evidenceFlags(buildHeuristicLayer(namedWebsite)), [false, false]);
});

test("all five selected-stage mappings and time-bound plan credit remain intact", function () {
  for (const [stage, expected] of [
    ["只有想法", [false, false]], ["已做用户访谈", [true, false]],
    ["已做 MVP", [true, true]], ["已有用户", [true, true]], ["已有收入", [true, true]],
  ]) {
    const result = buildHeuristicLayer(buildInputSnapshot(draft({ stage: stage })));
    assert.deepEqual(evidenceFlags(result), expected, stage);
    assert.equal(result.triggeredRules.find(function (r) { return r.key === "time_bound_plan"; }).hit, true);
  }
});

for (const mode of ["obsolete", "missing"]) {
  for (const near of [false, true]) {
    test(`${mode} evidence history cannot ${near ? "recalibrate" : "reuse"} old scores`, async function () {
      const previous = draft();
      const input = near ? draft({ product: previous.product + "，先做课程提醒" }) : previous;
      assert.ok(calculateInputSimilarity(buildInputSnapshot(input), buildInputSnapshot(previous)) > 0.88);
      const entry = history(previous, mode);
      const request = payload(input, entry);
      const original = JSON.stringify(request);
      await withAI(async function (calls) {
        const result = await scoreStudentStartupSelfCheck(request);
        assert.equal(calls.length, 1, "no history recalibration call should occur");
        assert.equal(result.scoring.consistencyCheck.reusedPreviousScores, false);
        assert.equal(result.scoring.consistencyCheck.recalibrated, false);
        assert.equal(result.scoring.consistencyCheck.comparedVersionId, entry.versionId);
        assert.notDeepEqual(result.scoring.finalDimensionScores, entry.outputSnapshot.finalDimensionScores);
        assert.equal(JSON.stringify(request), original, "input and old history must not be rewritten");
        assert.deepEqual(result.toolHistory.find(function (h) { return h.versionId === entry.versionId; }), entry);
      });
    });
  }
}

test("compatible exact history keeps score reuse, including a style change", async function () {
  const input = draft();
  const entry = history(input, "compatible");
  const original = JSON.stringify(entry);
  await withAI(async function (calls) {
    const result = await scoreStudentStartupSelfCheck(payload(draft({ mode: "roast" }), entry));
    assert.equal(calls.length, 1);
    assert.equal(result.scoring.consistencyCheck.reusedPreviousScores, true);
    assert.deepEqual(result.scoring.finalDimensionScores, entry.outputSnapshot.finalDimensionScores);
    assert.equal(JSON.stringify(entry), original);
  });
});

test("compatible near history still uses the existing recalibration path", async function () {
  const input = draft();
  const entry = history(input, "compatible");
  await withAI(async function (calls) {
    const result = await scoreStudentStartupSelfCheck(payload(draft({ product: input.product + "，先做课程提醒" }), entry));
    assert.equal(calls.length, 2);
    assert.equal(result.scoring.consistencyCheck.recalibrated, true);
  });
});

test("AI failure does not turn planned work into existing-evidence strengths", async function () {
  await withAI(async function () {
    const result = await scoreStudentStartupSelfCheck(payload(draft()));
    assert.equal(result.scoring.consistencyCheck.fallback, true);
    assert.deepEqual(evidenceFlags(result.scoring.heuristicLayer), [false, false]);
    assert.ok(result.scoring.reasoningLayer.strengths.every(function (text) {
      return !/访谈|MVP/.test(text);
    }));
    assert.equal(result.scoring.actions.some(function (a) { return a.actionId === "Action_001"; }), true);
    assert.equal(result.scoring.gracefulDegradation.stage, "manual_checklist");
  }, true);
});
