import { authHeaders } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE = `${API_BASE_URL}/api/publications`;

const json = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
};

/* ------------------------------------------------------------- public reads
 *
 * Publications change a few times a year and a book is the largest payload the public site
 * fetches, so the three public GETs are cached for the tab's lifetime rather than refetched
 * on every visit: leaving a book and opening it again, or bouncing between the home page and
 * the reader, then costs nothing.
 *
 * In flight requests are shared as well, which is what stops React StrictMode's double mount
 * (and the home page asking for the list and the section at once) from firing two requests
 * for the same URL.
 *
 * Server data can still change under a long-lived tab, so entries expire; admin writes call
 * invalidatePublicationCache() so an editor sees their own save immediately. Admin GETs are
 * never cached — the editor must always load the true record, drafts included.
 */

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();
const inflight = new Map();

const cachedGet = (key, load) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.storedAt < CACHE_TTL_MS) return Promise.resolve(hit.value);

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = load()
    .then((value) => {
      cache.set(key, { storedAt: Date.now(), value });
      return value;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, request);
  return request;
};

export const invalidatePublicationCache = () => {
  cache.clear();
  inflight.clear();
};

export const fetchPublications = () =>
  cachedGet('list', async () => (await json(await fetch(BASE))).data);

export const fetchPublicationSection = () =>
  cachedGet('section', async () => (await json(await fetch(`${BASE}/section`))).data);

// The book without its chapter bodies: enough to render the header, the chapter list and
// the prev/next links.
export const fetchPublication = (slug) =>
  cachedGet(
    `publication:${slug}`,
    async () => (await json(await fetch(`${BASE}/${encodeURIComponent(slug)}`))).data
  );

// One chapter's body, fetched when the reader opens it and kept for the rest of the visit.
export const fetchPublicationChapter = (slug, chapterSlug) =>
  cachedGet(
    `chapter:${slug}:${chapterSlug}`,
    async () =>
      (
        await json(
          await fetch(
            `${BASE}/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(chapterSlug)}`
          )
        )
      ).data
  );

/* ------------------------------------------------------------------- admin */

const adminJsonHeaders = () => ({ ...authHeaders(), 'Content-Type': 'application/json' });

export const fetchPublicationsAdmin = async () =>
  (await json(await fetch(`${BASE}/admin/all`, { headers: authHeaders() }))).data;

export const fetchPublicationAdmin = async (id) =>
  (await json(await fetch(`${BASE}/admin/${id}`, { headers: authHeaders() }))).data;

// Every write drops the cached public copies, so an admin who saves and then looks at the
// home page sees the change rather than the copy their own earlier visit cached.
const afterWrite = (result) => {
  invalidatePublicationCache();
  return result;
};

export const createPublication = async (body) =>
  afterWrite(
    (
      await json(
        await fetch(BASE, {
          method: 'POST',
          headers: adminJsonHeaders(),
          body: JSON.stringify(body),
        })
      )
    ).data
  );

export const updatePublication = async (id, body) =>
  afterWrite(
    (
      await json(
        await fetch(`${BASE}/${id}`, {
          method: 'PUT',
          headers: adminJsonHeaders(),
          body: JSON.stringify(body),
        })
      )
    ).data
  );

export const deletePublication = async (id) =>
  afterWrite(await json(await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() })));

export const reorderPublications = async (items) =>
  afterWrite(
    await json(
      await fetch(`${BASE}/reorder`, {
        method: 'PUT',
        headers: adminJsonHeaders(),
        body: JSON.stringify({ items }),
      })
    )
  );

export const updatePublicationSection = async (body) =>
  afterWrite(
    (
      await json(
        await fetch(`${BASE}/section`, {
          method: 'PUT',
          headers: adminJsonHeaders(),
          body: JSON.stringify(body),
        })
      )
    ).data
  );

/**
 * Uploads one file to DO Spaces and returns { url, key }.
 *
 * Uses the authenticated endpoint rather than the public one the application forms use:
 * that route caps an IP at 20 uploads per 10 minutes, which an admin laying out a chapter
 * would hit while pasting images.
 */
export const uploadPublicationImage = async (file, fieldName = 'coverImage') => {
  const body = new FormData();
  body.append(fieldName, file);

  const response = await fetch(`${API_BASE_URL}/api/submissions/upload-admin-files`, {
    method: 'POST',
    headers: authHeaders(),
    body,
  });
  const data = await json(response);
  const uploaded = data.data?.[fieldName];
  if (!uploaded?.cdnUrl) throw new Error('Upload succeeded but returned no URL');
  return { url: uploaded.cdnUrl, key: uploaded.key };
};
