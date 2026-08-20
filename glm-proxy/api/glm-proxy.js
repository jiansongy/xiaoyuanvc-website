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

async function fetchGLM(body, model, apiKey, signal) {
  return fetch(GLM_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildGLMPayload(body, model)),
    signal: signal,
  });
}

function isRetryableStatus(statusCode) {
  return (
    statusCode === 404 ||
    statusCode === 408 ||
    statusCode === 425 ||
    statusCode === 429 ||
    statusCode >= 500
  );
}

function setUpstreamHeaders(res, upstream, selectedModel) {
  res.status(upstream.status);
  res.setHeader(
    "Content-Type",
    upstream.headers.get("content-type") || "application/json",
  );
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-GLM-Model", selectedModel);
}

function waitForDrainOrClose(res) {
  return new Promise(function (resolve, reject) {
    if (res.destroyed || res.writableEnded) {
      const error = new Error("Client disconnected");
      error.code = "CLIENT_DISCONNECTED";
      reject(error);
      return;
    }

    const cleanup = function () {
      res.removeListener("drain", onDrain);
      res.removeListener("close", onClose);
      res.removeListener("error", onError);
    };
    const onDrain = function () {
      cleanup();
      resolve();
    };
    const onClose = function () {
      cleanup();
      const error = new Error("Client disconnected");
      error.code = "CLIENT_DISCONNECTED";
      reject(error);
    };
    const onError = function (error) {
      cleanup();
      reject(error);
    };

    res.once("drain", onDrain);
    res.once("close", onClose);
    res.once("error", onError);
  });
}

async function pipeUpstream(upstream, selectedModel, res) {
  const readable = upstream.body ? Readable.fromWeb(upstream.body) : null;
  if (!readable) {
    const error = new Error("Upstream body is empty");
    error.beforeOutput = true;
    throw error;
  }

  let started = false;

  try {
    for await (const chunk of readable) {
      if (!started) {
        setUpstreamHeaders(res, upstream, selectedModel);
        started = true;
      }
      if (!res.write(chunk)) {
        await waitForDrainOrClose(res);
      }
    }

    if (!started) {
      const error = new Error("Upstream body is empty");
      error.beforeOutput = true;
      throw error;
    }

    res.end();
  } catch (err) {
    err.beforeOutput = !started;
    throw err;
  }
}

function isTimeoutError(err) {
  return Boolean(
    err && (err.name === "AbortError" || /timeout|aborted/i.test(err.message || "")),
  );
}

function isClientDisconnectError(err) {
  return Boolean(
    err &&
      (err.code === "CLIENT_DISCONNECTED" ||
        /client disconnected/i.test(err.message || "")),
  );
}

async function forwardChatCompletion(body, apiKey, res) {
  const models = [DEFAULT_MODEL];
  if (DEFAULT_FALLBACK_MODEL && DEFAULT_FALLBACK_MODEL !== DEFAULT_MODEL) {
    models.push(DEFAULT_FALLBACK_MODEL);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(function () {
    ctrl.abort(new Error("Upstream timeout"));
  }, UPSTREAM_TIMEOUT_MS);
  const abortOnClose = function () {
    if (!res.writableEnded) {
      ctrl.abort(new Error("Client disconnected"));
    }
  };
  res.on("close", abortOnClose);

  try {
    for (let index = 0; index < models.length; index++) {
      const selectedModel = models[index];
      const canFallback = index < models.length - 1;
      let upstream;

      try {
        upstream = await fetchGLM(body, selectedModel, apiKey, ctrl.signal);
      } catch (err) {
        const clientDisconnected =
          isClientDisconnectError(err) ||
          isClientDisconnectError(ctrl.signal.reason);
        if (canFallback && !isTimeoutError(err) && !clientDisconnected) {
          continue;
        }
        throw err;
      }

      if (!upstream.ok && canFallback && isRetryableStatus(upstream.status)) {
        if (upstream.body) {
          await upstream.body.cancel().catch(function () {});
        }
        continue;
      }

      try {
        await pipeUpstream(upstream, selectedModel, res);
        return;
      } catch (err) {
        const clientDisconnected =
          isClientDisconnectError(err) ||
          isClientDisconnectError(ctrl.signal.reason);
        if (
          canFallback &&
          err.beforeOutput &&
          !isTimeoutError(err) &&
          !clientDisconnected
        ) {
          continue;
        }
        throw err;
      }
    }
  } catch (err) {
    if (
      isClientDisconnectError(err) ||
      isClientDisconnectError(ctrl.signal.reason) ||
      res.destroyed
    ) {
      return;
    }
    if (res.headersSent) {
      res.destroy(err);
      return;
    }
    const isTimeout = isTimeoutError(err);
    sendJson(res, isTimeout ? 504 : 502, {
      error: isTimeout
        ? "GLM 响应超时，请重试"
        : "无法连接 GLM API：" + err.message,
    });
  } finally {
    clearTimeout(timer);
    res.removeListener("close", abortOnClose);
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

  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: "Server misconfiguration" });
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

  await forwardChatCompletion(body, apiKey, res);
};

module.exports.fetchGLM = fetchGLM;
module.exports.forwardChatCompletion = forwardChatCompletion;
module.exports.isRetryableStatus = isRetryableStatus;
module.exports.pipeUpstream = pipeUpstream;
