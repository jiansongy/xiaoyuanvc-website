"use strict";

const TOOL_ID_STUDENT_STARTUP_SELF_CHECK = "student-startup-self-check";
const TOOL_ID_FIND_YOUR_IDEA = "find-your-idea";
const TOOL_ID_FIND_WHAT_YOU_WANT = "find-what-you-want";
const TOOL_ID_HARD_TECH_CHECK = "hard-tech-check";
const TOOL_ID_AI_READY_CHECK = "ai-ready-check";
const TOOL_ID_AI_OPPORTUNITY = "ai-opportunity";
const KNOWN_TOOL_IDS = [
  TOOL_ID_STUDENT_STARTUP_SELF_CHECK,
  TOOL_ID_FIND_YOUR_IDEA,
  TOOL_ID_FIND_WHAT_YOU_WANT,
  TOOL_ID_HARD_TECH_CHECK,
  TOOL_ID_AI_READY_CHECK,
  TOOL_ID_AI_OPPORTUNITY,
];

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return [
    prefix,
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 8),
  ].join("_");
}

function normalizeBasicInfo(input) {
  const info = input && typeof input === "object" ? input : {};
  return {
    major: String(info.major || "").trim(),
    grade: String(info.grade || "").trim(),
    teamSize: String(info.teamSize || "").trim(),
  };
}

function normalizeProjectContext(input) {
  const context = input && typeof input === "object" ? input : {};
  return {
    track: String(context.track || "").trim(),
    stage: String(context.stage || "").trim(),
    oneLiner: String(context.oneLiner || "").trim(),
    isHardTech: Boolean(context.isHardTech),
    teamSummary: String(context.teamSummary || "").trim(),
  };
}

function normalizeUserProfile(input) {
  const profile = input && typeof input === "object" ? input : {};
  return {
    uid: String(profile.uid || "anonymous").trim() || "anonymous",
    basicInfo: normalizeBasicInfo(profile.basicInfo),
    projectContext: normalizeProjectContext(profile.projectContext),
    lastActiveTool: String(profile.lastActiveTool || "").trim(),
  };
}

function normalizeToolState(input, toolId) {
  const state = input && typeof input === "object" ? input : {};
  return {
    toolId: String(toolId || state.toolId || "").trim(),
    draftData:
      state.draftData && typeof state.draftData === "object"
        ? state.draftData
        : {},
    updatedAt: state.updatedAt || nowIso(),
  };
}

function normalizeToolHistoryEntry(entry) {
  const source = entry && typeof entry === "object" ? entry : {};
  return {
    versionId: String(source.versionId || createId("ver")).trim(),
    inputSnapshot:
      source.inputSnapshot && typeof source.inputSnapshot === "object"
        ? source.inputSnapshot
        : {},
    outputSnapshot:
      source.outputSnapshot && typeof source.outputSnapshot === "object"
        ? source.outputSnapshot
        : {},
    isShared: Boolean(source.isShared),
    createdAt: source.createdAt || nowIso(),
  };
}

function normalizeActionItem(item) {
  const source = item && typeof item === "object" ? item : {};
  return {
    actionId: String(source.actionId || createId("action")).trim(),
    toolId: String(source.toolId || "").trim(),
    dimension: String(source.dimension || "").trim(),
    status: source.status === "已完成" ? "已完成" : "待办",
    customNote: String(source.customNote || "").trim(),
  };
}

function normalizeToolHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map(normalizeToolHistoryEntry)
    .sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

function syncProfileFromToolDraft(userProfile, toolId, draftData) {
  const profile = normalizeUserProfile(userProfile);
  const draft = draftData && typeof draftData === "object" ? draftData : {};

  profile.lastActiveTool = toolId;
  profile.projectContext = normalizeProjectContext({
    track: draft.track || profile.projectContext.track,
    stage: draft.stage || profile.projectContext.stage,
    oneLiner: draft.product || draft.oneLiner || profile.projectContext.oneLiner,
    teamSummary: draft.team || profile.projectContext.teamSummary,
    isHardTech:
      typeof draft.isHardTech === "boolean"
        ? draft.isHardTech
        : profile.projectContext.isHardTech,
  });

  profile.basicInfo = normalizeBasicInfo({
    major: draft.major || profile.basicInfo.major,
    grade: draft.grade || profile.basicInfo.grade,
    teamSize: draft.teamSize || profile.basicInfo.teamSize,
  });

  return profile;
}

function appendHistory(history, entry, maxEntries) {
  const limit = Number.isInteger(maxEntries) ? maxEntries : 20;
  const normalized = normalizeToolHistory(history);
  const next = [normalizeToolHistoryEntry(entry)].concat(normalized);
  return next.slice(0, limit);
}

function getLatestHistory(history) {
  const normalized = normalizeToolHistory(history);
  return normalized[0] || null;
}

function buildToolWorkspace(payload) {
  const toolId = payload.toolId || TOOL_ID_STUDENT_STARTUP_SELF_CHECK;
  const toolState = normalizeToolState(payload.toolState, toolId);
  const userProfile = syncProfileFromToolDraft(
    payload.userProfile,
    toolId,
    toolState.draftData,
  );

  return {
    toolId,
    userProfile,
    toolState,
    toolHistory: normalizeToolHistory(payload.toolHistory),
    actionItems: Array.isArray(payload.actionItems)
      ? payload.actionItems.map(normalizeActionItem)
      : [],
  };
}

module.exports = {
  KNOWN_TOOL_IDS,
  TOOL_ID_AI_OPPORTUNITY,
  TOOL_ID_AI_READY_CHECK,
  TOOL_ID_FIND_WHAT_YOU_WANT,
  TOOL_ID_FIND_YOUR_IDEA,
  TOOL_ID_HARD_TECH_CHECK,
  TOOL_ID_STUDENT_STARTUP_SELF_CHECK,
  appendHistory,
  buildToolWorkspace,
  createId,
  getLatestHistory,
  normalizeActionItem,
  normalizeToolHistory,
  normalizeToolHistoryEntry,
  normalizeToolState,
  normalizeUserProfile,
  nowIso,
  syncProfileFromToolDraft,
};
