/**
 * Batch process podcast episodes through Alibaba Cloud Tingwu API.
 *
 * Usage:
 *   node scripts/tingwu-batch.mjs submit   # Submit all episodes without showNotes
 *   node scripts/tingwu-batch.mjs poll     # Poll pending tasks and update episodes.json
 *   node scripts/tingwu-batch.mjs status   # Show task status overview
 *
 * Reads credentials from .env (ALIBABA_CLOUD_ACCESS_KEY_ID,
 * ALIBABA_CLOUD_ACCESS_KEY_SECRET, TINGWU_APP_KEY).
 *
 * Task tracking file: resources/data/tingwu-tasks.json
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EPISODES_PATH = join(ROOT, "resources/data/episodes.json");
const TASKS_PATH = join(ROOT, "resources/data/tingwu-tasks.json");
const ENV_PATH = join(ROOT, ".env");

// ---------------------------------------------------------------------------
// Load .env
// ---------------------------------------------------------------------------
function loadEnv() {
  const text = readFileSync(ENV_PATH, "utf-8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const AK_ID = env.ALIBABA_CLOUD_ACCESS_KEY_ID;
const AK_SECRET = env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
const APP_KEY = env.TINGWU_APP_KEY;

if (!AK_ID || !AK_SECRET || !APP_KEY) {
  console.error("Missing credentials in .env");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// SDK setup
// ---------------------------------------------------------------------------
const OpenApiMod = await import("@alicloud/openapi-client");
const OpenApiConfig = OpenApiMod.default?.Config
  ? OpenApiMod.default
  : OpenApiMod;
const TingwuMod = await import("@alicloud/tingwu20230930");
const TingwuClient = TingwuMod.default?.default || TingwuMod.default;
const Models = TingwuMod;

const config = new OpenApiConfig.Config({
  accessKeyId: AK_ID,
  accessKeySecret: AK_SECRET,
  endpoint: "tingwu.cn-beijing.aliyuncs.com",
  regionId: "cn-beijing",
});

const client = new TingwuClient(config);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readJSON(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJSON(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function loadTasks() {
  if (existsSync(TASKS_PATH)) return readJSON(TASKS_PATH);
  return {};
}

function saveTasks(tasks) {
  writeJSON(TASKS_PATH, tasks);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Submit: create Tingwu tasks for episodes without showNotes
// ---------------------------------------------------------------------------
async function submit() {
  const episodes = readJSON(EPISODES_PATH);
  const tasks = loadTasks();

  const toSubmit = episodes.filter((ep) => !ep.showNotes && !tasks[ep.ep]);

  if (toSubmit.length === 0) {
    console.log("No episodes to submit. All have showNotes or pending tasks.");
    return;
  }

  console.log(`Submitting ${toSubmit.length} episodes...\n`);

  for (const ep of toSubmit) {
    console.log(`EP${ep.ep}: ${ep.title}`);
    console.log(`  Audio: ${ep.audioUrl}`);

    try {
      const request = new Models.CreateTaskRequest({
        type: "offline",
        appKey: APP_KEY,
        input: new Models.CreateTaskRequestInput({
          sourceLanguage: "cn",
          fileUrl: ep.audioUrl,
        }),
        parameters: new Models.CreateTaskRequestParameters({
          transcription: new Models.CreateTaskRequestParametersTranscription({
            diarizationEnabled: true,
          }),
          summarizationEnabled: true,
          summarization: new Models.CreateTaskRequestParametersSummarization({
            types: ["Paragraph"],
          }),
          autoChaptersEnabled: true,
        }),
      });

      const res = await client.createTask(request);
      const taskId = res.body.data.taskId;
      console.log(`  TaskId: ${taskId} ✓\n`);

      tasks[ep.ep] = {
        taskId,
        status: "ONGOING",
        submittedAt: new Date().toISOString(),
      };
      saveTasks(tasks);

      // Rate limit: max 20 QPS, be conservative
      await sleep(500);
    } catch (err) {
      console.log(`  ERROR: ${err.code} - ${err.message}\n`);
      tasks[ep.ep] = {
        taskId: null,
        status: "SUBMIT_FAILED",
        error: `${err.code}: ${err.message}`,
      };
      saveTasks(tasks);
    }
  }

  console.log(
    "Done. Run `node scripts/tingwu-batch.mjs poll` to check results.",
  );
}

// ---------------------------------------------------------------------------
// Fetch JSON from OSS URL
// ---------------------------------------------------------------------------
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Format timestamp (ms) to MM:SS or H:MM:SS
// ---------------------------------------------------------------------------
function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ---------------------------------------------------------------------------
// Poll: check task status and extract results
// ---------------------------------------------------------------------------
async function poll() {
  const tasks = loadTasks();
  const episodes = readJSON(EPISODES_PATH);
  const ongoing = Object.entries(tasks).filter(
    ([, t]) => t.status === "ONGOING",
  );

  if (ongoing.length === 0) {
    console.log("No ongoing tasks to poll.");
    return;
  }

  console.log(`Polling ${ongoing.length} tasks...\n`);
  let updated = 0;

  for (const [epNum, task] of ongoing) {
    process.stdout.write(`EP${epNum}: `);

    try {
      const res = await client.getTaskInfo(task.taskId);
      const data = res.body.data;
      task.status = data.taskStatus;

      if (data.taskStatus === "COMPLETED" && data.result) {
        console.log("COMPLETED ✓");

        const showNotes = await buildShowNotes(data.result);
        task.resultUrls = {
          summarization: data.result.summarization || null,
          autoChapters: data.result.autoChapters || null,
          transcription: data.result.transcription || null,
        };
        task.completedAt = new Date().toISOString();

        const ep = episodes.find((e) => e.ep === parseInt(epNum));
        if (ep) {
          ep.showNotes = showNotes;
          updated++;
        }
      } else if (data.taskStatus === "FAILED") {
        console.log(`FAILED: ${data.errorCode} - ${data.errorMessage}`);
        task.error = `${data.errorCode}: ${data.errorMessage}`;
      } else {
        console.log(data.taskStatus);
      }

      saveTasks(tasks);
      await sleep(300);
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }

  if (updated > 0) {
    writeJSON(EPISODES_PATH, episodes);
    console.log(`\nUpdated showNotes for ${updated} episodes in episodes.json`);
  } else {
    console.log("\nNo new completions yet. Try again in a few minutes.");
  }
}

// ---------------------------------------------------------------------------
// Build show notes HTML by fetching OSS data
// ---------------------------------------------------------------------------
async function buildShowNotes(result) {
  const parts = [];

  // Summarization — paragraph summary
  if (result.summarization) {
    try {
      const data = await fetchJSON(result.summarization);
      const s = data.Summarization;
      if (s && s.ParagraphSummary) {
        parts.push(`<h3>${s.ParagraphTitle || "内容摘要"}</h3>`);
        parts.push(`<p>${s.ParagraphSummary}</p>`);
      }
    } catch (e) {
      console.log(`    [warn] Failed to fetch summarization: ${e.message}`);
    }
  }

  // Auto chapters — timeline
  if (result.autoChapters) {
    try {
      const data = await fetchJSON(result.autoChapters);
      if (data.AutoChapters && data.AutoChapters.length > 0) {
        parts.push("<h3>章节时间线</h3>");
        parts.push("<ul>");
        for (const ch of data.AutoChapters) {
          const time = formatTime(ch.Start);
          parts.push(
            `<li><strong>${time}</strong> ${ch.Headline}<br/><em>${ch.Summary}</em></li>`,
          );
        }
        parts.push("</ul>");
      }
    } catch (e) {
      console.log(`    [warn] Failed to fetch autoChapters: ${e.message}`);
    }
  }

  if (parts.length === 0) {
    return "<p>暂无详细笔记</p>";
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Retry: resubmit failed tasks
// ---------------------------------------------------------------------------
async function retry() {
  const tasks = loadTasks();
  const episodes = readJSON(EPISODES_PATH);
  const failed = Object.entries(tasks).filter(
    ([, t]) => t.status === "FAILED" || t.status === "SUBMIT_FAILED",
  );

  if (failed.length === 0) {
    console.log("No failed tasks to retry.");
    return;
  }

  console.log(`Retrying ${failed.length} failed tasks...\n`);

  for (const [epNum] of failed) {
    const ep = episodes.find((e) => e.ep === parseInt(epNum));
    if (!ep) continue;

    console.log(`EP${epNum}: ${ep.title}`);

    try {
      const request = new Models.CreateTaskRequest({
        type: "offline",
        appKey: APP_KEY,
        input: new Models.CreateTaskRequestInput({
          sourceLanguage: "cn",
          fileUrl: ep.audioUrl,
        }),
        parameters: new Models.CreateTaskRequestParameters({
          transcription: new Models.CreateTaskRequestParametersTranscription({
            diarizationEnabled: true,
          }),
          summarizationEnabled: true,
          summarization: new Models.CreateTaskRequestParametersSummarization({
            types: ["Paragraph"],
          }),
          autoChaptersEnabled: true,
        }),
      });

      const res = await client.createTask(request);
      const taskId = res.body.data.taskId;
      console.log(`  TaskId: ${taskId} ✓\n`);

      tasks[epNum] = {
        taskId,
        status: "ONGOING",
        submittedAt: new Date().toISOString(),
      };
      saveTasks(tasks);
      await sleep(500);
    } catch (err) {
      console.log(`  ERROR: ${err.code} - ${err.message}\n`);
    }
  }

  console.log(
    "Done. Run `node scripts/tingwu-batch.mjs poll` to check results.",
  );
}

// ---------------------------------------------------------------------------
// Status: overview of all tasks
// ---------------------------------------------------------------------------
function status() {
  const tasks = loadTasks();
  const entries = Object.entries(tasks);

  if (entries.length === 0) {
    console.log("No tasks yet. Run `submit` first.");
    return;
  }

  const counts = {};
  for (const [epNum, task] of entries) {
    counts[task.status] = (counts[task.status] || 0) + 1;
    const icon =
      task.status === "COMPLETED" ? "✓" : task.status === "FAILED" ? "✗" : "…";
    console.log(`  EP${epNum.padStart(3)}: ${icon} ${task.status}`);
  }

  console.log("\nSummary:");
  for (const [s, c] of Object.entries(counts)) {
    console.log(`  ${s}: ${c}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const cmd = process.argv[2];

if (cmd === "submit") {
  await submit();
} else if (cmd === "poll") {
  await poll();
} else if (cmd === "retry") {
  await retry();
} else if (cmd === "status") {
  status();
} else {
  console.log(
    "Usage: node scripts/tingwu-batch.mjs <submit|poll|retry|status>",
  );
}
