import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SITE_URL,
  SITE_NAME,
  OG_IMAGE,
  SITE_JSON_LD,
  getRouteMeta,
  isPublicationPath,
} from '../lib/seo';

/**
 * Per-route <head> for the client-rendered app.
 *
 * React 19 hoists title/meta/link rendered anywhere in the tree into the document
 * head, so no helmet library is needed. index.html deliberately ships no title,
 * description or canonical — otherwise there would be two of each, which React's
 * docs call out as undefined behaviour for browsers and search engines.
 *
 * Any route not listed in seo.js is a private admin screen and is marked noindex —
 * except /resources/*, whose head is built from the publication record itself and is
 * therefore owned by <PublicationReader />. This component keeps its hands off those
 * routes entirely, including the prerendered-tag cleanup below: dropping the baked head
 * before the reader has loaded its replacement would leave the page with no robots
 * directive at all for as long as the fetch takes.
 */
const RouteSeo = () => {
  const { pathname } = useLocation();
  const meta = getRouteMeta(pathname);
  const publicationRoute = isPublicationPath(pathname);
  const canonical = meta ? `${SITE_URL}${meta.path === '/' ? '/' : meta.path}` : null;
  const lang = meta?.lang ?? (publicationRoute ? 'ml' : 'en');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Drop the build-time head that scripts/prerender.mjs baked into the static HTML.
  // React appends its own tags instead of replacing those, so without this the
  // rendered DOM carries two titles and two canonicals — and when Netlify answers
  // an unprerendered route with the SPA fallback, the stale pair is the home page's,
  // which is exactly the duplicate-canonical bug this work set out to remove.
  useEffect(() => {
    if (publicationRoute) return;
    document.querySelectorAll('[data-prerendered-seo]').forEach((el) => el.remove());
  }, [publicationRoute]);

  if (publicationRoute) return null;

  if (!meta) {
    return (
      <>
        <title>{SITE_NAME}</title>
        <meta name="robots" content="noindex, nofollow" />
      </>
    );
  }

  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={meta.lang === 'ml' ? 'ml_IN' : 'en_IN'} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={OG_IMAGE} />

      <script type="application/ld+json">{JSON.stringify(SITE_JSON_LD)}</script>
    </>
  );
};

export default RouteSeo;
