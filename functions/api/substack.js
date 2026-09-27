// Cloudflare Pages Function: GET /api/substack
// Reads the Substack RSS feed and returns the latest posts as JSON.
// The Substack address comes from the site settings (editable in /admin).
import settings from "../../src/_data/settings.json";

const CACHE_SECONDS = 60 * 30; // refresh every 30 minutes

export async function onRequestGet(context) {
  const base = String(settings.substack_url || "").replace(/\/+$/, "");
  if (!/^https:\/\/[^\[\]\s]+$/.test(base)) {
    return json({ posts: [], home: base, note: "Substack address not set yet" });
  }

  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/substack", context.request.url).toString());
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let posts = [];
  try {
    const res = await fetch(base + "/feed", {
      headers: { "User-Agent": "psychphidims.com feed reader", Accept: "application/rss+xml, application/xml, text/xml" },
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
    });
    if (res.ok) posts = parseRss(await res.text()).slice(0, 12);
  } catch (e) {
    posts = [];
  }

  const response = json({ posts, home: base });
  if (posts.length) context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${CACHE_SECONDS}`
    }
  });
}

function parseRss(xml) {
  const items = xml.split(/<item[\s>]/i).slice(1);
  return items.map((raw) => {
    const item = raw.split(/<\/item>/i)[0];
    const content = tag(item, "content:encoded");
    const image =
      attr(item, "enclosure", "url") ||
      attr(item, "media:content", "url") ||
      (content.match(/<img[^>]+src="([^"]+)"/i) || [])[1] ||
      "";
    return {
      title: clean(tag(item, "title")),
      link: clean(tag(item, "link")),
      date: clean(tag(item, "pubDate")),
      subtitle: truncate(clean(stripHtml(tag(item, "description"))), 180),
      image: decode(image)
    };
  }).filter((p) => p.title && p.link);
}

function tag(s, name) {
  const re = new RegExp("<" + name.replace(":", "\\:") + "[^>]*>([\\s\\S]*?)<\\/" + name.replace(":", "\\:") + ">", "i");
  const m = s.match(re);
  if (!m) return "";
  return m[1].replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "");
}
function attr(s, name, a) {
  const re = new RegExp("<" + name.replace(":", "\\:") + "[^>]*\\s" + a + "=\"([^\"]+)\"", "i");
  const m = s.match(re);
  return m ? m[1] : "";
}
function stripHtml(s) { return String(s).replace(/<[^>]*>/g, " "); }
function decode(s) {
  return String(s)
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#8217;/g, "’").replace(/&#8220;/g, "“").replace(/&#8221;/g, "”");
}
function clean(s) { return decode(String(s)).replace(/\s+/g, " ").trim(); }
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }
