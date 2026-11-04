// Cloudflare Worker entry point.
//
//   /api/*        -> the Express app (app.js), served through Workers' node:http support
//   /files/<key>  -> uploaded files, streamed from the R2 bucket and cached at the edge
//   anything else -> the React build (static assets, wrangler.jsonc "assets"); a path with no
//                    file behind it gets the SPA shell, like netlify.toml's /* -> /app.html
import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import axios from "axios";
import bindings from "../db/bindings.js";

bindings.setBindings(env);
// axios would otherwise pick its node:http adapter; fetch is native here.
axios.defaults.adapter = "fetch";

const { default: app } = await import("../app.js");
const { IMMUTABLE_CACHE } = await import("../lib/fileStorage.js");

const PORT = 8080;
app.listen(PORT);
const expressHandler = httpServerHandler({ port: PORT });

const FILES_PREFIX = "/files/";

const serveFile = async (request, ctx) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return request.method === "HEAD" ? new Response(null, cached) : cached;

  let key;
  try {
    key = decodeURIComponent(new URL(request.url).pathname.slice(FILES_PREFIX.length));
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  if (!key || key.includes("..")) return new Response("Not Found", { status: 404 });

  const object = await env.UPLOADS.get(key);
  if (!object) return new Response("Not Found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", IMMUTABLE_CACHE);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Access-Control-Allow-Origin", "*");
  // Uploads are user-supplied; never let one run script in this origin.
  headers.set("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");

  const response = new Response(object.body, { headers });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return request.method === "HEAD" ? new Response(null, response) : response;
};

// Netlify answered unknown URLs with app.html (an empty noindex shell) rather than index.html,
// so a mistyped URL never returns the prerendered home page as a soft-404 duplicate. Same here.
// Under the default html_handling, /app.html redirects to /app, so ask for /app directly.
const SPA_HEADERS = {
  "Permissions-Policy": "interest-cohort=()",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const serveSpaShell = async (request) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Not Found", { status: 404 });
  }
  const shell = await env.ASSETS.fetch(new Request(new URL("/app", request.url), { method: request.method }));
  const headers = new Headers(shell.headers);
  for (const [k, v] of Object.entries(SPA_HEADERS)) headers.set(k, v);
  return new Response(shell.body, { status: shell.ok ? 200 : shell.status, headers });
};

export default {
  async fetch(request, workerEnv, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith(FILES_PREFIX)) return serveFile(request, ctx);
    if (pathname === "/api" || pathname.startsWith("/api/")) return expressHandler.fetch(request, workerEnv, ctx);
    return serveSpaShell(request);
  },
};
