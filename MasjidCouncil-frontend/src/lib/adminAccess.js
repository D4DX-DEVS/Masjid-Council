import { authHeaders } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE = `${API_BASE_URL}/api/admin-access`;

/**
 * Which admin-console features the super admin has left switched on for state admins.
 *
 * `granted` is the switch itself — what state admins get. `effective` is what the caller
 * gets, which for the super admin is always everything, because the switch never applies to
 * them. The sidebar reads `effective`; the toggle on each feature page reads `granted`.
 */

export const FEATURE_LABELS = {
  formBuilder: 'Form Builder',
  publications: 'Publications',
};

const json = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
};

export const fetchAdminAccess = async () => {
  const data = await json(await fetch(BASE, { headers: authHeaders() }));
  return { granted: data.data, effective: data.effective };
};

export const updateAdminAccess = async (changes) => {
  const data = await json(
    await fetch(BASE, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
  );
  return data.data;
};

/**
 * True when the signed-in console is the super admin. Both consoles store their token under
 * different keys, which is the same test PageHeader and the sidebars already use.
 */
export const isSuperAdmin = () => !!localStorage.getItem('superAdminToken');
