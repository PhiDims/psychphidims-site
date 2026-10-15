// GET /api/affirmation
// Shows the same affirmation as the Today's Affirmation app.
//
// How it works: the app keeps its affirmations in a list inside its page
// (const AFFIRMATIONS = [...]) and shows list[dayOfYear % list.length].
// This reads that list from the app's page and applies the same rule,
// using Nigerian time (Africa/Lagos, UTC+1), so the website and the app match.
//
// Optional: if "Affirmation data address" is set in /admin, that JSON address
// is used instead. If anything fails, the homepage keeps its fallback text.
import settings from "../../src/_data/settings.json";

const CACHE_SECONDS = 60 * 30;
const LAGOS_OFFSET_HOURS = 1;

export async function onRequestGet(context) {
  const debug = context && context.request && new URL(context.request.url).searchParams.has("debug");
  const info = { checkedAt: new Date().toISOString(), lagosDayOfYear: lagosDayOfYear(new Date()) };
  try {
    const result = (await fromJsonAddress(info)) || (await fromAppPage(info));
    if (debug) return json({ ...info, result: result || null });
    if (!result) return new Response(null, { status: 204 });
    return json(result, 600);
  } catch (e) {
    if (debug) return json({ ...info, error: String(e && e.message || e) });
    return new Response(null, { status: 204 });
  }
}

function json(data, maxAge) {
  return new Response(JSON.stringify(data, null, maxAge ? 0 : 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": maxAge ? `public, max-age=${maxAge}` : "no-store"
    }
  });
}

async function fromJsonAddress(info) {
  const url = String(settings.affirmation_api_url || "").trim();
  if (!/^https:\/\//.test(url)) return null;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cf: { cacheTtl: 900, cacheEverything: true } });
  if (!res.ok) return null;
  const data = await res.json();
  const pick = (o) => o && (o.text || o.affirmation || o.quote || o.message || o.content);
  const text = typeof data === "string" ? data : pick(data) || pick(data && data.data) || pick(Array.isArray(data) ? data[0] : null);
  return text ? { text: String(text).trim() } : null;
}

async function fromAppPage(info) {
  const url = String(settings.affirmation_app_url || "").trim();
  if (!/^https:\/\//.test(url)) { info.note = "App address not set"; return null; }
  const page = await get(url, info);
  if (!page) return null;

  // The list may live in the page itself or in one of its script files (e.g. js/data.js).
  const sources = [{ where: url, text: page }];
  const srcs = [...page.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]).slice(0, 8);
  for (const src of srcs) {
    let abs;
    try { abs = new URL(src, url); } catch (e) { continue; }
    if (abs.origin !== new URL(url).origin) continue;
    const text = await get(abs.toString(), info);
    if (text) sources.push({ where: abs.toString(), text });
  }

  for (const s of sources) {
    const list = extractAffirmations(s.text);
    if (list.length) {
      const index = lagosDayOfYear(new Date()) % list.length;
      info.foundIn = s.where; info.count = list.length; info.index = index;
      const item = list[index];
      return { text: item.text, reflection: item.reflection || "", action: item.action || "" };
    }
  }
  info.note = "Could not find the AFFIRMATIONS list in the app page or its scripts";
  return null;
}

async function get(u, info) {
  const res = await fetch(u, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; psychphidims.com)", Accept: "*/*" },
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
  });
  (info.fetched = info.fetched || []).push(`${res.status} ${u}`);
  return res.ok ? await res.text() : null;
}

// Pull every {text, reflection, action} entry out of `const AFFIRMATIONS = [ ... ];`
export function extractAffirmations(html) {
  const m = html.match(/(?:const|let|var|window\.)\s*AFFIRMATIONS\s*=\s*\[/);
  if (!m) return [];
  const open = m.index + m[0].length - 1;
  let close = html.indexOf("\n];", open);
  if (close < 0) close = html.indexOf("];", open);
  const block = html.slice(open + 1, close > 0 ? close : undefined);

  const items = [];
  // Each entry is an object literal {...}; split on top-level "{" at line start or after "},"
  const objects = block.match(/\{[^{}]*\}/g) || [];
  for (const obj of objects) {
    const text = field(obj, "text");
    if (text) items.push({ text, reflection: field(obj, "reflection"), action: field(obj, "action") });
  }
  return items;
}

function field(obj, name) {
  const re = new RegExp("(?:^|[,{\\s])" + name + "\\s*:\\s*(\"((?:[^\"\\\\]|\\\\.)*)\"|'((?:[^'\\\\]|\\\\.)*)'|`((?:[^`\\\\]|\\\\.)*)`)");
  const m = obj.match(re);
  if (!m) return "";
  const raw = m[2] ?? m[3] ?? m[4] ?? "";
  return raw.replace(/\\(["'`\\])/g, "$1").replace(/\\n/g, " ").trim();
}

// Same as the app's dayOfYear(): 1 on 1 January, using Nigerian local time.
export function lagosDayOfYear(now) {
  const local = new Date(now.getTime() + LAGOS_OFFSET_HOURS * 3600 * 1000);
  const y = local.getUTCFullYear();
  const today = Date.UTC(y, local.getUTCMonth(), local.getUTCDate());
  return Math.round((today - Date.UTC(y, 0, 0)) / 86400000);
}
