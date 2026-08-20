"use strict";

const GLM_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const DEFAULT_MODEL = process.env.GLM_MODEL || "glm-5.3";
const DEFAULT_FALLBACK_MODEL =
  process.env.GLM_FALLBACK_MODEL || "glm-4.5-air";
const DEFAULT_MAX_TOKENS = 4096;
const UPSTREAM_TIMEOUT_MS = 55000;
const STRUCTURED_ATTEMPT_TIMEOUTS = [32000, 10000, 10000];

function buildGLMPayload(payload, model) {
  const nextPayload = Object.assign({}, payload, {
    model: model || DEFAULT_MODEL,
    max_tokens: DEFAULT_MAX_TOKENS,
  });

  if (nextPayload.model === "glm-5.3") {
    nextPayload.thinking = { type: "enabled" };
    nextPayload.reasoning_effort = "low";
  } else {
    delete nextPayload.thinking;
    delete nextPayload.reasoning_effort;
  }

  return nextPayload;
}

function extractTextFromCompletion(json) {
  return (
    json &&
    json.choices &&
    json.choices[0] &&
    json.choices[0].message &&
    json.choices[0].message.content
  );
}

function extractJsonBlock(text) {
  if (!text) {
    throw new Error("模型未返回内容");
  }

  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) {
    return fenced[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("模型未返回合法 JSON");
}

async function callGLM(payload, timeoutMs) {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 GLM_API_KEY");
  }

  const ctrl = new AbortController();
  const timer = setTimeout(function () {
    ctrl.abort();
  }, timeoutMs || UPSTREAM_TIMEOUT_MS);

  let upstream;
  let json;
  try {
    upstream = await fetch(GLM_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    try {
      json = await upstream.json();
    } catch (err) {
      const isTimeout =
        err && (err.name === "AbortError" || /timeout|aborted/i.test(err.message || ""));
      if (isTimeout) {
        throw err;
      }
      throw new Error("GLM 返回了不可解析的响应");
    }
  } catch (err) {
    const isTimeout =
      err && (err.name === "AbortError" || /timeout|aborted/i.test(err.message || ""));
    if (isTimeout) {
      throw new Error("GLM 响应超时");
    }
    if (err && err.message === "GLM 返回了不可解析的响应") {
      throw err;
    }
    throw new Error("GLM 请求失败: " + err.message);
  } finally {
    clearTimeout(timer);
  }

  if (!upstream.ok) {
    const message =
      (json && json.error && (json.error.message || json.error.code)) ||
      json.message ||
      "GLM 请求失败";
    throw new Error(message);
  }

  return json;
}

async function callStructuredGLM(options) {
  const payload = {
    model: options.model || DEFAULT_MODEL,
    temperature:
      typeof options.temperature === "number" ? options.temperature : 0.2,
    stream: false,
    messages: options.messages,
    response_format: { type: "json_object" },
  };

  let rawText = "";
  const attemptLog = [];
  const retryModel = payload.model;
  const fallbackModel = options.fallbackModel || DEFAULT_FALLBACK_MODEL;
  const deadlineAt = Number.isFinite(options.deadlineAt)
    ? options.deadlineAt
    : Date.now() +
      STRUCTURED_ATTEMPT_TIMEOUTS.reduce(function (sum, value) {
        return sum + value;
      }, 0);
  const sequence = [
    {
      model: payload.model,
      stage: "primary",
      timeoutMs: STRUCTURED_ATTEMPT_TIMEOUTS[0],
    },
    {
      model: retryModel,
      stage: "retry",
      timeoutMs: STRUCTURED_ATTEMPT_TIMEOUTS[1],
    },
    {
      model:
        fallbackModel && fallbackModel !== retryModel ? fallbackModel : null,
      stage: "fallback_model",
      timeoutMs: STRUCTURED_ATTEMPT_TIMEOUTS[2],
    },
  ];

  for (const attempt of sequence) {
    if (!attempt.model) {
      continue;
    }

    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 0) {
      throw new Error("GLM 响应超时");
    }

    try {
      const json = await callGLM(
        buildGLMPayload(payload, attempt.model),
        Math.min(attempt.timeoutMs, remainingMs),
      );
      rawText = extractTextFromCompletion(json) || "";
      const parsed = JSON.parse(extractJsonBlock(rawText));
      attemptLog.push({
        stage: attempt.stage,
        model: attempt.model,
        ok: true,
      });
      return {
        model: attempt.model,
        rawText,
        parsed,
        attemptLog,
        retriedPrimary: attemptLog.some(function (entry) {
          return entry.stage === "retry" && entry.ok;
        }),
        usedFallbackModel: attempt.stage === "fallback_model",
      };
    } catch (err) {
      attemptLog.push({
        stage: attempt.stage,
        model: attempt.model,
        ok: false,
        error: err.message,
      });
    }
  }

  throw new Error(
    attemptLog
      .filter(function (entry) {
        return !entry.ok;
      })
      .map(function (entry) {
        return entry.model + ": " + entry.error;
      })
      .join(" | "),
  );
}

module.exports = {
  DEFAULT_FALLBACK_MODEL,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  GLM_URL,
  STRUCTURED_ATTEMPT_TIMEOUTS,
  UPSTREAM_TIMEOUT_MS,
  buildGLMPayload,
  callGLM,
  callStructuredGLM,
  extractJsonBlock,
  extractTextFromCompletion,
};
