/**
 * parse-rss.mjs
 *
 * Zero-dependency Node.js script that fetches the CSS podcast RSS feed
 * from RSSHub and generates resources/data/episodes.json.
 *
 * Usage:
 *   node scripts/parse-rss.mjs
 *
 * RSS Sources (with fallback):
 *   1. https://rsshub.rssforever.com/xiaoyuzhou/podcast/618929e0633ec15a3b46145e
 *   2. https://hub.slarker.me/xiaoyuzhou/podcast/618929e0633ec15a3b46145e
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const OUTPUT_PATH = resolve(PROJECT_ROOT, "resources/data/episodes.json");

const RSS_URLS = [
  "https://rsshub.rssforever.com/xiaoyuzhou/podcast/618929e0633ec15a3b46145e",
  "https://hub.slarker.me/xiaoyuzhou/podcast/618929e0633ec15a3b46145e",
];

const MAX_EPISODES = 25;
const DESCRIPTION_MAX_LENGTH = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch with timeout and fallback URLs.
 * @param {string[]} urls
 * @returns {Promise<string>}
 */
async function fetchWithFallback(urls) {
  for (const url of urls) {
    try {
      console.log(`Fetching ${url} ...`);
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        headers: { "User-Agent": "XYVC-RSS-Parser/1.0" },
      });
      if (!res.ok) {
        console.warn(`  HTTP ${res.status} — skipping`);
        continue;
      }
      const text = await res.text();
      if (!text || text.length < 100) {
        console.warn("  Empty or too-short response — skipping");
        continue;
      }
      console.log(`  OK (${(text.length / 1024).toFixed(1)} KB)`);
      return text;
    } catch (err) {
      console.warn(`  Failed: ${err.message}`);
    }
  }
  throw new Error("All RSS feed URLs failed");
}

/**
 * Extract text content of an XML tag from a string.
 * Returns null if not found.
 */
function xmlTag(xml, tag) {
  // Handle namespaced tags like itunes:duration
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

/**
 * Extract attribute value from an XML tag.
 */
function xmlAttr(xml, tag, attr) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const attrEsc = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}[^>]*\\s${attrEsc}="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

/**
 * Strip HTML tags and decode common HTML entities.
 */
function stripHtml(html) {
  if (!html) return "";
  // First decode HTML entities in the RSS (double-encoded)
  let text = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  // Now strip actual HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

/**
 * Convert RFC 2822 date to YYYY-MM-DD.
 * e.g. "Wed, 11 Feb 2026 11:30:00 GMT" -> "2026-02-11"
 */
function toISODate(rfc2822) {
  if (!rfc2822) return null;
  const d = new Date(rfc2822);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

/**
 * Normalize duration to MM:SS or H:MM:SS format.
 * Input may be seconds (number) or already formatted string.
 */
function normalizeDuration(raw) {
  if (!raw) return null;
  // If it already looks like H:MM:SS or MM:SS, return as-is
  if (/^\d+:\d{2}(:\d{2})?$/.test(raw)) {
    // Strip leading "0:" if present (e.g. "0:36:21" -> "36:21")
    if (/^0:/.test(raw)) {
      return raw.slice(2);
    }
    return raw;
  }
  // If it's a number (seconds), convert
  const secs = parseInt(raw, 10);
  if (isNaN(secs)) return raw;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/**
 * Parse episode number and title parts from the RSS title.
 *
 * Title formats observed:
 *   "181 - Base生态百倍币频出，AI+Web3社交引爆 - Mr. Luo"
 *   "EP42 - Some title - Guest"
 *   "Some title without number"
 *
 * Returns { ep: number|null, title: string, guest: string|null }
 */
function parseTitle(rawTitle) {
  if (!rawTitle) return { ep: null, title: "", guest: null };

  let ep = null;
  let title = rawTitle;
  let guest = null;

  // Try to extract episode number from the beginning
  // Pattern: "181 - ..." or "EP181 - ..." or "ep 181 - ..."
  const epMatch = rawTitle.match(/^(?:EP\s*)?(\d+)\s*-\s*/i);
  if (epMatch) {
    ep = parseInt(epMatch[1], 10);
    title = rawTitle.slice(epMatch[0].length);
  }

  // Extract guest: text after the LAST guest separator in the remaining title.
  // Separator patterns:
  //   " - Guest"       (standard: space-dash-space)
  //   "！- Guest"      (full-width ! + dash-space)
  //   "？- Guest"      (full-width ? + dash-space)
  const guestRe = /(?:\s-\s|[！？]-\s)([^-]+)$/;
  const guestMatch = title.match(guestRe);
  if (guestMatch) {
    guest = guestMatch[1].trim();
    title = title.slice(0, guestMatch.index).trim();
  }

  return { ep, title, guest };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const xml = await fetchWithFallback(RSS_URLS);

  // Extract all <item>...</item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const rawItems = [];
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    rawItems.push(match[1]);
  }

  console.log(`Found ${rawItems.length} items in RSS feed`);

  if (rawItems.length === 0) {
    console.error("No items found in RSS feed. Aborting.");
    process.exit(1);
  }

  // Take at most MAX_EPISODES
  const items = rawItems.slice(0, MAX_EPISODES);

  const episodes = items.map((itemXml, index) => {
    const rawTitle = xmlTag(itemXml, "title");
    // Decode XML entities in title (e.g. &amp; -> &)
    const decodedTitle = rawTitle
      ? rawTitle
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
      : rawTitle;
    const { ep, title, guest } = parseTitle(decodedTitle);
    const pubDate = xmlTag(itemXml, "pubDate");
    const rawDuration = xmlTag(itemXml, "itunes:duration");
    const rawDescription = xmlTag(itemXml, "description");
    const link = xmlTag(itemXml, "link");
    const guid = xmlTag(itemXml, "guid");
    const audioUrl = xmlAttr(itemXml, "enclosure", "url");

    // Clean and truncate description
    let description = stripHtml(rawDescription);
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      description =
        description.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd() + "...";
    }

    return {
      ep: ep,
      title: title,
      guest: guest || null,
      date: toISODate(pubDate),
      duration: normalizeDuration(rawDuration),
      description: description,
      audioUrl: audioUrl || null,
      xiaoyuzhouUrl: link || guid || null,
      tags: ["加密创投"],
      showNotes: null,
    };
  });

  // If episode numbers were not in titles, derive them
  // (fallback: assume first item is the newest, number them downward)
  const hasEpNumbers = episodes.some((e) => e.ep !== null);
  if (!hasEpNumbers) {
    console.log(
      "No episode numbers found in titles; deriving from position...",
    );
    // Assume the total count equals the first item's position
    // or use a hardcoded starting number
    const startEp = rawItems.length; // conservative; will be off if feed has < total episodes
    episodes.forEach((e, i) => {
      e.ep = startEp - i;
    });
  }

  // Ensure output directory exists
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  // Write JSON
  writeFileSync(OUTPUT_PATH, JSON.stringify(episodes, null, 2) + "\n", "utf-8");
  console.log(`\nWrote ${episodes.length} episodes to ${OUTPUT_PATH}`);

  // Summary
  const first = episodes[0];
  const last = episodes[episodes.length - 1];
  console.log(`  Newest: EP${first.ep} "${first.title}" (${first.date})`);
  console.log(`  Oldest: EP${last.ep} "${last.title}" (${last.date})`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
