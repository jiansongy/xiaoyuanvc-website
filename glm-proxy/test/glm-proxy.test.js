"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { PassThrough } = require("node:stream");

const handler = require("../api/glm-proxy");

const originalApiKey = process.env.GLM_API_KEY;
process.env.GLM_API_KEY = "test-api-key";

test.after(function () {
  if (typeof originalApiKey === "undefined") {
    delete process.env.GLM_API_KEY;
  } else {
    process.env.GLM_API_KEY = originalApiKey;
  }
});

function createResponse() {
  const res = new PassThrough();
  const chunks = [];

  res.statusCode = 200;
  res.headers = {};
  res.setHeader = function (name, value) {
    res.headers[String(name).toLowerCase()] = value;
  };
  res.status = function (statusCode) {
    res.statusCode = statusCode;
    return res;
  };
  res.json = function (payload) {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
    return res;
  };
  res.on("data", function (chunk) {
    chunks.push(Buffer.from(chunk));
  });
  res.readBody = function () {
    return Buffer.concat(chunks).toString("utf8");
  };

  return res;
}

async function invoke(req) {
  const res = createResponse();
  const finished = new Promise(function (resolve, reject) {
    res.on("finish", resolve);
    res.on("error", reject);
  });

  await handler(
    Object.assign(
      {
        method: "POST",
        headers: { origin: "https://xiaoyuanvc.com" },
      },
      req,
    ),
    res,
  );
  await finished;

  return {
    body: res.readBody(),
    headers: res.headers,
    statusCode: res.statusCode,
  };
}

test("health check reports the unified GLM-5.3 configuration", async function () {
  const response = await invoke({ method: "GET" });
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(body.service, "glm-proxy");
  assert.equal(body.model, "glm-5.3");
  assert.equal(body.fallbackModel, "glm-4.5-air");
  assert.deepEqual(body.endpoints, ["/api/glm-proxy"]);
});

test("generic requests use GLM-5.3 with bounded low-effort thinking", async function () {
  const originalFetch = global.fetch;
  let upstreamBody;
  global.fetch = async function (_url, options) {
    upstreamBody = JSON.parse(options.body);
    return new Response(
      JSON.stringify({
        choices: [{ message: { role: "assistant", content: "测试回复" } }],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const response = await invoke({
      body: {
        messages: [{ role: "user", content: "你好" }],
        stream: false,
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(upstreamBody.model, "glm-5.3");
    assert.deepEqual(upstreamBody.thinking, { type: "enabled" });
    assert.equal(upstreamBody.reasoning_effort, "low");
    assert.equal(upstreamBody.max_tokens, 4096);
  } finally {
    global.fetch = originalFetch;
  }
});

test("generic requests fall back before output starts when GLM-5.3 is unavailable", async function () {
  const originalFetch = global.fetch;
  const models = [];
  global.fetch = async function (_url, options) {
    const payload = JSON.parse(options.body);
    models.push(payload.model);
    if (models.length === 1) {
      return new Response(JSON.stringify({ error: { message: "unavailable" } }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({
        choices: [{ message: { role: "assistant", content: "回退成功" } }],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const response = await invoke({
      body: {
        messages: [{ role: "user", content: "你好" }],
        stream: false,
      },
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(models, ["glm-5.3", "glm-4.5-air"]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("generic requests fall back when the primary connection fails", async function () {
  const originalFetch = global.fetch;
  const models = [];
  global.fetch = async function (_url, options) {
    const payload = JSON.parse(options.body);
    models.push(payload.model);
    if (models.length === 1) {
      throw new Error("primary connection failed");
    }
    return new Response(
      JSON.stringify({
        choices: [{ message: { role: "assistant", content: "回退成功" } }],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const response = await invoke({
      body: {
        messages: [{ role: "user", content: "你好" }],
        stream: false,
      },
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(models, ["glm-5.3", "glm-4.5-air"]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("generic requests fall back when the primary body fails before output", async function () {
  const originalFetch = global.fetch;
  const models = [];
  global.fetch = async function (_url, options) {
    const payload = JSON.parse(options.body);
    models.push(payload.model);
    if (models.length === 1) {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new Error("primary body failed"));
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({
        choices: [{ message: { role: "assistant", content: "回退成功" } }],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const response = await invoke({
      body: {
        messages: [{ role: "user", content: "你好" }],
        stream: false,
      },
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(models, ["glm-5.3", "glm-4.5-air"]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("malformed requests do not trigger a fallback request", async function () {
  const originalFetch = global.fetch;
  const models = [];
  global.fetch = async function (_url, options) {
    const payload = JSON.parse(options.body);
    models.push(payload.model);
    return new Response(JSON.stringify({ error: { message: "bad request" } }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const response = await invoke({
      body: {
        messages: [{ role: "user", content: "你好" }],
        stream: false,
      },
    });

    assert.equal(response.statusCode, 422);
    assert.deepEqual(models, ["glm-5.3"]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("student startup self-check is routed through the unified endpoint", async function () {
  const originalFetch = global.fetch;
  global.fetch = async function () {
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                dimensionScores: {
                  problem: 7,
                  wedge: 6,
                  mvp: 7,
                  team: 6,
                  growth: 7,
                },
                dimensionRationales: {
                  problem: "问题真实。",
                  wedge: "入口较明确。",
                  mvp: "验证计划可执行。",
                  team: "团队基本匹配。",
                  growth: "具备扩展空间。",
                },
                overallSummary: "可以继续验证。",
                strengths: ["用户明确"],
                risks: ["付费仍需验证"],
                sectorLabel: "校园工具",
              }),
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const response = await invoke({
      body: {
        toolId: "student-startup-self-check",
        userProfile: { uid: "test-user" },
        toolState: {
          toolId: "student-startup-self-check",
          draftData: {
            product: "做一个帮助大学生管理课程任务和截止日期的智能学习工具",
            audience: "课程较多、容易错过截止日期的在校大学生",
            model: "基础提醒免费，高级协作功能按月订阅",
            stage: "已做用户访谈",
            team: "计算机专业学生和校园社群运营者",
            validationPlan: "本周访谈八名学生，下周上线原型测试",
            mode: "gentle",
          },
        },
        toolHistory: [],
      },
    });
    const body = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(body.ok, true);
    assert.equal(body.toolId, "student-startup-self-check");
    assert.ok(body.scoring);
  } finally {
    global.fetch = originalFetch;
  }
});

test("unknown tool ids are rejected instead of forwarded upstream", async function () {
  const originalFetch = global.fetch;
  global.fetch = async function () {
    throw new Error("unknown tool should not reach GLM");
  };

  try {
    const response = await invoke({
      body: {
        toolId: "unknown-tool",
        messages: [{ role: "user", content: "你好" }],
      },
    });
    const body = JSON.parse(response.body);

    assert.equal(response.statusCode, 400);
    assert.equal(body.error, "Unknown toolId");
  } finally {
    global.fetch = originalFetch;
  }
});

test("all POST routes fail clearly when the API key is missing", async function () {
  const savedApiKey = process.env.GLM_API_KEY;
  delete process.env.GLM_API_KEY;

  try {
    const response = await invoke({
      body: {
        toolId: "student-startup-self-check",
        toolState: {
          draftData: {
            product: "做一个帮助大学生管理课程任务和截止日期的智能学习工具",
          },
        },
      },
    });
    const body = JSON.parse(response.body);

    assert.equal(response.statusCode, 500);
    assert.equal(body.error, "Server misconfiguration");
  } finally {
    process.env.GLM_API_KEY = savedApiKey;
  }
});

test("stream backpressure stops immediately when the client disconnects", async function () {
  const res = new EventEmitter();
  res.status = function () {
    return res;
  };
  res.setHeader = function () {};
  res.write = function () {
    return false;
  };
  res.end = function () {};

  const upstream = new Response("first chunk", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
  const piping = handler.pipeUpstream(upstream, "glm-5.3", res);
  setImmediate(function () {
    res.emit("close");
  });

  await assert.rejects(
    Promise.race([
      piping,
      new Promise(function (_resolve, reject) {
        setTimeout(function () {
          reject(new Error("backpressure wait did not stop"));
        }, 100);
      }),
    ]),
    /Client disconnected/,
  );
});

test("an already disconnected client does not wait, fall back, or write a response", async function () {
  const originalFetch = global.fetch;
  const models = [];
  const res = new EventEmitter();
  let ended = false;
  res.destroyed = true;
  res.writableEnded = false;
  res.headersSent = false;
  res.status = function () {
    return res;
  };
  res.setHeader = function () {};
  res.write = function () {
    return false;
  };
  res.end = function () {
    ended = true;
  };
  global.fetch = async function (_url, options) {
    models.push(JSON.parse(options.body).model);
    return new Response("buffered chunk", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  };

  try {
    await Promise.race([
      handler.forwardChatCompletion({ messages: [] }, "test-api-key", res),
      new Promise(function (_resolve, reject) {
        setTimeout(function () {
          reject(new Error("already disconnected request did not stop"));
        }, 100);
      }),
    ]);

    assert.deepEqual(models, ["glm-5.3"]);
    assert.equal(ended, false);
  } finally {
    global.fetch = originalFetch;
  }
});
