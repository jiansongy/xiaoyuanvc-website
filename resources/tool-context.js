(function () {
  "use strict";

  var LEGACY_STORAGE_KEY = "xyvc-tool-context-v1";
  var STORAGE_KEY = "xyvc-unified-data-v2";
  var CURRENT_USER_KEY = "xyvc-current-user";
  var MAX_HISTORY = 20;
  var MAX_ANALYTICS_EVENTS = 200;
  var SHARE_PARAM = "xyvc_share";
  var SHARE_DATA_PARAM = "xyvc_share_data";
  var MAX_PORTABLE_SHARE_LENGTH = 1800;

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
      var saved = window.XYVCToolSession ? window.XYVCToolSession.read(STORAGE_KEY) : JSON.parse(raw);
      return normalizeWorkspace(saved || {});
    } catch (e) {
      return migrateLegacyWorkspace();
    }
  }

  function writeWorkspace(workspace) {
    var normalized = normalizeWorkspace(workspace);
    normalized.updatedAt = nowIso();
    try {
      if (window.XYVCToolSession) {
        if (!window.XYVCToolSession.write(STORAGE_KEY, normalized)) throw new Error("共享记录未能保存");
      } else localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      throw e;
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
    if (!encoded) return null;
    try {
      var normalized = encoded
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      while (normalized.length % 4) normalized += "=";
      var decoded = JSON.parse(decodeURIComponent(escape(atob(normalized))));
      return decoded && decoded.schemaVersion === 1 && typeof decoded.toolId === "string" &&
        decoded.payload && typeof decoded.payload === "object" ? decoded : null;
    } catch (e) {
      return null;
    }
  }

  function buildShareUrl(baseUrl, portableData) {
    var url = new URL(baseUrl || window.location.href, window.location.href);
    url.searchParams.delete(SHARE_PARAM);
    url.searchParams.delete(SHARE_DATA_PARAM);
    url.hash = SHARE_DATA_PARAM + "=" + portableData;
    return url.toString();
  }

  function createShareSnapshot(toolId, payload, options) {
    var snapshot = normalizeShareSnapshot({
      shareId: createId("share"),
      toolId: toolId,
      title: options && options.title,
      payload: payload,
      createdAt: nowIso(),
    });

    var portablePayload = Object.assign({ schemaVersion: 1 }, snapshot);
    var encoded = encodeSharePayload(portablePayload);
    var portable = Boolean(encoded) && encoded.length <= MAX_PORTABLE_SHARE_LENGTH;

    return {
      shareId: snapshot.shareId,
      snapshot: snapshot,
      url: portable ? buildShareUrl(options && options.baseUrl, encoded) : "",
      portable: portable,
    };
  }

  function createToolShareDialog(maxWidth) {
    var dialog = document.createElement("dialog");
    dialog.className = "tool-ui";
    dialog.style.cssText = "position:fixed;inset:0;margin:auto;height:fit-content;max-height:calc(100% - 32px);box-sizing:border-box;padding:20px;border:1px solid #e2e8f0;border-radius:12px;color:#0f172a;background:#fff";
    dialog.style.width = "min(" + maxWidth + "px, calc(100% - 32px))";
    return dialog;
  }

  function copyShareLink(toolId, payload, options) {
    var snapshot = createShareSnapshot(toolId, payload, options);
    var message = window.XYVCToolUI.message;
    if (!snapshot.portable) {
      message("内容太长，无法生成跨设备链接。可以复制结果文字发送给对方。");
      return;
    }

    if (document.getElementById("tool-share-dialog")) return;
    var dialog = createToolShareDialog(420);
    if (typeof dialog.showModal !== "function") {
      message("当前浏览器无法复制分享链接。可以复制结果文字发送给对方。");
      return;
    }
    var opener = document.activeElement;
    dialog.id = "tool-share-dialog";
    dialog.setAttribute("aria-labelledby", "tool-share-title");
    dialog.setAttribute("aria-describedby", "tool-share-description");
    dialog.innerHTML =
      '<h2 id="tool-share-title" style="margin:0 0 8px;font-size:18px">分享这份结果？</h2>' +
      '<p id="tool-share-description" style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.7">' +
      '链接包含这份结果，也可能引用你填写的内容。拿到链接的人都能查看，请只发给你愿意分享这些内容的人。</p>' +
      '<div data-manual-link hidden style="margin-bottom:16px">' +
      '<label for="tool-share-address" role="status">自动复制失败，请手动复制下方链接。</label>' +
      '<textarea id="tool-share-address" aria-label="分享链接" readonly rows="2" style="display:block;width:100%;margin-top:8px"></textarea></div>' +
      '<div style="display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px">' +
      '<button type="button" class="tool-ui-secondary" data-cancel autofocus>取消</button>' +
      '<button type="button" class="tool-ui-primary" data-copy>复制分享链接</button></div>';
    var copy = dialog.querySelector("[data-copy]");
    var manual = dialog.querySelector("[data-manual-link]");
    var address = dialog.querySelector("textarea");

    function showManualLink() {
      manual.hidden = false;
      address.value = snapshot.url;
      copy.disabled = false;
      address.focus();
      address.select();
    }

    dialog.querySelector("[data-cancel]").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("close", function () {
      dialog.remove();
      if (!opener || opener === document.body || !opener.getClientRects().length) {
        var menuToggle = document.querySelector('[aria-controls="tool-ui-menu"]');
        if (menuToggle) menuToggle.focus();
      }
    });
    copy.addEventListener("click", function () {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        showManualLink();
        return;
      }
      copy.disabled = true;
      navigator.clipboard.writeText(snapshot.url).then(function () {
        if (dialog.open) dialog.close();
        message("分享链接已复制。");
        if (options && options.onCopied) options.onCopied();
      }, function () {
        if (dialog.open) showManualLink();
      });
    });
    document.body.appendChild(dialog);
    dialog.showModal();
  }

  function readShareSnapshot(shareId) {
    if (!shareId) return null;
    var workspace = readWorkspace();
    return workspace.shareSnapshots[shareId]
      ? normalizeShareSnapshot(workspace.shareSnapshots[shareId])
      : null;
  }

  function readShareSnapshotFromLocation(loc) {
    try {
      var url = new URL(loc || window.location.href, window.location.href);
      var fragment = new URLSearchParams(url.hash.slice(1));
      return decodeSharePayload(fragment.get(SHARE_DATA_PARAM)) ||
        decodeSharePayload(url.searchParams.get(SHARE_DATA_PARAM)) ||
        readShareSnapshot(url.searchParams.get(SHARE_PARAM));
    } catch (e) {
      return null;
    }
  }

  function previewSharedResult(toolId, formatResult) {
    var url = new URL(window.location.href);
    var fragment = new URLSearchParams(url.hash.slice(1));
    var hasSharedFragment = fragment.has(SHARE_DATA_PARAM);
    if (!hasSharedFragment && !url.searchParams.has(SHARE_DATA_PARAM) && !url.searchParams.has(SHARE_PARAM)) return;
    var snapshot = readShareSnapshotFromLocation(url.href);

    url.searchParams.delete(SHARE_DATA_PARAM);
    url.searchParams.delete(SHARE_PARAM);
    if (hasSharedFragment) {
      fragment.delete(SHARE_DATA_PARAM);
      url.hash = fragment.toString();
    }
    history.replaceState(history.state, "", url.href);

    var result = "";
    if (snapshot && snapshot.toolId === toolId) {
      try { result = safeTrim(formatResult(snapshot.payload)); }
      catch (e) { /* A damaged shared result should not interrupt the tool. */ }
    }
    if (!result) {
      window.XYVCToolUI.message("这份分享无法打开，请联系分享者重新发送。");
      return;
    }

    var dialog = createToolShareDialog(600);
    if (typeof dialog.showModal !== "function") {
      window.XYVCToolUI.message("当前浏览器无法预览分享，请在其他浏览器打开链接。");
      return;
    }
    dialog.setAttribute("aria-labelledby", "tool-shared-result-title");
    dialog.innerHTML =
      '<h2 id="tool-shared-result-title" style="margin:0 0 8px;font-size:18px"></h2>' +
      '<p style="margin:0 0 16px;color:#475569;font-size:14px">朋友分享的结果。你的填写进度会保留。</p>' +
      '<div data-result tabindex="0" role="region" aria-label="结果正文" style="max-height:min(48vh,420px);overflow:auto;overscroll-behavior:contain;padding:12px;background:#f8fafc;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7"></div>' +
      '<div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="button" class="tool-ui-primary">返回工具</button></div>';
    dialog.querySelector("h2").textContent = snapshot.title || "分享结果";
    dialog.querySelector("[data-result]").textContent = result
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*([^*\n]+)\*\*/g, "$1");
    dialog.querySelector("button").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("close", function () { dialog.remove(); });
    document.body.appendChild(dialog);
    dialog.showModal();
  }

  function watchSharedResult(toolId, formatResult) {
    function openSharedResult() {
      previewSharedResult(toolId, formatResult);
    }
    window.addEventListener("hashchange", openSharedResult);
    openSharedResult();
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
    copyShareLink: copyShareLink,
    previewSharedResult: previewSharedResult,
    watchSharedResult: watchSharedResult,
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
