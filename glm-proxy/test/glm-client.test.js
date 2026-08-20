"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  STRUCTURED_ATTEMPT_TIMEOUTS,
  UPSTREAM_TIMEOUT_MS,
  callGLM,
  callStructuredGLM,
} = require("../lib/glm");

test("GLM timeout remains active while the response body is read", async function () {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GLM_API_KEY;
  process.env.GLM_API_KEY = "test-api-key";
  global.fetch = async function (_url, options) {
    return new Response(
      new ReadableStream({
        start(controller) {
          options.signal.addEventListener("abort", function () {
            controller.error(options.signal.reason || new Error("aborted"));
          });
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await assert.rejects(
      Promise.race([
        callGLM({ model: "glm-5.3", messages: [] }, 10),
        new Promise(function (_resolve, reject) {
          setTimeout(function () {
            reject(new Error("test deadline expired"));
          }, 100);
        }),
      ]),
      /GLM 响应超时/,
    );
  } finally {
    global.fetch = originalFetch;
    if (typeof originalApiKey === "undefined") {
      delete process.env.GLM_API_KEY;
    } else {
      process.env.GLM_API_KEY = originalApiKey;
    }
  }
});

test("structured retries leave time inside the Vercel request deadline", function () {
  assert.equal(STRUCTURED_ATTEMPT_TIMEOUTS.length, 3);
  assert.ok(
    STRUCTURED_ATTEMPT_TIMEOUTS.reduce(function (sum, value) {
      return sum + value;
    }, 0) < UPSTREAM_TIMEOUT_MS,
  );
});

test("structured requests use GLM-4.7-FlashX after primary retries fail", async function () {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GLM_API_KEY;
  const models = [];
  process.env.GLM_API_KEY = "test-api-key";
  global.fetch = async function (_url, options) {
    const payload = JSON.parse(options.body);
    models.push(payload.model);
    if (models.length < 3) {
      return new Response(JSON.stringify({ error: { message: "unavailable" } }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '{"ok":true}' } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const result = await callStructuredGLM({
      messages: [{ role: "user", content: "测试" }],
    });

    assert.deepEqual(models, ["glm-5.3", "glm-5.3", "glm-4.7-flashx"]);
    assert.equal(result.model, "glm-4.7-flashx");
    assert.equal(result.usedFallbackModel, true);
  } finally {
    global.fetch = originalFetch;
    if (typeof originalApiKey === "undefined") {
      delete process.env.GLM_API_KEY;
    } else {
      process.env.GLM_API_KEY = originalApiKey;
    }
  }
});

test("structured calls stop immediately after the shared deadline", async function () {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GLM_API_KEY;
  let fetchCalls = 0;
  process.env.GLM_API_KEY = "test-api-key";
  global.fetch = async function () {
    fetchCalls += 1;
    throw new Error("fetch should not run after deadline");
  };

  try {
    await assert.rejects(
      callStructuredGLM({
        deadlineAt: Date.now() - 1,
        messages: [{ role: "user", content: "测试" }],
      }),
      /GLM 响应超时/,
    );
    assert.equal(fetchCalls, 0);
  } finally {
    global.fetch = originalFetch;
    if (typeof originalApiKey === "undefined") {
      delete process.env.GLM_API_KEY;
    } else {
      process.env.GLM_API_KEY = originalApiKey;
    }
  }
});
