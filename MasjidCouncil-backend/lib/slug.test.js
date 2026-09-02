const test = require("node:test");
const assert = require("node:assert");
const { slugify, uniqueSlug } = require("./slug");

test("slugifies ascii titles", () => {
  assert.strictEqual(slugify("Pre Marital Course"), "pre-marital-course");
  assert.strictEqual(slugify("  Post Marital & Effective Parenting  "), "post-marital-effective-parenting");
});

test("returns empty for titles with no ascii, so callers can fall back", () => {
  assert.strictEqual(slugify("മഹല്ലുകൾ"), "");
  assert.strictEqual(slugify(""), "");
  assert.strictEqual(slugify(null), "");
});

test("uniqueSlug uses the fallback when the title yields nothing", () => {
  assert.strictEqual(uniqueSlug("മഹല്ലുകൾ", new Set(), "chapter-3"), "chapter-3");
});

test("uniqueSlug appends a counter rather than colliding", () => {
  const taken = new Set(["intro", "intro-2"]);
  assert.strictEqual(uniqueSlug("Intro", taken), "intro-3");
  assert.strictEqual(uniqueSlug("Fresh", taken), "fresh");
});
