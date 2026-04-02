(function () {
  "use strict";

  var STORAGE_KEY = "xyvc-tool-context-v1";
  var TOOL_LABELS = {
    "student-startup-self-check": "学生创业自检",
    "find-your-idea": "发现你的创业想法",
    "find-what-you-want": "如何找到你想做的事",
    "hard-tech-check": "硬科技创业自检",
    "ai-ready-check": "AI 员工准备度自检",
    "ai-opportunity": "AI 创业机会探索器",
  };

  function safeTrim(value) {
    return String(value || "").trim();
  }

  function normalizeBasicInfo(input) {
    var source = input && typeof input === "object" ? input : {};
    return {
      major: safeTrim(source.major),
      grade: safeTrim(source.grade),
      teamSize: safeTrim(source.teamSize),
    };
  }

  function normalizeProjectContext(input) {
    var source = input && typeof input === "object" ? input : {};
    return {
      track: safeTrim(source.track),
      stage: safeTrim(source.stage),
      oneLiner: safeTrim(source.oneLiner),
      isHardTech: Boolean(source.isHardTech),
    };
  }

  function hasMeaningfulBasicInfo(info) {
    return Boolean(info.major || info.grade || info.teamSize);
  }

  function hasMeaningfulProjectContext(context) {
    return Boolean(
      context.track || context.stage || context.oneLiner || context.isHardTech,
    );
  }

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return {
        schemaVersion: 1,
        sourceToolId: safeTrim(parsed.sourceToolId),
        updatedAt: parsed.updatedAt || "",
        userProfile: {
          basicInfo: normalizeBasicInfo(
            parsed.userProfile && parsed.userProfile.basicInfo,
          ),
          lastActiveTool: safeTrim(
            parsed.userProfile && parsed.userProfile.lastActiveTool,
          ),
        },
        projectContext: normalizeProjectContext(parsed.projectContext),
      };
    } catch (e) {
      return null;
    }
  }

  function write(toolId, payload) {
    var current = read();
    var source = payload && typeof payload === "object" ? payload : {};
    var nextBasicInfo = normalizeBasicInfo(
      source.userProfile && source.userProfile.basicInfo,
    );
    var nextProjectContext = normalizeProjectContext(source.projectContext);

    if (
      !hasMeaningfulBasicInfo(nextBasicInfo) &&
      !hasMeaningfulProjectContext(nextProjectContext)
    ) {
      return current;
    }

    var next = {
      schemaVersion: 1,
      sourceToolId: safeTrim(toolId),
      updatedAt: new Date().toISOString(),
      userProfile: {
        basicInfo: nextBasicInfo,
        lastActiveTool:
          safeTrim(
            source.userProfile && source.userProfile.lastActiveTool,
          ) || safeTrim(toolId),
      },
      projectContext: nextProjectContext,
    };

    if (current) {
      next.userProfile.basicInfo = normalizeBasicInfo({
        major: next.userProfile.basicInfo.major || current.userProfile.basicInfo.major,
        grade: next.userProfile.basicInfo.grade || current.userProfile.basicInfo.grade,
        teamSize:
          next.userProfile.basicInfo.teamSize || current.userProfile.basicInfo.teamSize,
      });
      next.projectContext = normalizeProjectContext({
        track: next.projectContext.track || current.projectContext.track,
        stage: next.projectContext.stage || current.projectContext.stage,
        oneLiner: next.projectContext.oneLiner || current.projectContext.oneLiner,
        isHardTech:
          typeof source.projectContext === "object" &&
          typeof source.projectContext.isHardTech === "boolean"
            ? source.projectContext.isHardTech
            : current.projectContext.isHardTech,
      });
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      return current;
    }
    return next;
  }

  function getLabel(toolId) {
    return TOOL_LABELS[toolId] || toolId || "其他工具";
  }

  function hasProjectContext(context) {
    return Boolean(
      context &&
        context.projectContext &&
        (safeTrim(context.projectContext.oneLiner) ||
          safeTrim(context.projectContext.track) ||
          safeTrim(context.projectContext.stage)),
    );
  }

  window.XYVCToolContext = {
    STORAGE_KEY: STORAGE_KEY,
    TOOL_LABELS: TOOL_LABELS,
    getLabel: getLabel,
    hasProjectContext: hasProjectContext,
    read: read,
    write: write,
  };
})();
