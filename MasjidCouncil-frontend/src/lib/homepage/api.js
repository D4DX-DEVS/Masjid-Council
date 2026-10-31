import { useEffect, useState } from 'react';
import { authHeaders } from '../auth';
import { mergeHomepage } from './defaults';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE = `${API_BASE_URL}/api/homepage`;

const json = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
};

/* ------------------------------------------------------------------ public */

// The last published config is kept in this browser so a returning visitor paints the
// customised page straight away instead of the defaults first. It is revalidated on every
// visit; storage being unavailable (private mode, blocked) just means no head start.
const STORAGE_KEY = 'mc-homepage-config';

const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

const writeStored = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Quota or privacy mode — the page still works, it just fetches every time.
  }
};

export const fetchHomepagePublished = async () => (await json(await fetch(BASE))).data;

/**
 * The published home page, merged over the defaults. Null only on a first visit while the
 * request is in flight; a failed request falls back to the defaults rather than a blank page.
 */
export const useHomepageConfig = () => {
  const [config, setConfig] = useState(() => {
    const stored = readStored();
    return stored === undefined ? null : mergeHomepage(stored);
  });

  useEffect(() => {
    let active = true;
    fetchHomepagePublished()
      .then((published) => {
        writeStored(published);
        if (active) setConfig(mergeHomepage(published));
      })
      .catch(() => active && setConfig((current) => current || mergeHomepage(null)));
    return () => {
      active = false;
    };
  }, []);

  return config;
};

/* ------------------------------------------------------------------- admin */

const adminJsonHeaders = () => ({ ...authHeaders(), 'Content-Type': 'application/json' });

/** @returns {Promise<{ draft: object|null, published: object|null, publishedAt: string|null, draftUpdatedAt: string|null, hasUnpublished: boolean }>} */
export const fetchHomepageAdmin = async () =>
  (await json(await fetch(`${BASE}/admin`, { headers: authHeaders() }))).data;

export const saveHomepageDraft = async (config) =>
  (
    await json(
      await fetch(`${BASE}/admin/draft`, {
        method: 'PUT',
        headers: adminJsonHeaders(),
        body: JSON.stringify({ config }),
      })
    )
  ).data;

export const publishHomepage = async () =>
  (await json(await fetch(`${BASE}/admin/publish`, { method: 'POST', headers: authHeaders() }))).data;

export const discardHomepageDraft = async () =>
  (await json(await fetch(`${BASE}/admin/discard`, { method: 'POST', headers: authHeaders() }))).data;

/** Uploads one image to DO Spaces and returns { url, key }. */
export const uploadHomepageImage = async (file, fieldName = 'homepageImage') => {
  const body = new FormData();
  body.append(fieldName, file);
  const response = await fetch(`${API_BASE_URL}/api/submissions/upload-homepage-file`, {
    method: 'POST',
    headers: authHeaders(),
    body,
  });
  const data = await json(response);
  const uploaded = data.data?.[fieldName];
  if (!uploaded?.cdnUrl) throw new Error('Upload succeeded but returned no URL');
  return { url: uploaded.cdnUrl, key: uploaded.key };
};
