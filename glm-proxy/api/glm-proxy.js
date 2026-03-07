/**
 * GLM API 代理 — Vercel Serverless Function (Node.js)
 *
 * 环境变量（在 Vercel Dashboard 设置）：
 *   GLM_API_KEY  智谱 GLM API 密钥
 */

const DEFAULT_ALLOWED_ORIGINS = [
  "https://xiaoyuanvc.com",
  "https://www.xiaoyuanvc.com",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(",")
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const GLM_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

module.exports = async function handler(req, res) {
  const origin = req.headers["origin"] || "";
  const corsOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      service: "glm-proxy",
      model: "glm-4-flash",
      hasApiKey: Boolean(process.env.GLM_API_KEY),
      allowedOrigins: ALLOWED_ORIGINS,
      now: new Date().toISOString(),
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }
  }
  if (!body) {
    res.status(400).json({ error: "Empty body" });
    return;
  }

  // 强制使用 glm-4-flash，防止客户端指定昂贵模型
  body.model = "glm-4-flash";

  let upstream;
  try {
    upstream = await fetch(GLM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    res.status(502).json({ error: "无法连接 GLM API：" + err.message });
    return;
  }

  res.status(upstream.status);
  res.setHeader(
    "Content-Type",
    upstream.headers.get("content-type") || "application/json",
  );
  res.setHeader("Cache-Control", "no-cache");

  // 流式转发
  const { Readable } = require("stream");
  try {
    await new Promise((resolve, reject) => {
      const readable = Readable.fromWeb(upstream.body);
      readable.on("error", reject);
      res.on("error", reject);
      res.on("finish", resolve);
      readable.pipe(res);
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(502).json({ error: "流式转发失败：" + err.message });
    }
  }
};
