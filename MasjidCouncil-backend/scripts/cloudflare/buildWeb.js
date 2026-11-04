// Builds the React frontend into ../MasjidCouncil-frontend/dist for the Worker's static assets,
// then writes the Cloudflare `_headers` file there (the Workers equivalent of the [[headers]]
// blocks in netlify.toml).
//
//   node scripts/cloudflare/buildWeb.js
//
// VITE_API_BASE_URL defaults to this Worker's public URL. Set it in the environment to point
// the build at a custom domain instead. It is used both in the bundle and by the prerender
// step, which fetches the publications from the live API.

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const FRONTEND = path.join(__dirname, "../../../MasjidCouncil-frontend");
const DIST = path.join(FRONTEND, "dist");
const API = process.env.VITE_API_BASE_URL || "https://masjid-council-api.d4dx-erp.workers.dev";

execSync("npm run build", {
  cwd: FRONTEND,
  stdio: "inherit",
  env: { ...process.env, VITE_API_BASE_URL: API },
});

const HEADERS = `/*
  Permissions-Policy: interest-cohort=()
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=86400

/favicon.ico
  Cache-Control: public, max-age=86400

/sitemap.xml
  Cache-Control: public, max-age=3600

/llms.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=3600
`;

fs.writeFileSync(path.join(DIST, "_headers"), HEADERS);
if (!fs.existsSync(path.join(DIST, "app.html"))) {
  throw new Error("dist/app.html missing - the prerender step did not run");
}
console.log(`frontend built against ${API}`);
