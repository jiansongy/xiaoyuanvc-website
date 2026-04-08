"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  appendHistory,
  buildToolWorkspace,
  normalizeToolHistoryEntry,
} = require("../lib/data-store");

test("buildToolWorkspace normalizes the unified schema shape", function () {
  const workspace = buildToolWorkspace({
    toolId: "student-startup-self-check",
    userProfile: {
      uid: "u_123",
      basicInfo: { major: "计算机" },
    },
    toolState: {
      draftData: {
        product: "一个帮助大学生找兼职的平台",
        stage: "已做用户访谈",
      },
    },
  });

  assert.equal(workspace.toolId, "student-startup-self-check");
  assert.equal(workspace.userProfile.uid, "u_123");
  assert.equal(workspace.userProfile.projectContext.oneLiner, "一个帮助大学生找兼职的平台");
  assert.equal(workspace.userProfile.projectContext.stage, "已做用户访谈");
  assert.equal(workspace.userProfile.projectContext.teamSummary, "");
  assert.equal(workspace.toolState.toolId, "student-startup-self-check");
});

test("appendHistory prepends the latest version and keeps newest first", function () {
  const older = normalizeToolHistoryEntry({
    versionId: "ver_old",
    createdAt: "2026-04-01T10:00:00.000Z",
  });
  const newer = normalizeToolHistoryEntry({
    versionId: "ver_new",
    createdAt: "2026-04-02T10:00:00.000Z",
  });

  const history = appendHistory([older], newer, 5);
  assert.equal(history.length, 2);
  assert.equal(history[0].versionId, "ver_new");
  assert.equal(history[1].versionId, "ver_old");
});
