"use strict";

const { applyCors, handlePreflight, readJsonBody, sendJson } = require("../lib/http");
const { scoreStudentStartupSelfCheck } = require("../lib/student-startup-self-check");

module.exports = async function handler(req, res) {
  applyCors(req, res);

  if (handlePreflight(req, res)) {
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      service: "student-startup-self-check",
      toolId: "student-startup-self-check",
      schemaVersion: 1,
      now: new Date().toISOString(),
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  let body;
  try {
    body = readJsonBody(req);
  } catch (err) {
    sendJson(res, 400, { ok: false, error: "Invalid JSON body" });
    return;
  }

  try {
    const result = await scoreStudentStartupSelfCheck(body || {});
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 400, {
      ok: false,
      error: err.message || "学生创业自检执行失败",
    });
  }
};
