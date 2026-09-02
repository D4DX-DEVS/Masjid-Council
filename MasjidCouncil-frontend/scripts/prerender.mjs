/**
 * Bakes one static HTML file per public route into dist/.
 *
 * Vite ships a single index.html with an empty #root. Googlebot renders JS and
 * eventually sees the app, but the AI crawlers that matter for AI Overviews,
 * ChatGPT search and Perplexity (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot)
 * do not execute JavaScript at all — they were reading a blank page.
 *
 * This writes, for every route in src/lib/seo.js:
 *   - a unique <title>, description and SELF-REFERENCING canonical
 *     (every route previously declared the home page as its canonical, which is
 *     why Google folded the whole site into one result)
 *   - Open Graph / Twitter tags and the Organization + WebSite JSON-LD graph
 *   - a static text rendition of the page inside #root
 *
 * React's createRoot replaces the #root content on hydration, so the static copy
 * is only ever seen by non-rendering clients. It is a faithful summary of the
 * live page, not keyword filler.
 *
 * Run: node scripts/prerender.mjs  (wired into `npm run build`, after vite build)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES, SITE_JSON_LD, SITE_NAME, SITE_URL, OG_IMAGE } from '../src/lib/seo.js';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(here, '../dist');

/**
 * @param {string} value
 * @returns {string}
 */
const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * @param {import('../src/lib/seo.js').RouteMeta} route
 * @returns {string}
 */
function headFor(route) {
  const canonical = `${SITE_URL}${route.path}`;
  const locale = route.lang === 'ml' ? 'ml_IN' : 'en_IN';

  // Every tag is stamped with data-prerendered-seo. React 19 hoists its own copies
  // into <head> on mount rather than replacing what is already there, so RouteSeo
  // removes these on mount — otherwise the live DOM would carry two titles and two
  // canonicals, and on an SPA-fallback response the stale pair would be the home
  // page's. Crawlers that never run JS keep reading these.
  const mark = 'data-prerendered-seo';

  return [
    `<title ${mark}>${escapeHtml(route.title)}</title>`,
    `<meta ${mark} name="description" content="${escapeHtml(route.description)}" />`,
    `<meta ${mark} name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link ${mark} rel="canonical" href="${canonical}" />`,
    `<meta ${mark} property="og:type" content="website" />`,
    `<meta ${mark} property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta ${mark} property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta ${mark} property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta ${mark} property="og:url" content="${canonical}" />`,
    `<meta ${mark} property="og:image" content="${OG_IMAGE}" />`,
    `<meta ${mark} property="og:image:width" content="1200" />`,
    `<meta ${mark} property="og:image:height" content="630" />`,
    `<meta ${mark} property="og:locale" content="${locale}" />`,
    `<meta ${mark} name="twitter:card" content="summary_large_image" />`,
    `<meta ${mark} name="twitter:title" content="${escapeHtml(route.title)}" />`,
    `<meta ${mark} name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta ${mark} name="twitter:image" content="${OG_IMAGE}" />`,
    `<script ${mark} type="application/ld+json">${JSON.stringify(SITE_JSON_LD)}</script>`,
  ].join('\n    ');
}

/**
 * Static text rendition placed inside #root, replaced by React on hydration.
 *
 * @param {import('../src/lib/seo.js').RouteMeta} route
 * @returns {string}
 */
function bodyFor(route) {
  const nav = ROUTES.filter((r) => r.path !== route.path)
    .map((r) => `<li><a href="${r.path}">${escapeHtml(r.heading)}</a></li>`)
    .join('');

  const paragraphs = route.body.map((p) => `<p>${escapeHtml(p)}</p>`).join('');

  // The inline script hides the static copy the moment the parser reaches it —
  // before first paint — so JS-enabled browsers never flash unstyled text while
  // the React bundle loads. Crawlers and no-JS readers don't execute it and keep
  // seeing the content; hydration replaces the whole #root subtree anyway.
  return [
    '<div id="prerendered-content">',
    `<h1>${escapeHtml(route.heading)}</h1>`,
    paragraphs,
    `<nav aria-label="Site"><ul>${nav}</ul></nav>`,
    '</div>',
    `<script>document.getElementById('prerendered-content').style.display='none'</script>`,
  ].join('');
}

/**
 * @param {string} template dist/index.html as emitted by Vite
 * @param {import('../src/lib/seo.js').RouteMeta} route
 * @returns {string}
 */
function renderRoute(template, route) {
  let html = template;

  if (!html.includes('<div id="root"></div>')) {
    throw new Error('dist/index.html has no empty #root — prerender target changed');
  }

  html = html.replace(/<html lang="[^"]*"/, `<html lang="${route.lang}"`);
  html = html.replace('</head>', `  ${headFor(route)}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyFor(route)}</div>`);

  return html;
}

/**
 * Neutral shell for Netlify's SPA fallback (admin routes and any unknown URL).
 *
 * Without it the fallback would serve the prerendered home page, so every typo and
 * dead link would answer 200 with the full home page content — an unbounded set of
 * soft-404 duplicates. This shell carries no content and is noindex; React boots
 * normally and routes on the real URL, so the admin screens still work.
 *
 * @param {string} template
 * @returns {string}
 */
function renderFallbackShell(template) {
  return template.replace(
    '</head>',
    '  <title>Masjid Council Kerala</title>\n' +
      '    <meta name="robots" content="noindex, nofollow" />\n  </head>',
  );
}

async function main() {
  const templatePath = resolve(DIST, 'index.html');
  const template = await readFile(templatePath, 'utf8');

  await writeFile(resolve(DIST, 'app.html'), renderFallbackShell(template));

  for (const route of ROUTES) {
    const html = renderRoute(template, route);

    if (route.path === '/') {
      await writeFile(templatePath, html);
    } else {
      const dir = resolve(DIST, route.path.replace(/^\//, ''));
      await mkdir(dir, { recursive: true });
      await writeFile(resolve(dir, 'index.html'), html);
    }
  }

  process.stdout.write(`prerender: wrote ${ROUTES.length} routes + app.html fallback shell\n`);
}

main().catch((error) => {
  process.stderr.write(`prerender: failed — ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
});
