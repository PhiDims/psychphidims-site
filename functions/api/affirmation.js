// Cloudflare Pages Function: GET /api/affirmation
// Fetches today's affirmation from the Today's Affirmation app, if that app
// offers a JSON address (set "Affirmation data address" in /admin → Site settings).
// If nothing is set, or the app can't be reached, the homepage keeps showing
// the fallback affirmation written in the editor.
import settings from "../../src/_data/settings.json";

export async function onRequestGet() {
  const url = String(settings.affirmation_api_url || "").trim();
  if (!/^https:\/\//.test(url)) return new Response(null, { status: 204 });

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 900, cacheEverything: true }
    });
    if (!res.ok) return new Response(null, { status: 204 });
    const data = await res.json();
    const pick = (o) => o && (o.text || o.affirmation || o.quote || o.message || o.content);
    const text = typeof data === "string" ? data : pick(data) || pick(data && data.data) || pick(Array.isArray(data) ? data[0] : null);
    if (!text) return new Response(null, { status: 204 });
    return new Response(JSON.stringify({ text: String(text).trim() }), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=900" }
    });
  } catch (e) {
    return new Response(null, { status: 204 });
  }
}
