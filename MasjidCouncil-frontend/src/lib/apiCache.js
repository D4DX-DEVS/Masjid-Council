// In-memory GET cache so navigating back to a page doesn't refetch and flash a spinner.
// ponytail: module-level Map, cleared on full page reload — swap for react-query if
// we ever need background revalidation, request dedupe across tabs, or invalidation.
const store = new Map();

const TTL_MS = 2 * 60 * 1000;

// Parsed body if it's cached and fresh, otherwise undefined. Safe to call during render.
export const peekJson = (url) => {
  const hit = store.get(url);
  if (!hit || Date.now() - hit.at > TTL_MS) return undefined;
  return hit.data;
};

export const cachedJson = async (url, options) => {
  const fresh = peekJson(url);
  if (fresh !== undefined) return fresh;

  const response = await fetch(url, options);
  const data = await response.json();
  // Never cache a failure — otherwise one blip pins the error on the page for the whole TTL.
  if (response.ok && data?.success !== false) store.set(url, { at: Date.now(), data });
  return data;
};

// Call after a mutation so the next read refetches.
export const invalidate = (url) => {
  if (url) store.delete(url);
  else store.clear();
};
