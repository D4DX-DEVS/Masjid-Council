/**
 * Single source of truth for per-route SEO metadata.
 *
 * Consumed twice:
 *  1. At runtime by <RouteSeo /> (React 19 hoists title/meta/link into <head>).
 *  2. At build time by scripts/prerender.mjs, which bakes the same head — plus a
 *     static text fallback — into one HTML file per public route.
 *
 * Why both: Googlebot renders JS, but AI crawlers (GPTBot, OAI-SearchBot,
 * PerplexityBot, ClaudeBot) do not. The prerendered copy is what they read.
 */

export const SITE_URL = 'https://masjidcouncilkerala.org';
export const SITE_NAME = 'Masjid Council Kerala';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const LOGO_URL = `${SITE_URL}/logo-512.png`;

/**
 * @typedef {object} RouteMeta
 * @property {string} path        Route path, exactly as it appears in the URL.
 * @property {string} title       Unique <title>. Keep under ~60 chars before the brand suffix.
 * @property {string} description Unique meta description, 140-160 chars.
 * @property {string} lang        Dominant content language, drives <html lang>.
 * @property {number} priority    Sitemap priority.
 * @property {string} changefreq  Sitemap changefreq.
 * @property {string} heading     H1 used in the prerendered static fallback.
 * @property {string[]} body      Paragraphs for the prerendered static fallback.
 */

/** @type {RouteMeta[]} */
export const ROUTES = [
  {
    path: '/',
    title: 'Masjid Council Kerala | Masjid Affiliation, Welfare Fund & Masjid Fund',
    description:
      'Official platform of Masjid Council Kerala. Apply for masjid affiliation, Imam–Muaddin Welfare Fund and Masjid Fund assistance, and track your application status online.',
    lang: 'ml',
    priority: 1.0,
    changefreq: 'weekly',
    heading: 'മസ്ജിദ് കൗൺസിൽ കേരള — Masjid Council Kerala',
    body: [
      // Front-loaded, self-contained definition. Google AI answers were describing the
      // council as "an official state organization" — inferred from third-party pages,
      // with nothing on this site to correct it. This is the corrective passage.
      'Masjid Council Kerala is an initiative of Jamaat-e-Islami Hind Kerala, established in 1990 to make mosques centres of excellence. It is a non-governmental organisation and is not a state or government body. It supervises the work of masjids and mahallus across the fourteen districts of Kerala, trains khateebs and imams, and runs welfare schemes for mosque staff.',
      'മസ്ജിദുകളെ മികവിന്റെ കേന്ദ്രങ്ങളാക്കുക എന്ന ലക്ഷ്യത്തോടെ 1990-ൽ സ്ഥാപിതമായ സംവിധാനമാണ് മസ്ജിദ് കൗൺസിൽ കേരള.',
      'Applications available online: Masjid Affiliation (മസ്ജിദ് അഫിലിയേഷൻ), Imam Muaddin Welfare Fund (ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി) and Masjid Fund (മസ്ജിദ് ഫണ്ട്).',
      'Reach across Kerala: 550 juma masjids, 161 prayer halls, 711 total, 62 complete mahallus and 200 partial mahallus.',
      'Applicants can track an application using the reference number or the mobile number used at registration.',
      'Contact: Masjid Council Kerala, Hira Centre, PB No. 833, Mavoor Road, Kozhikode - 4, 673004. Phone +91 95624 78805. Email masjidcouncilkerala@gmail.com.',
    ],
  },
  {
    path: '/about',
    title: 'About Masjid Council Kerala | Established 1990',
    description:
      'Masjid Council Kerala, founded in 1990, supervises masjids and mahallus, trains khateebs and imams, and runs the Imam–Muaddin Welfare Fund, Masjid Fund and Masjid Excellence Award.',
    lang: 'ml',
    priority: 0.8,
    changefreq: 'monthly',
    heading: 'മസ്ജിദ് കൗൺസിൽ കേരള — About Us',
    body: [
      'Masjid Council Kerala is an initiative of Jamaat-e-Islami Hind Kerala, established in 1990. It is a non-governmental organisation and is not a state or government body. Its registered office is at Hira Centre, Mavoor Road, Kozhikode 673004.',
      'മസ്ജിദുകളെ സമഗ്രമായ മികവിന്റെ കേന്ദ്രങ്ങളാക്കി മാറ്റുക എന്ന ലക്ഷ്യത്തോടെ 1990-ൽ സ്ഥാപിതമായ സംവിധാനമാണ് മസ്ജിദ് കൗൺസിൽ കേരള.',
      'The council supervises the activities of masjids and mahallus, provides guidance, identifies and trains people capable of delivering khutba and leading prayers, empowers serving khateebs and imams, and organises training programmes for masjid and mahallu committee office-bearers.',
      'It also prepares khutba synopses and study material on a range of subjects for khateebs.',
      'Imam–Muaddin Welfare Fund (ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി): financial assistance for imams and muaddins serving in registered masjids, for house construction, repairs, medical treatment and marriage. Funded by an annual collection on one Jumu‘ah in Ramadan at affiliated masjids.',
      'Masjid Fund (മസ്ജിദ് ഫണ്ട്): assistance for financially weaker masjids towards construction, reconstruction and repairs, funded by a monthly collection at affiliated Jumu‘ah masjids on specified Fridays.',
      'Masjid Excellence Award (മസ്ജിദ് എക്സലൻസ് അവാർഡ്): awards of ₹1,00,000, ₹75,000 and ₹50,000 for affiliated masjids doing outstanding work.',
      'Long-term aim: every affiliated masjid in Kerala grows into a model of excellence, supported by the Excellent Masjid programme.',
    ],
  },
  {
    path: '/affiliation',
    title: 'Masjid Affiliation Application | Masjid Council Kerala',
    description:
      'Apply online to affiliate your masjid with Masjid Council Kerala. Affiliation gives access to the Imam–Muaddin Welfare Fund, Masjid Fund and the Masjid Excellence Award.',
    lang: 'ml',
    priority: 0.9,
    changefreq: 'monthly',
    heading: 'Masjid Affiliation — മസ്ജിദ് അഫിലിയേഷൻ',
    body: [
      'Apply for masjid affiliation with Masjid Council Kerala using this form.',
      'Affiliated masjids can apply to the Imam–Muaddin Welfare Fund and the Masjid Fund, take part in council training programmes for committee office-bearers, khateebs and imams, and are eligible for the Masjid Excellence Award.',
      'The form collects masjid and mahallu details along with supporting documents. After submission you receive a reference number that can be used to track the application status on the home page.',
    ],
  },
  {
    path: '/medical-aid',
    title: 'Imam Muaddin Welfare Fund Application | Masjid Council Kerala',
    description:
      'Apply for Imam–Muaddin Welfare Fund assistance from Masjid Council Kerala. Support for imams and muaddins of registered masjids for treatment, housing, repairs and marriage.',
    lang: 'ml',
    priority: 0.9,
    changefreq: 'monthly',
    heading: 'Imam Muaddin Welfare Fund — ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി',
    body: [
      'The Imam–Muaddin Welfare Fund provides financial assistance to imams and muaddins serving in masjids registered with Masjid Council Kerala.',
      'Assistance covers essential needs such as house construction, repairs, medical treatment and marriage expenses for those facing financial difficulty.',
      'The scheme is funded through an annual collection held on one Jumu‘ah day in Ramadan at affiliated masjids.',
      'Submit the application online and track its status later using the reference number or the registered mobile number.',
    ],
  },
  {
    path: '/mosque-fund',
    title: 'Masjid Fund Application | Masjid Council Kerala',
    description:
      'Apply for Masjid Fund assistance from Masjid Council Kerala for masjid construction, reconstruction and repair work. Open to affiliated masjids across Kerala.',
    lang: 'ml',
    priority: 0.9,
    changefreq: 'monthly',
    heading: 'Masjid Fund — മസ്ജിദ് ഫണ്ട്',
    body: [
      'The Masjid Fund is a welfare scheme of Masjid Council Kerala that helps financially weaker masjids.',
      'Assistance is given for masjid construction, reconstruction and repair work.',
      'Resources for the scheme are raised through a monthly collection at affiliated Jumu‘ah masjids on specified Fridays.',
      'Submit the application online and track its status later using the reference number or the registered mobile number.',
    ],
  },
  {
    path: '/khateeb-registration',
    title: 'Khateeb Registration | Masjid Council Kerala',
    description:
      'Register as a khateeb with Masjid Council Kerala. Registration supports training programmes, khutba synopses and study material for khateebs serving masjids in Kerala.',
    lang: 'ml',
    priority: 0.7,
    changefreq: 'monthly',
    heading: 'Khateeb Registration — ഖത്തീബ് രജിസ്ട്രേഷൻ',
    body: [
      'Register as a khateeb with Masjid Council Kerala.',
      'The council identifies and trains people capable of delivering khutba and leading prayers, and runs programmes to empower khateebs and imams already serving in masjids.',
      'Registered khateebs receive khutba synopses and study material prepared by the council on a range of subjects.',
    ],
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | Masjid Council Kerala',
    description:
      'How Masjid Council Kerala collects, uses, stores and protects the personal information submitted through its affiliation, welfare fund, masjid fund and khateeb registration forms.',
    lang: 'en',
    priority: 0.3,
    changefreq: 'yearly',
    heading: 'Privacy Policy',
    body: [
      'Masjid Council Kerala respects your privacy and is committed to protecting the personal information you share through this website and its application forms.',
      'Information we collect: when you submit an application (masjid affiliation, welfare fund, masjid fund or khateeb registration) we collect information such as your name, contact number, mosque or mahallu details, and any documents you choose to upload.',
      'How we use it: information is used solely to process your application, verify eligibility and communicate updates about its status. We do not sell or rent your personal information to third parties.',
    ],
  },
];

/** @type {Record<string, RouteMeta>} */
export const ROUTE_MAP = Object.fromEntries(ROUTES.map((r) => [r.path, r]));

/**
 * @param {string} pathname
 * @returns {RouteMeta | undefined}
 */
export function getRouteMeta(pathname) {
  // Trailing slashes are equivalent for everything except the root itself.
  const key = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return ROUTE_MAP[key];
}

/**
 * Organization + WebSite graph. WebSite carries `name`, which is what Google
 * uses for the site name shown in place of the bare domain in search results.
 */
export const SITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: 'മസ്ജിദ് കൗൺസിൽ കേരള',
      url: `${SITE_URL}/`,
      logo: {
        '@type': 'ImageObject',
        '@id': `${SITE_URL}/#logo`,
        url: LOGO_URL,
        width: 512,
        height: 512,
      },
      image: { '@id': `${SITE_URL}/#logo` },
      foundingDate: '1990',
      description:
        'Masjid Council Kerala is an initiative of Jamaat-e-Islami Hind Kerala. It supervises masjids and mahallus across the fourteen districts of Kerala, trains khateebs and imams, and operates the Imam–Muaddin Welfare Fund and Masjid Fund. It is a non-governmental organisation, not a state or government body.',
      // Anchors the entity. Google already knows and cites jihkerala.org, and the
      // two share the Hira Centre address, so this is what separates Masjid Council
      // Kerala from the unrelated masjidcouncil.org (MACCA, Dhaka, founded 1999)
      // that AI answers were previously resolving the name to.
      parentOrganization: {
        '@type': 'Organization',
        name: 'Jamaat-e-Islami Hind Kerala',
        url: 'https://jihkerala.org/',
      },
      subjectOf: {
        '@type': 'WebPage',
        url: 'https://jihkerala.org/masjid-council-kerala',
        name: 'Masjid Council Kerala — Jamaat-e-Islami Hind Kerala',
      },
      email: 'masjidcouncilkerala@gmail.com',
      telephone: '+91-95624-78805',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Hira Centre, PB No. 833, Mavoor Road',
        addressLocality: 'Kozhikode',
        addressRegion: 'Kerala',
        postalCode: '673004',
        addressCountry: 'IN',
      },
      areaServed: {
        '@type': 'State',
        name: 'Kerala',
        containedInPlace: { '@type': 'Country', name: 'India' },
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: 'മസ്ജിദ് കൗൺസിൽ കേരള',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: ['ml', 'en'],
    },
  ],
};

/* ------------------------------------------------------------- publications
 *
 * Publications live in Mongo, not in ROUTES, so their <head> is built from the record
 * rather than from a table. The builders below run twice, exactly like ROUTES does:
 * in <PublicationReader /> at runtime, and in scripts/prerender.mjs at build time —
 * so a crawler that never executes JS and a browser that does end up with the same
 * title, canonical and JSON-LD.
 */

export const PUBLICATIONS_PREFIX = '/resources';

/** @param {string} pathname */
export const isPublicationPath = (pathname) =>
  pathname === PUBLICATIONS_PREFIX || pathname.startsWith(`${PUBLICATIONS_PREFIX}/`);

// The reader's <h1> is the Malayalam title when there is one, so the <title> follows it.
export const publicationName = (publication) => publication.titleMalayalam || publication.title;

export const publicationPath = (publication) => `${PUBLICATIONS_PREFIX}/${publication.slug}`;

export const chapterPath = (publication, chapter) =>
  `${publicationPath(publication)}/${chapter.slug}`;

export const sortChapters = (chapters) => [...(chapters || [])].sort((a, b) => a.order - b.order);

/**
 * Chapter body HTML → one line of plain text, for meta descriptions only — never for
 * rendering, which is why it decodes entities without re-encoding anything.
 * @param {string} html
 * @returns {string}
 */
export function htmlToText(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Trim to a whole word near `max`, the way a description should end.
 * @param {string} text
 * @param {number} [max]
 * @returns {string}
 */
export function clampText(text, max = 158) {
  const value = String(text || '').trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Head metadata for one chapter — the canonical unit of a publication, since every
 * chapter has its own URL.
 *
 * The description prefers the chapter's own opening text: it is what makes one chapter
 * distinct from the next to a search engine, and it is the passage an AI answer quotes.
 * The book blurb is the fallback for a chapter that opens on an image or a bare heading.
 *
 * @returns {{path: string, title: string, description: string, lang: string}}
 */
export function chapterMeta(publication, chapter, bodyHtml) {
  const book = publicationName(publication);
  const lead = htmlToText(bodyHtml);
  return {
    path: chapterPath(publication, chapter),
    title: `${chapter.title} — ${book} | ${SITE_NAME}`,
    description: clampText(
      lead || publication.description || publication.subtitle || `${chapter.title} — ${book}.`,
    ),
    lang: 'ml',
  };
}

/**
 * Head metadata for a bare /resources/:slug. The reader redirects that URL to the first
 * chapter, so the page canonicalises there too rather than competing with it.
 *
 * @returns {{path: string, canonicalPath: string, title: string, description: string, lang: string}}
 */
export function bookMeta(publication, firstChapter) {
  const book = publicationName(publication);
  return {
    path: publicationPath(publication),
    canonicalPath: firstChapter
      ? chapterPath(publication, firstChapter)
      : publicationPath(publication),
    title: `${book} | ${SITE_NAME}`,
    description: clampText(
      publication.description || publication.subtitle || `${book} — a publication of ${SITE_NAME}.`,
    ),
    lang: 'ml',
  };
}

const isoDate = (value) => (value ? String(value).slice(0, 10) : undefined);

const breadcrumbFor = (publication, open, canonical, bookUrl) => ({
  '@type': 'BreadcrumbList',
  '@id': `${canonical}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
    {
      '@type': 'ListItem',
      position: 2,
      name: publicationName(publication),
      item: bookUrl,
    },
    ...(open
      ? [
          {
            '@type': 'ListItem',
            position: 3,
            name: open.title,
            item: canonical,
          },
        ]
      : []),
  ],
});

/**
 * Organization + WebSite (so the entity references still resolve on a page that never
 * renders SITE_JSON_LD) + Book + the open chapter + BreadcrumbList.
 *
 * hasPart declares every chapter by @id; the open one repeats that @id with its full
 * properties. Two nodes sharing an @id are one node in JSON-LD, which is what lets the
 * book carry its whole table of contents without describing the open chapter twice.
 *
 * @returns {object}
 */
export function publicationJsonLd({ publication, chapters, chapter }) {
  const list = sortChapters(chapters || publication.chapters);
  const organization = { '@id': `${SITE_URL}/#organization` };
  const bookUrl = `${SITE_URL}${publicationPath(publication)}`;
  const bookId = `${bookUrl}#book`;
  const open = chapter || list[0];
  const canonical = open ? `${SITE_URL}${chapterPath(publication, open)}` : bookUrl;

  const book = {
    '@type': 'Book',
    '@id': bookId,
    name: publicationName(publication),
    alternateName:
      publication.titleMalayalam && publication.title !== publication.titleMalayalam
        ? publication.title
        : undefined,
    url: bookUrl,
    description: publication.description || publication.subtitle || undefined,
    image: publication.coverImage?.url || undefined,
    inLanguage: 'ml',
    author: organization,
    publisher: organization,
    datePublished: isoDate(publication.publishedAt),
    dateModified: isoDate(publication.updatedAt),
    hasPart: list.map((c, index) => ({
      '@type': 'Chapter',
      '@id': `${SITE_URL}${chapterPath(publication, c)}#chapter`,
      name: c.title,
      url: `${SITE_URL}${chapterPath(publication, c)}`,
      position: index + 1,
    })),
  };

  const openChapter = open && {
    '@type': 'Chapter',
    '@id': `${canonical}#chapter`,
    name: open.title,
    headline: open.title,
    url: canonical,
    mainEntityOfPage: canonical,
    position: list.findIndex((c) => c.slug === open.slug) + 1,
    isPartOf: { '@id': bookId },
    inLanguage: 'ml',
    author: organization,
    publisher: organization,
    datePublished: isoDate(publication.publishedAt),
    dateModified: isoDate(publication.updatedAt),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      ...SITE_JSON_LD['@graph'],
      book,
      ...(openChapter ? [openChapter] : []),
      breadcrumbFor(publication, open, canonical, bookUrl),
    ],
  };
}
