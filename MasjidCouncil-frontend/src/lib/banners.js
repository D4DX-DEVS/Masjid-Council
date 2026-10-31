import { authHeaders } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE = `${API_BASE_URL}/api/banners`;

const json = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
};

const adminJsonHeaders = () => ({ ...authHeaders(), 'Content-Type': 'application/json' });

// Public list for the home page carousel: enabled banners only, in display order.
export const fetchBanners = async () => (await json(await fetch(BASE))).data;

export const fetchBannersAdmin = async () =>
  (await json(await fetch(`${BASE}/admin/all`, { headers: authHeaders() }))).data;

export const createBanner = async (body) =>
  (
    await json(
      await fetch(BASE, { method: 'POST', headers: adminJsonHeaders(), body: JSON.stringify(body) })
    )
  ).data;

export const updateBanner = async (id, body) =>
  (
    await json(
      await fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: adminJsonHeaders(),
        body: JSON.stringify(body),
      })
    )
  ).data;

export const deleteBanner = async (id) =>
  json(await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() }));

export const reorderBanners = async (items) =>
  json(
    await fetch(`${BASE}/reorder`, {
      method: 'PUT',
      headers: adminJsonHeaders(),
      body: JSON.stringify({ items }),
    })
  );

/** Uploads one banner image to DO Spaces and returns { url, key }. */
export const uploadBannerImage = async (file, fieldName = 'bannerImage') => {
  const body = new FormData();
  body.append(fieldName, file);

  const response = await fetch(`${API_BASE_URL}/api/submissions/upload-banner-file`, {
    method: 'POST',
    headers: authHeaders(),
    body,
  });
  const data = await json(response);
  const uploaded = data.data?.[fieldName];
  if (!uploaded?.cdnUrl) throw new Error('Upload succeeded but returned no URL');
  return { url: uploaded.cdnUrl, key: uploaded.key };
};
