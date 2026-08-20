"use strict";

const { Readable } = require("stream");

const {
  DEFAULT_FALLBACK_MODEL,
  DEFAULT_MODEL,
  GLM_URL,
  UPSTREAM_TIMEOUT_MS,
  buildGLMPayload,
} = require("../lib/glm");
const {
  applyCors,
  handlePreflight,
  readJsonBody,
  sendJson,
} = require("../lib/http");
const {
  TOOL_ID_STUDENT_STARTUP_SELF_CHECK,
} = require("../lib/data-store");
const {
  scoreStudentStartupSelfCheck,
} = require("../lib/student-startup-self-check");

async function fetchGLM(body, model, apiKey) {
  const ctrl = new AbortController();
  const timer = setTimeout(function () {
    ctrl.abort(new Error("Upstream timeout"));
  }, UPSTREAM_TIMEOUT_MS);

  try {
    return await fetch(GLM_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGLMPayload(body, model)),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function isRetryableStatus(statusCode) {
  return statusCode !== 401 && statusCode !== 403;
}

async function forwardChatCompletion(body, apiKey, res) {
  let upstream;
  let selectedModel = DEFAULT_MODEL;

  try {
    upstream = await fetchGLM(body, selectedModel, apiKey);

    if (
      !upstream.ok &&
      DEFAULT_FALLBACK_MODEL &&
      DEFAULT_FALLBACK_MODEL !== selectedModel &&
      isRetryableStatus(upstream.status)
    ) {
      if (upstream.body) {
        await upstream.body.cancel().catch(function () {});
      }
      selectedModel = DEFAULT_FALLBACK_MODEL;
      upstream = await fetchGLM(body, selectedModel, apiKey);
    }
  } catch (err) {
    const isTimeout =
      err && (err.name === "AbortError" || /timeout/i.test(err.message || ""));
    sendJson(res, isTimeout ? 504 : 502, {
      error: isTimeout
        ? "GLM 响应超时，请重试"
        : "无法连接 GLM API：" + err.message,
    });
    return;
  }

  res.status(upstream.status);
  res.setHeader(
    "Content-Type",
    upstream.headers.get("content-type") || "application/json",
  );
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-GLM-Model", selectedModel);

  try {
    await new Promise(function (resolve, reject) {
      const readable = upstream.body ? Readable.fromWeb(upstream.body) : null;
      if (!readable) {
        reject(new Error("Upstream body is empty"));
        return;
      }
      readable.on("error", reject);
      res.on("error", reject);
      res.on("finish", resolve);
      readable.pipe(res);
    });
  } catch (err) {
    if (!res.headersSent) {
      sendJson(res, 502, { error: "流式转发失败：" + err.message });
    }
  }
}

module.exports = async function handler(req, res) {
  const cors = applyCors(req, res);

  if (handlePreflight(req, res)) {
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      service: "glm-proxy",
      model: DEFAULT_MODEL,
      fallbackModel: DEFAULT_FALLBACK_MODEL,
      hasApiKey: Boolean(process.env.GLM_API_KEY),
      allowedOrigins: cors.allowedOrigins,
      endpoints: ["/api/glm-proxy"],
      now: new Date().toISOString(),
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  let body;
  try {
    body = readJsonBody(req);
  } catch (err) {
    sendJson(res, 400, { error: "Invalid JSON" });
    return;
  }

  if (!body || !Object.keys(body).length) {
    sendJson(res, 400, { error: "Empty body" });
    return;
  }

  if (body.toolId) {
    if (body.toolId !== TOOL_ID_STUDENT_STARTUP_SELF_CHECK) {
      sendJson(res, 400, { error: "Unknown toolId" });
      return;
    }

    try {
      const result = await scoreStudentStartupSelfCheck(body);
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        error: err.message || "学生创业自检执行失败",
      });
    }
    return;
  }

  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: "Server misconfiguration" });
    return;
  }

  await forwardChatCompletion(body, apiKey, res);
};

module.exports.fetchGLM = fetchGLM;
module.exports.forwardChatCompletion = forwardChatCompletion;
module.exports.isRetryableStatus = isRetryableStatus;
