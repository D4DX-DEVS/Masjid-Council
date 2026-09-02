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

/* ------------------------------------------------------------------ public */

export const fetchPublications = async () => (await json(await fetch(BASE))).data;

export const fetchPublicationSection = async () =>
  (await json(await fetch(`${BASE}/section`))).data;

export const fetchPublication = async (slug) =>
  (await json(await fetch(`${BASE}/${encodeURIComponent(slug)}`))).data;

/* ------------------------------------------------------------------- admin */

const adminJsonHeaders = () => ({ ...authHeaders(), 'Content-Type': 'application/json' });

export const fetchPublicationsAdmin = async () =>
  (await json(await fetch(`${BASE}/admin/all`, { headers: authHeaders() }))).data;

export const fetchPublicationAdmin = async (id) =>
  (await json(await fetch(`${BASE}/admin/${id}`, { headers: authHeaders() }))).data;

export const createPublication = async (body) =>
  (
    await json(
      await fetch(BASE, { method: 'POST', headers: adminJsonHeaders(), body: JSON.stringify(body) })
    )
  ).data;

export const updatePublication = async (id, body) =>
  (
    await json(
      await fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: adminJsonHeaders(),
        body: JSON.stringify(body),
      })
    )
  ).data;

export const deletePublication = async (id) =>
  json(await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() }));

export const reorderPublications = async (items) =>
  json(
    await fetch(`${BASE}/reorder`, {
      method: 'PUT',
      headers: adminJsonHeaders(),
      body: JSON.stringify({ items }),
    })
  );

export const updatePublicationSection = async (body) =>
  (
    await json(
      await fetch(`${BASE}/section`, {
        method: 'PUT',
        headers: adminJsonHeaders(),
        body: JSON.stringify(body),
      })
    )
  ).data;

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
