"use strict";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://xiaoyuanvc.com",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyCors(req, res) {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin || "";
  const corsOrigin = allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return { allowedOrigins, corsOrigin };
}

function handlePreflight(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  if (req.method === "HEAD") {
    res.status(200).end();
    return true;
  }

  return false;
}

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

function readJsonBody(req) {
  let body = req.body;

  if (typeof body === "string") {
    body = body.trim();
    if (!body) {
      return {};
    }
    return JSON.parse(body);
  }

  if (!body || typeof body !== "object") {
    return {};
  }

  return body;
}

module.exports = {
  DEFAULT_ALLOWED_ORIGINS,
  applyCors,
  getAllowedOrigins,
  handlePreflight,
  readJsonBody,
  sendJson,
};
