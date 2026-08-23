"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const proxyRoot = path.resolve(__dirname, "..");
const siteRoot = path.resolve(proxyRoot, "..");

test("Vercel exposes only the unified GLM function", function () {
  const apiFiles = fs
    .readdirSync(path.join(proxyRoot, "api"))
    .filter(function (name) {
      return name.endsWith(".js");
    })
    .sort();
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(proxyRoot, "vercel.json"), "utf8"),
  );

  assert.deepEqual(apiFiles, ["glm-proxy.js"]);
  assert.deepEqual(Object.keys(vercelConfig.functions), ["api/glm-proxy.js"]);
});

test("all five AI tools use the unified endpoint and no client selects a model", function () {
  const resourceFiles = [
    "find-your-idea.html",
    "find-what-you-want.html",
    "hard-tech-check.html",
    "rate-your-idea.html",
    "entrecoach.html",
  ];

  for (const name of resourceFiles) {
    const source = fs.readFileSync(
      path.join(siteRoot, "resources", name),
      "utf8",
    );
    assert.match(source, /https:\/\/api\.xiaoyuanvc\.com\/api\/glm-proxy/);
    assert.doesNotMatch(source, /api\/student-startup-self-check/);
    assert.doesNotMatch(source, /model:\s*["']glm-/);
  }
});

test("the self-check page sends its tool id at the top level", function () {
  const source = fs.readFileSync(
    path.join(siteRoot, "resources", "rate-your-idea.html"),
    "utf8",
  );
  const requestBuilder = source.match(
    /function buildRequestPayload\(\)\s*\{([\s\S]*?)\n\s*\}/,
  );

  assert.ok(requestBuilder, "buildRequestPayload should exist");
  assert.match(requestBuilder[1], /toolId:\s*TOOL_ID/);
});

test("self-check scoring shares one deadline across analysis and recalibration", function () {
  const source = fs.readFileSync(
    path.join(proxyRoot, "lib", "student-startup-self-check.js"),
    "utf8",
  );

  assert.match(source, /const deadlineAt = Date\.now\(\) \+ SCORING_DEADLINE_MS/);
  assert.equal((source.match(/deadlineAt:\s*deadlineAt/g) || []).length, 2);
});

test("self-check runtime dependencies stay inside the Vercel project", function () {
  const modulePath = path.join(
    proxyRoot,
    "lib",
    "student-startup-self-check.js",
  );
  const source = fs.readFileSync(modulePath, "utf8");
  const match = source.match(/require\("([^"]*action-library\.json)"\)/);

  assert.ok(match, "the action library import should exist");
  const dependencyPath = path.resolve(path.dirname(modulePath), match[1]);
  assert.equal(dependencyPath.startsWith(proxyRoot + path.sep), true);
  assert.equal(fs.existsSync(dependencyPath), true);
});
