# Publications section — design

Date: 2026-09-02
Status: approved

## Problem

The public homepage jumps from the hero banner straight to **അപേക്ഷകൾ**. Masjid Council
publishes guidance books for mahallu committees that currently have no home on the site.
Two exist today ("മഹല്ലുകൾക്ക് ഒരു മാർഗരേഖ", "മഹല്ല് സംവിധാനത്തിന് ഒരു രൂപരേഖ") and more
will follow, so the section must be data-driven and editable without a redeploy.

## Scope

A new section above `#applications-section` listing publications as cards. A card opens a
reader page with a chapter side-panel. Super admins and state admins create, edit, reorder,
publish and unpublish publications and their chapters, including rich-text bodies and
images, from the admin area.

Out of scope: PDF download, search across chapters, per-chapter comments, translations.

## Decisions

| Question | Decision |
|---|---|
| Body editing | Rich text (WYSIWYG), TipTap v3, admin bundle only |
| Storage format | Sanitized HTML, sanitized on write |
| Reader layout | Own route, sticky TOC sidebar, deep-linkable chapters |
| Card grid | `min(count, 5)` columns from `sm` up; horizontal snap-scroll on mobile |
| Access | `authenticateAdmin` — super admin + state admin |
| Section heading | Stored in DB, admin-editable |
| Images | Cover image + in-body images, DO Spaces |
| Prose styling | Hand-rolled `.mc-prose` CSS, not `@tailwindcss/typography` |

### Why hand-rolled prose CSS

Malayalam glyph ink runs ~1.27x the font size. The codebase already compensates for this
(`Home.jsx` hero line-height). The typography plugin's line-heights cause wrapped Malayalam
lines to collide, so the section defines its own type scale.

### Why sanitize on write

Sanitizing in the PUT handler means stored HTML is always safe. The public reader can then
use `dangerouslySetInnerHTML` directly and ships no sanitizer to visitors.

## Data model

```
Publication
  slug            String  unique, indexed
  title           String            // English
  titleMalayalam  String
  subtitle        String
  description     String            // card blurb
  coverImage      { url, key }
  order           Number
  enabled         Boolean
  isPublished     Boolean
  publishedAt     Date
  chapters        [ { id, slug, title, order, bodyHtml } ]
  timestamps

SiteSection                          // singleton per key
  key       String  unique           // 'publications'
  heading   String
  subtitle  String
  ctaLabel  String
  enabled   Boolean
```

Chapter `slug` gives deep links: `/resources/<book-slug>/<chapter-slug>`.

## API

Mounted at `/api/publications`. Literal paths are declared before `/:slug`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | public | published + enabled, summary only (no bodies) |
| GET | `/section` | public | section heading config |
| GET | `/:slug` | public | one publication with all chapters |
| GET | `/admin/all` | admin | everything including drafts |
| POST | `/` | admin | create |
| PUT | `/reorder` | admin | `[{ id, order }]` |
| PUT | `/section` | admin | update section heading |
| PUT | `/:id` | admin | update; sanitizes every chapter body |
| DELETE | `/:id` | admin | delete |

`admin` = existing `authenticateAdmin`, which already admits `superadmin` and `admin`.

### Sanitizer allowlist

`p br strong em u s h2 h3 h4 ul ol li a blockquote img figure figcaption hr`.
`a` gains `rel="noopener noreferrer"`. `img` `src` is restricted to the DO Spaces CDN host.
Everything else is stripped, including all event handlers and `style`.

## Frontend

| File | Role |
|---|---|
| `components/PublicationsSection.jsx` | home section above `#applications-section` |
| `pages/PublicationReader.jsx` | `/resources/:slug` and `/resources/:slug/:chapterSlug` |
| `pages/PublicationsAdmin.jsx` | list, reorder, publish, section heading |
| `pages/PublicationEditor.jsx` | one publication: cover, chapters, bodies |
| `components/RichTextEditor.jsx` | TipTap wrapper, lazy-loaded |

The home section renders `null` when the section is disabled or no publication is
published, so the homepage never shows an empty heading.

Reader: sticky TOC rail on desktop, collapsible dropdown on mobile, prev/next at the foot.
Bare `/resources/:slug` redirects to the first chapter.

Grid: `flex overflow-x-auto snap-x` with `w-[78vw]` cards on mobile; from `sm` up a grid
whose `gridTemplateColumns` is computed as `min(count, 5)`. A sixth publication wraps
rather than squashing the row.

Admin editor is `React.lazy`-loaded so TipTap never enters the public bundle. A new
`Publications` entry is added to both `SuperAdminSidebar` and `AdminSidebar`.

## Content seeding

Source: `MasjidCouncil-backend/Mahallu Margharegha.txt` (14 chapters) and
`Mahallu-Rekha.txt` (1 title + 16 sections + 5 അനുബന്ധം = 21 chapters).

Both files are clean UTF-8: no mojibake, no displaced viramas. The PDF is not used.

Pipeline (`scripts/lib/bookParse.js` + `scripts/seedPublications.js`):

1. Normalise legacy chillu sequences to atomic forms
   (`ള്‍`→`ൾ`, `ന്‍`→`ൻ`, `ര്‍`→`ർ`, `ല്‍`→`ൽ`, `ണ്‍`→`ൺ`).
2. Split chapters on `*bold*` markers, cross-checked against the table of contents.
   വൈവാഹിക ജീവിതം carries no marker and is anchored by TOC position.
3. Rejoin hard-wrapped lines.
4. Convert numbered and lettered lists to `<ol>` / `<ul>`, paragraphs to `<p>`.

### The line-join problem

Book A is hard-wrapped at DTP width with no hyphens, so a line ending mid-word is
indistinguishable from a line ending between two words:

- `…സാമൂഹ്യഘടന` / `യുടെ…` must join into `സാമൂഹ്യഘടനയുടെ`
- `…ഭാരിച്ച ചുമതല` / `നിർവ്വഹിക്ക…` must stay two words

717 of 1188 breaks are settled mechanically by trailing punctuation or a following list
marker. The remaining **471 require reading Malayalam** and are resolved into a reviewed
`scripts/data/joins-margharegha.json` mapping break index to `J` (join) or `S` (space).
Keeping the decisions in a data file rather than inline edits makes them auditable and
lets the parse be re-run.

Residual risk: on 70 pages of religious text a small number of join errors may survive.
The seeded output is to be proofread before the section is made public.

## Error handling

- Reader 404 renders a not-found state with a link home, not a crash.
- Home section swallows fetch failures and renders nothing; it is decorative and must
  never break the homepage.
- Editor save failures surface inline and preserve unsaved state.

## Testing

- `lib/sanitizeRichText.test.js` — XSS payloads stripped, allowed tags survive,
  non-CDN image sources rejected.
- `scripts/lib/bookParse.test.js` — chapter count, chillu normalisation, list
  conversion, join application, all against fixtures.
- A chapter-count assertion in the seed script so a bad parse fails loudly instead of
  silently seeding a truncated book.

## Follow-ups

- The `/resources` path is fixed at build time while the heading is DB-editable. If the
  final section name should also be the URL, the slug must change before links are shared.
- The existing upload endpoint is public and IP-rate-limited (20 per 10 min), which is
  wrong for an admin pasting images into a chapter. An authenticated variant that skips
  the rate limit is added alongside it.
