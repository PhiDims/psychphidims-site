// Cloudflare Worker entry for psychphidims.com
// Pages and images are served from the built site (_site).
// Only the two live features below run as code.
import { onRequestGet as substack } from "../functions/api/substack.js";
import { onRequestGet as affirmation } from "../functions/api/affirmation.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const context = { request, env, waitUntil: (p) => ctx.waitUntil(p) };

    if (url.pathname === "/api/substack") return substack(context);
    if (url.pathname === "/api/affirmation") return affirmation(context);

    return env.ASSETS.fetch(request);
  }
};
