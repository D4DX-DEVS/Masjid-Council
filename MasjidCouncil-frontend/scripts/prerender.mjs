/**
 * Bakes one static HTML file per public URL into dist/.
 *
 * Vite ships a single index.html with an empty #root. Googlebot renders JS and
 * eventually sees the app, but the AI crawlers that matter for AI Overviews,
 * ChatGPT search and Perplexity (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot)
 * do not execute JavaScript at all — they were reading a blank page.
 *
 * This writes, for every route in src/lib/seo.js and every published chapter of
 * every publication:
 *   - a unique <title>, description and SELF-REFERENCING canonical
 *     (every route previously declared the home page as its canonical, which is
 *     why Google folded the whole site into one result)
 *   - Open Graph / Twitter tags and the JSON-LD graph for that page
 *   - a static text rendition of the page inside #root
 *
 * It also generates dist/sitemap.xml and appends the publications to dist/llms.txt,
 * so neither can drift from what was actually built.
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
import {
  ROUTES,
  SITE_JSON_LD,
  SITE_NAME,
  SITE_URL,
  OG_IMAGE,
  bookMeta,
  chapterMeta,
  chapterPath,
  publicationJsonLd,
  publicationName,
  publicationPath,
  sortChapters,
} from '../src/lib/seo.js';

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

/* ------------------------------------------------------------------- <head> */

/**
 * Every tag is stamped with data-prerendered-seo. React 19 hoists its own copies
 * into <head> on mount rather than replacing what is already there, so RouteSeo —
 * and, on /resources/*, PublicationReader — removes these on mount. Otherwise the
 * live DOM would carry two titles and two canonicals, and on an SPA-fallback
 * response the stale pair would be the home page's. Crawlers that never run JS
 * keep reading these.
 *
 * @param {{title: string, description: string, canonical: string, lang: string,
 *          image?: string, ogType?: string, jsonLd: object}} page
 * @returns {string}
 */
function headTags({
  title,
  description,
  canonical,
  lang,
  image = OG_IMAGE,
  ogType = 'website',
  jsonLd,
}) {
  const mark = 'data-prerendered-seo';
  const locale = lang === 'ml' ? 'ml_IN' : 'en_IN';

  return [
    `<title ${mark}>${escapeHtml(title)}</title>`,
    `<meta ${mark} name="description" content="${escapeHtml(description)}" />`,
    `<meta ${mark} name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link ${mark} rel="canonical" href="${canonical}" />`,
    `<meta ${mark} property="og:type" content="${ogType}" />`,
    `<meta ${mark} property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta ${mark} property="og:title" content="${escapeHtml(title)}" />`,
    `<meta ${mark} property="og:description" content="${escapeHtml(description)}" />`,
    `<meta ${mark} property="og:url" content="${canonical}" />`,
    `<meta ${mark} property="og:image" content="${escapeHtml(image)}" />`,
    `<meta ${mark} property="og:image:width" content="1200" />`,
    `<meta ${mark} property="og:image:height" content="630" />`,
    `<meta ${mark} property="og:locale" content="${locale}" />`,
    `<meta ${mark} name="twitter:card" content="summary_large_image" />`,
    `<meta ${mark} name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta ${mark} name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta ${mark} name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script ${mark} type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ].join('\n    ');
}

/* -------------------------------------------------------------------- <body> */

// The inline script hides the static copy the moment the parser reaches it —
// before first paint — so JS-enabled browsers never flash unstyled text while
// the React bundle loads. Crawlers and no-JS readers don't execute it and keep
// seeing the content; hydration replaces the whole #root subtree anyway.
const staticBody = (parts) =>
  [
    '<div id="prerendered-content">',
    ...parts.filter(Boolean),
    '</div>',
    `<script>document.getElementById('prerendered-content').style.display='none'</script>`,
  ].join('');

const linkList = (items) =>
  `<ul>${items
    .map(({ href, text }) => `<li><a href="${href}">${escapeHtml(text)}</a></li>`)
    .join('')}</ul>`;

/**
 * Chapter bodies are sanitized on write (backend lib/sanitizeRichText.js), which is the
 * control that matters. This is a second, narrower pass for the same reason the reader
 * runs DOMPurify again: the write path is not the only way HTML could reach Mongo, and
 * here it would be inlined into a static file with no browser sanitizer in front of it.
 *
 * Anything outside the allowlist is dropped, tag and attributes together. Text between
 * tags is already escaped by the server's sanitizer and is passed through untouched.
 */
const BODY_TAGS = new Set([
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'hr',
  'img',
  'figure',
  'figcaption',
]);
const BODY_ATTRS = { a: ['href'], img: ['src', 'alt'] };
const VOID_TAGS = new Set(['br', 'hr', 'img']);

/**
 * @param {string} html
 * @returns {string}
 */
function safeChapterHtml(html) {
  // Dropping only the tags would leave a <script> or <style> body behind as visible text.
  // The server's sanitizer already removes these wholesale (nonTextTags); this mirrors it.
  const withoutRawText = String(html || '').replace(
    /<(script|style|textarea|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    ''
  );

  return withoutRawText.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>/g,
    (_match, closing, rawTag, rawAttrs) => {
      const tag = rawTag.toLowerCase();
      if (!BODY_TAGS.has(tag)) return '';
      if (closing) return VOID_TAGS.has(tag) ? '' : `</${tag}>`;

      const attrs = (BODY_ATTRS[tag] || [])
        .map((name) => {
          const found = rawAttrs.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
          if (!found) return '';
          // Values arrive already HTML-escaped from sanitize-html, so they are written
          // through as they are; escaping again would turn &amp; into &amp;amp;.
          const value = found[1];
          if ((name === 'href' || name === 'src') && !/^(https?:|mailto:|\/)/i.test(value)) {
            return '';
          }
          return ` ${name}="${value}"`;
        })
        .join('');

      return VOID_TAGS.has(tag) ? `<${tag}${attrs} />` : `<${tag}${attrs}>`;
    }
  );
}

/**
 * Static rendition of a route from src/lib/seo.js. The home page additionally lists the
 * publications: the live strip is fetched at runtime, so without this a crawler sees
 * neither the books nor any path to their chapters.
 *
 * @param {import('../src/lib/seo.js').RouteMeta} route
 * @param {object[]} publications
 * @returns {string}
 */
function bodyFor(route, publications) {
  const nav = ROUTES.filter((r) => r.path !== route.path).map((r) => ({
    href: r.path,
    text: r.heading,
  }));

  const books =
    route.path === '/' && publications.length
      ? [
          '<h2>പ്രസിദ്ധീകരണങ്ങൾ — Publications</h2>',
          `<p>${escapeHtml(
            `${SITE_NAME} publishes guides for masjid and mahallu committees, readable in full on this site.`
          )}</p>`,
          `<ul>${publications
            .map((publication) => {
              const blurb = [publication.subtitle, publication.description]
                .filter(Boolean)
                .join(' — ');
              return `<li><a href="${publicationPath(publication)}">${escapeHtml(
                publicationName(publication)
              )}</a>${blurb ? ` — ${escapeHtml(blurb)}` : ''}</li>`;
            })
            .join('')}</ul>`,
        ]
      : [];

  return staticBody([
    `<h1>${escapeHtml(route.heading)}</h1>`,
    ...route.body.map((p) => `<p>${escapeHtml(p)}</p>`),
    ...books,
    `<nav aria-label="Site">${linkList(nav)}</nav>`,
  ]);
}

/**
 * Static rendition of one chapter — the whole chapter text, plus the table of contents so
 * a crawler landing on any chapter can reach every other one.
 */
function chapterBodyFor(publication, chapter, chapters) {
  const toc = chapters.map((c) => ({ href: chapterPath(publication, c), text: c.title }));

  return staticBody([
    `<h1>${escapeHtml(publicationName(publication))}</h1>`,
    publication.subtitle ? `<p>${escapeHtml(publication.subtitle)}</p>` : '',
    `<h2>${escapeHtml(chapter.title)}</h2>`,
    safeChapterHtml(chapter.bodyHtml),
    `<nav aria-label="Chapters">${linkList(toc)}</nav>`,
    `<nav aria-label="Site">${linkList([{ href: '/', text: SITE_NAME }])}</nav>`,
  ]);
}

/** Static rendition of a bare /resources/:slug — the blurb and the table of contents. */
function bookBodyFor(publication, chapters) {
  const toc = chapters.map((c) => ({ href: chapterPath(publication, c), text: c.title }));

  return staticBody([
    `<h1>${escapeHtml(publicationName(publication))}</h1>`,
    publication.subtitle ? `<p>${escapeHtml(publication.subtitle)}</p>` : '',
    publication.description ? `<p>${escapeHtml(publication.description)}</p>` : '',
    `<nav aria-label="Chapters">${linkList(toc)}</nav>`,
    `<nav aria-label="Site">${linkList([{ href: '/', text: SITE_NAME }])}</nav>`,
  ]);
}

/* --------------------------------------------------------------- page writer */

/**
 * @param {string} template dist/index.html as emitted by Vite
 * @param {{lang: string, head: string, body: string}} page
 * @returns {string}
 */
function renderPage(template, { lang, head, body }) {
  if (!template.includes('<div id="root"></div>')) {
    throw new Error('dist/index.html has no empty #root — prerender target changed');
  }

  return template
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
    .replace('</head>', `  ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

/** '/' writes dist/index.html; every other path writes <path>/index.html. */
async function writePage(path, html) {
  if (path === '/') {
    await writeFile(resolve(DIST, 'index.html'), html);
    return;
  }
  const dir = resolve(DIST, path.replace(/^\//, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, 'index.html'), html);
}

/**
 * Neutral shell for Netlify's SPA fallback (admin routes and any unknown URL).
 *
 * Without it the fallback would serve the prerendered home page, so every typo and
 * dead link would answer 200 with the full home page content — an unbounded set of
 * soft-404 duplicates. This shell carries no content and is noindex; React boots
 * normally and routes on the real URL, so the admin screens still work.
 *
 * Its two tags carry data-prerendered-seo like every other baked tag: a publication
 * added since the last deploy is answered from here, and the reader has to be able to
 * drop this noindex once it has rendered the real head for that chapter.
 *
 * @param {string} template
 * @returns {string}
 */
function renderFallbackShell(template) {
  return template.replace(
    '</head>',
    '  <title data-prerendered-seo>Masjid Council Kerala</title>\n' +
      '    <meta data-prerendered-seo name="robots" content="noindex, nofollow" />\n  </head>'
  );
}

/* ---------------------------------------------------------------- sitemap.xml */

const isoDate = (value) => (value ? String(value).slice(0, 10) : null);

/**
 * Generated rather than hand-maintained, so a publication cannot be live and missing from
 * the sitemap. Bare /resources/:slug URLs are deliberately absent: they canonicalise to the
 * first chapter, and a sitemap should only list canonical URLs.
 *
 * @param {object[]} publications
 * @returns {string}
 */
function sitemapXml(publications) {
  const entries = ROUTES.map((route) => ({
    loc: `${SITE_URL}${route.path === '/' ? '/' : route.path}`,
    changefreq: route.changefreq,
    priority: route.priority,
    lastmod: null,
  }));

  for (const publication of publications) {
    for (const chapter of sortChapters(publication.chapters)) {
      entries.push({
        loc: `${SITE_URL}${chapterPath(publication, chapter)}`,
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: isoDate(publication.updatedAt),
      });
    }
  }

  const urls = entries
    .map(
      ({ loc, changefreq, priority, lastmod }) =>
        `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}` +
        `<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/* ------------------------------------------------------------------- llms.txt */

/**
 * public/llms.txt holds the hand-written prose; the publications are appended here so the
 * list of books and chapters cannot go stale. The chapter links are what an AI crawler
 * follows to reach the text worth citing.
 *
 * @param {string} base dist/llms.txt as copied from public/
 * @param {object[]} publications
 * @returns {string}
 */
function llmsTxt(base, publications) {
  if (!publications.length) return base;

  const section = [
    '## Publications',
    ...publications.flatMap((publication) => {
      const chapters = sortChapters(publication.chapters);
      const blurb = [publication.subtitle, publication.description].filter(Boolean).join(' — ');
      return [
        `- [${publicationName(publication)}](${SITE_URL}${publicationPath(publication)}): ${
          blurb || `A publication of ${SITE_NAME}.`
        } ${chapters.length} chapters, full text on the site.`,
        ...chapters.map(
          (chapter) => `  - [${chapter.title}](${SITE_URL}${chapterPath(publication, chapter)})`
        ),
      ];
    }),
    '',
  ].join('\n');

  // Key facts reads as the closing block, so the books go in front of it.
  const marker = '## Key facts';
  return base.includes(marker)
    ? base.replace(marker, `${section}\n${marker}`)
    : `${base.trimEnd()}\n\n${section}`;
}

/* ----------------------------------------------------------------------- data */

const API_BASE_URL = (process.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

async function apiGet(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`GET ${url} → ${response.status}`);
  const payload = await response.json();
  if (payload.success === false) throw new Error(`GET ${url} → ${payload.message}`);
  return payload.data;
}

/**
 * The published books with every chapter body, read from the same public endpoints the
 * browser uses.
 *
 * A build with no API URL configured (a bare `npm run prerender` locally) skips
 * publications. A build that has one and cannot reach it fails instead: shipping a dist/
 * without the chapter pages would drop them out of both the index and the sitemap, and
 * nothing downstream would notice.
 *
 * @returns {Promise<object[]>}
 */
async function loadPublications() {
  if (!API_BASE_URL) {
    process.stdout.write('prerender: VITE_API_BASE_URL not set — skipping publications\n');
    return [];
  }

  const base = `${API_BASE_URL}/api/publications`;
  const section = await apiGet(`${base}/section`);
  if (section && section.enabled === false) return [];

  const cards = await apiGet(base);
  const publications = [];

  for (const card of cards) {
    const book = await apiGet(`${base}/${encodeURIComponent(card.slug)}`);
    const chapters = [];
    for (const chapter of sortChapters(book.chapters)) {
      const full = await apiGet(
        `${base}/${encodeURIComponent(book.slug)}/chapters/${encodeURIComponent(chapter.slug)}`
      );
      chapters.push({ ...chapter, bodyHtml: full.bodyHtml || '' });
    }
    // The card list carries the blurb; the reader outline does not always.
    publications.push({ ...book, description: book.description || card.description, chapters });
  }

  return publications;
}

/* ----------------------------------------------------------------------- main */

async function main() {
  const templatePath = resolve(DIST, 'index.html');
  const template = await readFile(templatePath, 'utf8');
  const publications = await loadPublications();

  await writeFile(resolve(DIST, 'app.html'), renderFallbackShell(template));

  for (const route of ROUTES) {
    await writePage(
      route.path,
      renderPage(template, {
        lang: route.lang,
        head: headTags({ ...route, canonical: `${SITE_URL}${route.path}`, jsonLd: SITE_JSON_LD }),
        body: bodyFor(route, publications),
      })
    );
  }

  let chapterCount = 0;
  for (const publication of publications) {
    const chapters = sortChapters(publication.chapters);
    if (!chapters.length) continue;

    const image = publication.coverImage?.url || OG_IMAGE;
    const overview = bookMeta(publication, chapters[0]);

    await writePage(
      overview.path,
      renderPage(template, {
        lang: overview.lang,
        head: headTags({
          ...overview,
          canonical: `${SITE_URL}${overview.canonicalPath}`,
          image,
          jsonLd: publicationJsonLd({ publication, chapters }),
        }),
        body: bookBodyFor(publication, chapters),
      })
    );

    for (const chapter of chapters) {
      const meta = chapterMeta(publication, chapter, chapter.bodyHtml);
      await writePage(
        meta.path,
        renderPage(template, {
          lang: meta.lang,
          head: headTags({
            ...meta,
            canonical: `${SITE_URL}${meta.path}`,
            image,
            ogType: 'article',
            jsonLd: publicationJsonLd({ publication, chapters, chapter }),
          }),
          body: chapterBodyFor(publication, chapter, chapters),
        })
      );
      chapterCount += 1;
    }
  }

  await writeFile(resolve(DIST, 'sitemap.xml'), sitemapXml(publications));

  const llmsPath = resolve(DIST, 'llms.txt');
  await writeFile(llmsPath, llmsTxt(await readFile(llmsPath, 'utf8'), publications));

  process.stdout.write(
    `prerender: wrote ${ROUTES.length} routes, ${publications.length} publications ` +
      `(${chapterCount} chapters), sitemap.xml, llms.txt and the app.html fallback shell\n`
  );
}

main().catch((error) => {
  process.stderr.write(`prerender: failed — ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
});
