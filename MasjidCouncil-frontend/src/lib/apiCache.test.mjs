// Run: node --test src/lib/apiCache.test.mjs
// ponytail: node:test only, no framework. Covers the cache rules that are easy to
// regress silently — stale reads after a mutation, and caching a failed response.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cachedJson, peekJson, invalidate } from './apiCache.js';

const URL = 'https://example.test/api/list';

const stubFetch = (bodies) => {
  let i = 0;
  globalThis.fetch = async () => {
    const { ok = true, body } = bodies[Math.min(i++, bodies.length - 1)];
    return { ok, json: async () => body };
  };
  return () => i;
};

test('second read is served from cache', async () => {
  invalidate();
  const calls = stubFetch([{ body: { success: true, data: [1] } }]);
  assert.deepEqual(await cachedJson(URL), { success: true, data: [1] });
  assert.deepEqual(await cachedJson(URL), { success: true, data: [1] });
  assert.equal(calls(), 1);
});

test('invalidate forces a refetch — a status change must be visible on the list', async () => {
  invalidate();
  const calls = stubFetch([
    { body: { success: true, data: ['pending'] } },
    { body: { success: true, data: ['approved'] } }
  ]);
  await cachedJson(URL);
  invalidate();
  assert.deepEqual(await cachedJson(URL), { success: true, data: ['approved'] });
  assert.equal(calls(), 2);
});

test('failures are not cached', async () => {
  invalidate();
  stubFetch([
    { ok: false, body: { success: false, message: 'boom' } },
    { body: { success: true, data: [1] } }
  ]);
  assert.equal((await cachedJson(URL)).success, false);
  assert.equal(peekJson(URL), undefined);
  assert.equal((await cachedJson(URL)).success, true);
});
