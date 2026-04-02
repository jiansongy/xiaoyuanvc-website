"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  alignReasoningScoresToFinal,
  buildHeuristicLayer,
  buildInputSnapshot,
  calculateInputSimilarity,
  combineDimensionScores,
  getTotalScore,
  isExactSnapshotMatch,
} = require("../lib/student-startup-self-check");

test("heuristic layer rewards objective validation signals from the PRD", function () {
  const snapshot = buildInputSnapshot({
    product: "做一个帮助大学生找兼职的 AI 匹配平台，已经访谈过不少学生",
    audience: "大二到大三、想找兼职和实习的在校生",
    model: "向企业收招聘费，学生免费使用",
    stage: "已做 MVP",
    team: "计算机专业，两位成员都做过校园运营",
    validationPlan: "本周访谈 8 位学生，下周上线表单测试转化",
  });

  const heuristic = buildHeuristicLayer(snapshot);
  assert.equal(heuristic.score, 20);
  assert.ok(heuristic.dimensionScores.problem >= 7);
  assert.ok(heuristic.dimensionScores.mvp >= 8);
});

test("similarity stays high when the input only changes slightly", function () {
  const before = buildInputSnapshot({
    product: "帮助大学生找兼职的匹配平台",
    audience: "在校大学生",
    model: "企业付费，学生免费",
    stage: "已做用户访谈",
    team: "计算机专业",
    validationPlan: "本周做 10 次访谈",
  });
  const after = buildInputSnapshot({
    product: "帮助大学生找兼职的智能匹配平台",
    audience: "在校大学生",
    model: "企业付费，学生免费",
    stage: "已做用户访谈",
    team: "计算机专业",
    validationPlan: "本周做 10 次访谈",
  });

  assert.ok(calculateInputSimilarity(before, after) > 0.88);
});

test("final scores combine heuristic and reasoning with a 40/60 ratio", function () {
  const combined = combineDimensionScores(
    { problem: 8, wedge: 6, mvp: 7, team: 5, growth: 6 },
    { problem: 6, wedge: 7, mvp: 5, team: 8, growth: 7 },
  );

  assert.deepEqual(combined, {
    problem: 7,
    wedge: 7,
    mvp: 6,
    team: 7,
    growth: 7,
  });
  assert.equal(getTotalScore(combined), 34);
});

test("exact same input stays stable even if mode changes", function () {
  const gentle = buildInputSnapshot({
    product: "一个帮大学生整理课程作业和 ddl 的 AI 学习助手",
    audience: "课程多、容易拖延的大学生",
    model: "先免费获取用户，再提供协作和提醒订阅",
    stage: "已做用户访谈",
    team: "我有校园学习社群运营经验",
    validationPlan: "本周访谈 6 位学生，下周做 MVP",
    mode: "gentle",
  });
  const roast = buildInputSnapshot({
    product: "一个帮大学生整理课程作业和 ddl 的 AI 学习助手",
    audience: "课程多、容易拖延的大学生",
    model: "先免费获取用户，再提供协作和提醒订阅",
    stage: "已做用户访谈",
    team: "我有校园学习社群运营经验",
    validationPlan: "本周访谈 6 位学生，下周做 MVP",
    mode: "roast",
  });

  assert.equal(isExactSnapshotMatch(gentle, roast), true);
  assert.equal(calculateInputSimilarity(gentle, roast), 1);
});

test("reasoning scores can be aligned to keep the reused final score exact", function () {
  const heuristicScores = {
    problem: 7,
    wedge: 6,
    mvp: 8,
    team: 5,
    growth: 6,
  };
  const reasoningScores = {
    problem: 8,
    wedge: 8,
    mvp: 7,
    team: 8,
    growth: 7,
  };
  const targetFinalScores = {
    problem: 7,
    wedge: 6,
    mvp: 8,
    team: 6,
    growth: 6,
  };

  const aligned = alignReasoningScoresToFinal(
    heuristicScores,
    reasoningScores,
    targetFinalScores,
  );

  assert.deepEqual(
    combineDimensionScores(heuristicScores, aligned),
    targetFinalScores,
  );
});
