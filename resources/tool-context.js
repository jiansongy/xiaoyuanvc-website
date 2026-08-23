(function () {
  "use strict";

  var LEGACY_STORAGE_KEY = "xyvc-tool-context-v1";
  var STORAGE_KEY = "xyvc-unified-data-v2";
  var CURRENT_USER_KEY = "xyvc-current-user";
  var MAX_HISTORY = 20;
  var MAX_ANALYTICS_EVENTS = 200;
  var SHARE_PARAM = "xyvc_share";
  var SHARE_DATA_PARAM = "xyvc_share_data";

  var TOOL_LABELS = {
    "student-startup-self-check": "学生创业自检",
    "find-your-idea": "发现你的创业想法",
    "find-what-you-want": "如何找到你想做的事",
    "hard-tech-check": "硬科技创业自检",
    "ai-opportunity": "AI 创业机会探索器",
    "entrecoach": "创业教练",
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function safeTrim(value) {
    return String(value || "").trim();
  }

  function safeClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createId(prefix) {
    return [
      prefix,
      Date.now().toString(36),
      Math.random().toString(36).slice(2, 8),
    ].join("_");
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
      teamSummary: safeTrim(source.teamSummary),
    };
  }

  function normalizeUserProfile(input, fallbackUid) {
    var source = input && typeof input === "object" ? input : {};
    return {
      uid: safeTrim(source.uid) || safeTrim(fallbackUid) || "anonymous",
      basicInfo: normalizeBasicInfo(source.basicInfo),
      projectContext: normalizeProjectContext(source.projectContext),
      lastActiveTool: safeTrim(source.lastActiveTool),
    };
  }

  function normalizeActionItem(input, toolId) {
    var source = input && typeof input === "object" ? input : {};
    return {
      actionId: safeTrim(source.actionId) || createId("action"),
      toolId: safeTrim(source.toolId) || safeTrim(toolId),
      dimension: safeTrim(source.dimension),
      status: source.status === "已完成" ? "已完成" : "待办",
      customNote: safeTrim(source.customNote),
    };
  }

  function normalizeHistoryEntry(input) {
    var source = input && typeof input === "object" ? input : {};
    return {
      versionId: safeTrim(source.versionId) || createId("ver"),
      inputSnapshot:
        source.inputSnapshot && typeof source.inputSnapshot === "object"
          ? safeClone(source.inputSnapshot)
          : {},
      outputSnapshot:
        source.outputSnapshot && typeof source.outputSnapshot === "object"
          ? safeClone(source.outputSnapshot)
          : {},
      isShared: Boolean(source.isShared),
      shareId: safeTrim(source.shareId),
      createdAt: source.createdAt || nowIso(),
    };
  }

  function normalizeHistoryList(list) {
    if (!Array.isArray(list)) return [];
    return list
      .map(normalizeHistoryEntry)
      .sort(function (a, b) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, MAX_HISTORY);
  }

  function normalizeToolBucket(toolId, input) {
    var source = input && typeof input === "object" ? input : {};
    return {
      toolId: safeTrim(toolId),
      label: TOOL_LABELS[toolId] || toolId,
      draftData:
        source.draftData && typeof source.draftData === "object"
          ? safeClone(source.draftData)
          : {},
      updatedAt: source.updatedAt || "",
      history: normalizeHistoryList(source.history),
      actionItems: Array.isArray(source.actionItems)
        ? source.actionItems.map(function (item) {
            return normalizeActionItem(item, toolId);
          })
        : [],
      lastShareId: safeTrim(source.lastShareId),
    };
  }

  function normalizeShareSnapshot(input) {
    var source = input && typeof input === "object" ? input : {};
    return {
      shareId: safeTrim(source.shareId) || createId("share"),
      toolId: safeTrim(source.toolId),
      title: safeTrim(source.title),
      payload:
        source.payload && typeof source.payload === "object"
          ? safeClone(source.payload)
          : {},
      createdAt: source.createdAt || nowIso(),
    };
  }

  function normalizeAnalyticsEvent(input) {
    var source = input && typeof input === "object" ? input : {};
    return {
      eventId: safeTrim(source.eventId) || createId("evt"),
      toolId: safeTrim(source.toolId),
      eventName: safeTrim(source.eventName),
      payload:
        source.payload && typeof source.payload === "object"
          ? safeClone(source.payload)
          : {},
      createdAt: source.createdAt || nowIso(),
    };
  }

  function buildDefaultTools() {
    var tools = {};
    Object.keys(TOOL_LABELS).forEach(function (toolId) {
      tools[toolId] = normalizeToolBucket(toolId);
    });
    return tools;
  }

  function readCurrentUser() {
    try {
      if (window.__XYVC_CURRENT_USER__ && typeof window.__XYVC_CURRENT_USER__ === "object") {
        return normalizeUserProfile(window.__XYVC_CURRENT_USER__);
      }
      var raw = localStorage.getItem(CURRENT_USER_KEY);
      if (!raw) return normalizeUserProfile({ uid: "anonymous" });
      return normalizeUserProfile(JSON.parse(raw));
    } catch (e) {
      return normalizeUserProfile({ uid: "anonymous" });
    }
  }

  function buildDefaultWorkspace() {
    var currentUser = readCurrentUser();
    return {
      schemaVersion: 2,
      updatedAt: "",
      userProfile: normalizeUserProfile(currentUser, currentUser.uid),
      tools: buildDefaultTools(),
      shareSnapshots: {},
      analytics: {
        events: [],
        counters: {},
      },
      sync: {
        pendingLocalMerge: null,
        lastMergedAt: "",
      },
    };
  }

  function mergeCounterMap(target, patch) {
    var next = target && typeof target === "object" ? target : {};
    var source = patch && typeof patch === "object" ? patch : {};
    Object.keys(source).forEach(function (key) {
      var current = Number(next[key] || 0);
      next[key] = current + Number(source[key] || 0);
    });
    return next;
  }

  function migrateLegacyWorkspace() {
    var workspace = buildDefaultWorkspace();
    try {
      var raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return workspace;
      var legacy = JSON.parse(raw);
      if (!legacy || typeof legacy !== "object") return workspace;

      workspace.updatedAt = legacy.updatedAt || "";
      workspace.userProfile = normalizeUserProfile(
        {
          uid: (legacy.userProfile && legacy.userProfile.uid) || workspace.userProfile.uid,
          basicInfo: legacy.userProfile && legacy.userProfile.basicInfo,
          projectContext: legacy.projectContext,
          lastActiveTool: legacy.userProfile && legacy.userProfile.lastActiveTool,
        },
        workspace.userProfile.uid,
      );

      var sourceToolId = safeTrim(legacy.sourceToolId);
      if (sourceToolId) {
        workspace.tools[sourceToolId] = normalizeToolBucket(sourceToolId, {
          draftData: {},
          updatedAt: legacy.updatedAt || "",
        });
      }
      return workspace;
    } catch (e) {
      return workspace;
    }
  }

  function normalizeWorkspace(input) {
    if (!input || typeof input !== "object") {
      return migrateLegacyWorkspace();
    }

    var currentUser = readCurrentUser();
    var workspace = buildDefaultWorkspace();
    workspace.schemaVersion = 2;
    workspace.updatedAt = safeTrim(input.updatedAt);
    workspace.userProfile = normalizeUserProfile(
      input.userProfile,
      currentUser.uid || "anonymous",
    );

    var tools = buildDefaultTools();
    if (input.tools && typeof input.tools === "object") {
      Object.keys(input.tools).forEach(function (toolId) {
        tools[toolId] = normalizeToolBucket(toolId, input.tools[toolId]);
      });
    }
    workspace.tools = tools;

    if (input.shareSnapshots && typeof input.shareSnapshots === "object") {
      Object.keys(input.shareSnapshots).forEach(function (shareId) {
        workspace.shareSnapshots[shareId] = normalizeShareSnapshot(
          input.shareSnapshots[shareId],
        );
      });
    }

    var analytics = input.analytics && typeof input.analytics === "object" ? input.analytics : {};
    workspace.analytics.events = Array.isArray(analytics.events)
      ? analytics.events
          .map(normalizeAnalyticsEvent)
          .sort(function (a, b) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .slice(0, MAX_ANALYTICS_EVENTS)
      : [];
    workspace.analytics.counters = mergeCounterMap({}, analytics.counters);

    workspace.sync = {
      pendingLocalMerge:
        input.sync &&
        input.sync.pendingLocalMerge &&
        typeof input.sync.pendingLocalMerge === "object"
          ? safeClone(input.sync.pendingLocalMerge)
          : null,
      lastMergedAt: safeTrim(input.sync && input.sync.lastMergedAt),
    };

    return workspace;
  }

  function readWorkspace() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return migrateLegacyWorkspace();
      return normalizeWorkspace(JSON.parse(raw));
    } catch (e) {
      return migrateLegacyWorkspace();
    }
  }

  function writeWorkspace(workspace) {
    var normalized = normalizeWorkspace(workspace);
    normalized.updatedAt = nowIso();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      return normalized;
    }
    return normalized;
  }

  function hasMeaningfulBasicInfo(info) {
    return Boolean(info.major || info.grade || info.teamSize);
  }

  function hasMeaningfulProjectContext(context) {
    return Boolean(
      context.track ||
        context.stage ||
        context.oneLiner ||
        context.teamSummary ||
        context.isHardTech,
    );
  }

  function ensureToolBucket(workspace, toolId) {
    if (!workspace.tools[toolId]) {
      workspace.tools[toolId] = normalizeToolBucket(toolId);
    }
    return workspace.tools[toolId];
  }

  function mergeProfile(target, patch, toolId) {
    var current = normalizeUserProfile(target);
    var source = patch && typeof patch === "object" ? patch : {};
    var nextBasicInfo = normalizeBasicInfo(source.basicInfo);
    var nextProjectContext = normalizeProjectContext(
      source.projectContext || source,
    );

    current.uid = safeTrim(source.uid) || current.uid;
    current.basicInfo = normalizeBasicInfo({
      major: nextBasicInfo.major || current.basicInfo.major,
      grade: nextBasicInfo.grade || current.basicInfo.grade,
      teamSize: nextBasicInfo.teamSize || current.basicInfo.teamSize,
    });
    current.projectContext = normalizeProjectContext({
      track: nextProjectContext.track || current.projectContext.track,
      stage: nextProjectContext.stage || current.projectContext.stage,
      oneLiner: nextProjectContext.oneLiner || current.projectContext.oneLiner,
      teamSummary:
        nextProjectContext.teamSummary || current.projectContext.teamSummary,
      isHardTech:
        typeof nextProjectContext.isHardTech === "boolean"
          ? nextProjectContext.isHardTech
          : current.projectContext.isHardTech,
    });
    current.lastActiveTool = safeTrim(toolId) || current.lastActiveTool;
    return current;
  }

  function maybeQueueLocalMerge(workspace) {
    var currentUser = readCurrentUser();
    var userChanged =
      currentUser.uid &&
      currentUser.uid !== "anonymous" &&
      workspace.userProfile.uid !== currentUser.uid;

    if (!userChanged) {
      return workspace;
    }

    var hasLocalData =
      hasMeaningfulBasicInfo(workspace.userProfile.basicInfo) ||
      hasMeaningfulProjectContext(workspace.userProfile.projectContext) ||
      Object.keys(workspace.shareSnapshots).length > 0 ||
      Object.keys(workspace.tools || {}).some(function (toolId) {
        var tool = workspace.tools[toolId];
        return (
          tool &&
          (Object.keys(tool.draftData || {}).length > 0 ||
            (tool.history && tool.history.length > 0) ||
            (tool.actionItems && tool.actionItems.length > 0))
        );
      });

    if (hasLocalData) {
      workspace.sync.pendingLocalMerge = {
        sourceUid: workspace.userProfile.uid || "anonymous",
        targetUid: currentUser.uid,
        createdAt: nowIso(),
        summary:
          safeTrim(workspace.userProfile.projectContext.oneLiner) ||
          "本地有一份未同步的互动工具记录",
      };
    }

    workspace.userProfile.uid = currentUser.uid;
    return workspace;
  }

  function getLatestContext(toolId) {
    var workspace = readWorkspace();
    var sourceToolId = safeTrim(toolId) || workspace.userProfile.lastActiveTool;
    return {
      schemaVersion: workspace.schemaVersion,
      sourceToolId: sourceToolId,
      updatedAt: workspace.updatedAt,
      userProfile: {
        uid: workspace.userProfile.uid,
        basicInfo: normalizeBasicInfo(workspace.userProfile.basicInfo),
        lastActiveTool: workspace.userProfile.lastActiveTool,
      },
      projectContext: normalizeProjectContext(workspace.userProfile.projectContext),
    };
  }

  function writeContext(toolId, payload) {
    var workspace = readWorkspace();
    var tool = ensureToolBucket(workspace, toolId);
    var source = payload && typeof payload === "object" ? payload : {};

    if (source.toolState && source.toolState.draftData) {
      tool.draftData = safeClone(source.toolState.draftData);
      tool.updatedAt = source.toolState.updatedAt || nowIso();
    } else if (source.draftData && typeof source.draftData === "object") {
      tool.draftData = safeClone(source.draftData);
      tool.updatedAt = nowIso();
    }

    workspace.userProfile = mergeProfile(
      workspace.userProfile,
      {
        uid: source.userProfile && source.userProfile.uid,
        basicInfo: source.userProfile && source.userProfile.basicInfo,
        projectContext: source.projectContext || (source.userProfile && source.userProfile.projectContext),
      },
      toolId,
    );

    workspace = maybeQueueLocalMerge(workspace);
    return writeWorkspace(workspace);
  }

  function saveToolState(toolId, draftData, extraPayload) {
    var workspace = readWorkspace();
    var tool = ensureToolBucket(workspace, toolId);
    tool.draftData = draftData && typeof draftData === "object" ? safeClone(draftData) : {};
    tool.updatedAt = nowIso();
    if (extraPayload && extraPayload.actionItems) {
      tool.actionItems = extraPayload.actionItems.map(function (item) {
        return normalizeActionItem(item, toolId);
      });
    }
    workspace.userProfile = mergeProfile(
      workspace.userProfile,
      {
        uid: extraPayload && extraPayload.uid,
        basicInfo: extraPayload && extraPayload.basicInfo,
        projectContext: extraPayload && extraPayload.projectContext,
      },
      toolId,
    );
    workspace = maybeQueueLocalMerge(workspace);
    return writeWorkspace(workspace);
  }

  function clearToolState(toolId) {
    var workspace = readWorkspace();
    if (workspace.tools[toolId]) {
      workspace.tools[toolId] = normalizeToolBucket(toolId);
    }
    if (
      workspace.userProfile &&
      workspace.userProfile.lastActiveTool === toolId
    ) {
      workspace.userProfile.lastActiveTool = "";
    }
    return writeWorkspace(workspace);
  }

  function appendToolHistory(toolId, entry, maxEntries) {
    var workspace = readWorkspace();
    var tool = ensureToolBucket(workspace, toolId);
    var limit = Number.isFinite(maxEntries) ? Number(maxEntries) : MAX_HISTORY;
    tool.history = [normalizeHistoryEntry(entry)]
      .concat(tool.history || [])
      .sort(function (a, b) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);
    tool.updatedAt = nowIso();
    workspace.userProfile.lastActiveTool = toolId;
    return writeWorkspace(workspace).tools[toolId].history;
  }

  function markHistoryEntryShared(toolId, versionId, shareId) {
    var workspace = readWorkspace();
    var tool = ensureToolBucket(workspace, toolId);
    tool.history = (tool.history || []).map(function (entry) {
      if (entry.versionId !== versionId) return entry;
      var next = normalizeHistoryEntry(entry);
      next.isShared = true;
      next.shareId = shareId;
      return next;
    });
    tool.lastShareId = shareId;
    writeWorkspace(workspace);
  }

  function encodeSharePayload(data) {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(data))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
    } catch (e) {
      return "";
    }
  }

  function decodeSharePayload(encoded) {
    try {
      var normalized = String(encoded || "")
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      while (normalized.length % 4) normalized += "=";
      return JSON.parse(decodeURIComponent(escape(atob(normalized))));
    } catch (e) {
      return null;
    }
  }

  function buildShareUrl(baseUrl, shareId, portableData) {
    var url = new URL(baseUrl || window.location.href, window.location.href);
    url.searchParams.delete(SHARE_PARAM);
    url.searchParams.delete(SHARE_DATA_PARAM);
    if (portableData) {
      url.searchParams.set(SHARE_DATA_PARAM, portableData);
    } else if (shareId) {
      url.searchParams.set(SHARE_PARAM, shareId);
    }
    return url.toString();
  }

  function createShareSnapshot(toolId, payload, options) {
    var workspace = readWorkspace();
    var snapshot = normalizeShareSnapshot({
      shareId: createId("share"),
      toolId: toolId,
      title: options && options.title,
      payload: payload,
      createdAt: nowIso(),
    });

    workspace.shareSnapshots[snapshot.shareId] = snapshot;
    ensureToolBucket(workspace, toolId).lastShareId = snapshot.shareId;
    writeWorkspace(workspace);

    if (options && options.versionId) {
      markHistoryEntryShared(toolId, options.versionId, snapshot.shareId);
    }

    var portablePayload = {
      schemaVersion: 1,
      shareId: snapshot.shareId,
      toolId: snapshot.toolId,
      title: snapshot.title,
      createdAt: snapshot.createdAt,
      payload: snapshot.payload,
    };
    var encoded = encodeSharePayload(portablePayload);
    var usePortable = encoded && encoded.length <= 1800;

    return {
      shareId: snapshot.shareId,
      snapshot: snapshot,
      url: buildShareUrl(
        options && options.baseUrl,
        usePortable ? "" : snapshot.shareId,
        usePortable ? encoded : "",
      ),
      portable: Boolean(usePortable),
    };
  }

  function readShareSnapshot(shareId) {
    var workspace = readWorkspace();
    if (!shareId) return null;
    return workspace.shareSnapshots[shareId]
      ? normalizeShareSnapshot(workspace.shareSnapshots[shareId])
      : null;
  }

  function readShareSnapshotFromLocation(loc) {
    try {
      var url = new URL(loc || window.location.href, window.location.href);
      var encoded = url.searchParams.get(SHARE_DATA_PARAM);
      if (encoded) {
        return decodeSharePayload(encoded);
      }
      var shareId = url.searchParams.get(SHARE_PARAM);
      return readShareSnapshot(shareId);
    } catch (e) {
      return null;
    }
  }

  function track(toolId, eventName, payload) {
    var workspace = readWorkspace();
    var event = normalizeAnalyticsEvent({
      toolId: toolId,
      eventName: eventName,
      payload: payload,
      createdAt: nowIso(),
    });
    workspace.analytics.events.unshift(event);
    workspace.analytics.events = workspace.analytics.events.slice(
      0,
      MAX_ANALYTICS_EVENTS,
    );

    var key = [toolId || "global", eventName].join(":");
    workspace.analytics.counters = mergeCounterMap(workspace.analytics.counters, {
      [key]: 1,
    });
    writeWorkspace(workspace);

    if (typeof window.gtag === "function") {
      try {
        window.gtag("event", eventName, Object.assign({ tool_id: toolId || "" }, payload || {}));
      } catch (e) {
        /* ignore analytics failures */
      }
    }

    return event;
  }

  function getAnalyticsSummary(toolId) {
    var workspace = readWorkspace();
    var counters = workspace.analytics.counters || {};
    var prefix = safeTrim(toolId);
    var summary = {};
    Object.keys(counters).forEach(function (key) {
      if (!prefix || key.indexOf(prefix + ":") === 0) {
        summary[key] = counters[key];
      }
    });
    return summary;
  }

  function setCurrentUser(profile) {
    try {
      localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(normalizeUserProfile(profile)),
      );
    } catch (e) {
      /* ignore */
    }
    var workspace = readWorkspace();
    workspace = maybeQueueLocalMerge(workspace);
    writeWorkspace(workspace);
    return readCurrentUser();
  }

  function clearPendingMerge() {
    var workspace = readWorkspace();
    workspace.sync.pendingLocalMerge = null;
    workspace.sync.lastMergedAt = nowIso();
    writeWorkspace(workspace);
  }

  function getPendingMerge() {
    return readWorkspace().sync.pendingLocalMerge;
  }

  function hasProjectContext(context) {
    return Boolean(
      context &&
        context.projectContext &&
        (safeTrim(context.projectContext.oneLiner) ||
          safeTrim(context.projectContext.track) ||
          safeTrim(context.projectContext.stage) ||
          safeTrim(context.projectContext.teamSummary)),
    );
  }

  function getToolState(toolId) {
    var workspace = readWorkspace();
    return safeClone(ensureToolBucket(workspace, toolId));
  }

  function getToolHistory(toolId) {
    return getToolState(toolId).history || [];
  }

  function getLabel(toolId) {
    return TOOL_LABELS[toolId] || toolId || "其他工具";
  }

  var manager = {
    STORAGE_KEY: STORAGE_KEY,
    LEGACY_STORAGE_KEY: LEGACY_STORAGE_KEY,
    TOOL_LABELS: TOOL_LABELS,
    getLabel: getLabel,
    getWorkspace: readWorkspace,
    writeContext: writeContext,
    saveToolState: saveToolState,
    clearToolState: clearToolState,
    getToolState: getToolState,
    appendToolHistory: appendToolHistory,
    getToolHistory: getToolHistory,
    createShareSnapshot: createShareSnapshot,
    readShareSnapshot: readShareSnapshot,
    readShareSnapshotFromLocation: readShareSnapshotFromLocation,
    track: track,
    getAnalyticsSummary: getAnalyticsSummary,
    setCurrentUser: setCurrentUser,
    getCurrentUser: readCurrentUser,
    getPendingMerge: getPendingMerge,
    clearPendingMerge: clearPendingMerge,
  };

  window.XYVCUnifiedDataManager = manager;

  window.XYVCToolContext = {
    STORAGE_KEY: STORAGE_KEY,
    TOOL_LABELS: TOOL_LABELS,
    getLabel: getLabel,
    hasProjectContext: hasProjectContext,
    read: getLatestContext,
    write: writeContext,
    getWorkspace: readWorkspace,
    saveToolState: saveToolState,
    clearToolState: clearToolState,
    appendToolHistory: appendToolHistory,
    createShareSnapshot: createShareSnapshot,
    readShareSnapshotFromLocation: readShareSnapshotFromLocation,
    track: track,
    getPendingMerge: getPendingMerge,
    clearPendingMerge: clearPendingMerge,
    setCurrentUser: setCurrentUser,
  };
})();
