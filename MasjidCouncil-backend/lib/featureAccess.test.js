const test = require("node:test");
const assert = require("node:assert");
const Module = require("node:module");

// The module reads and writes one Setting document. Rather than stand up Mongo for a pure
// logic test, stub the model before requiring the module under test.
let stored = null;
let lastUpdate = null;

const settingStub = {
  findOne: async () => stored,
  findOneAndUpdate: async (_filter, update) => {
    lastUpdate = update;
    stored = { key: "admin-feature-access", value: update.$set.value };
    return stored;
  },
};

const settingPath = require.resolve("../models/setting");
require.cache[settingPath] = { id: settingPath, filename: settingPath, loaded: true, exports: settingStub };

const {
  FEATURE_KEYS,
  getFeatureAccess,
  setFeatureAccess,
  requireFeature,
} = require("./featureAccess");

const reset = () => {
  stored = null;
  lastUpdate = null;
};

const runGuard = async (feature, user) => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  let nextCalled = false;
  let nextError = null;
  await requireFeature(feature)({ user }, res, (err) => {
    nextCalled = true;
    nextError = err || null;
  });
  return { res, nextCalled, nextError };
};

/* --------------------------------------------------------------- reading */

test("every known feature is open before anything is stored", async () => {
  reset();
  const access = await getFeatureAccess();
  assert.deepStrictEqual(Object.keys(access).sort(), [...FEATURE_KEYS].sort());
  for (const key of FEATURE_KEYS) assert.strictEqual(access[key], true);
});

test("a stored false is honoured", async () => {
  reset();
  stored = { value: { formBuilder: false } };
  const access = await getFeatureAccess();
  assert.strictEqual(access.formBuilder, false);
  // Keys absent from the document still come back at their default.
  assert.strictEqual(access.publications, true);
});

test("non-boolean stored values fall back to the default", async () => {
  reset();
  stored = { value: { formBuilder: "no", publications: 0 } };
  const access = await getFeatureAccess();
  assert.strictEqual(access.formBuilder, true);
  assert.strictEqual(access.publications, true);
});

/* --------------------------------------------------------------- writing */

test("writing persists only known keys", async () => {
  reset();
  const saved = await setFeatureAccess({ formBuilder: false, publications: true, hacked: true });
  assert.strictEqual(saved.formBuilder, false);
  assert.strictEqual(saved.publications, true);
  assert.ok(!("hacked" in saved));
  assert.ok(!("hacked" in lastUpdate.$set.value));
});

test("writing one flag leaves the other alone", async () => {
  reset();
  await setFeatureAccess({ formBuilder: false, publications: false });
  const saved = await setFeatureAccess({ publications: true });
  assert.strictEqual(saved.formBuilder, false);
  assert.strictEqual(saved.publications, true);
});

test("a non-boolean is ignored rather than coerced", async () => {
  reset();
  await setFeatureAccess({ formBuilder: false });
  const saved = await setFeatureAccess({ formBuilder: "yes" });
  assert.strictEqual(saved.formBuilder, false);
});

/* ----------------------------------------------------------------- guard */

test("the super admin is never blocked, even when the flag is off", async () => {
  reset();
  stored = { value: { formBuilder: false } };
  const { nextCalled, res } = await runGuard("formBuilder", { role: "superadmin" });
  assert.ok(nextCalled);
  assert.strictEqual(res.statusCode, null);
});

test("a state admin passes while the feature is on", async () => {
  reset();
  const { nextCalled } = await runGuard("formBuilder", { role: "admin" });
  assert.ok(nextCalled);
});

test("a state admin is refused with 403 once it is off", async () => {
  reset();
  stored = { value: { formBuilder: false } };
  const { nextCalled, res } = await runGuard("formBuilder", { role: "admin" });
  assert.ok(!nextCalled);
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.body.code, "FEATURE_DISABLED");
});

test("turning one feature off leaves the other reachable", async () => {
  reset();
  stored = { value: { formBuilder: false } };
  const blocked = await runGuard("formBuilder", { role: "admin" });
  const allowed = await runGuard("publications", { role: "admin" });
  assert.ok(!blocked.nextCalled);
  assert.ok(allowed.nextCalled);
});

test("an unknown feature name fails loudly instead of allowing the request", async () => {
  reset();
  const { nextCalled, nextError, res } = await runGuard("nonsense", { role: "admin" });
  assert.ok(nextCalled);
  assert.ok(nextError instanceof Error);
  assert.strictEqual(res.statusCode, null);
});
