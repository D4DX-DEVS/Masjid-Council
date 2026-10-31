const test = require("node:test");
const assert = require("node:assert");
const { normalizeHomepageConfig } = require("./homepageConfig");

const section = (id, extra = {}) => ({ id, visible: true, layout: {}, content: {}, ...extra });

test("null and non-objects mean no customisation", () => {
  assert.strictEqual(normalizeHomepageConfig(null), null);
  assert.strictEqual(normalizeHomepageConfig(undefined), null);
  assert.strictEqual(normalizeHomepageConfig("x"), null);
  assert.strictEqual(normalizeHomepageConfig([]), null);
});

test("drops unknown sections and duplicates, keeps order", () => {
  const out = normalizeHomepageConfig({
    sections: [section("about"), section("evil"), section("hero"), section("about")],
  });
  assert.deepStrictEqual(out.sections.map((s) => s.id), ["about", "hero"]);
});

test("moves the footer to the end", () => {
  const out = normalizeHomepageConfig({ sections: [section("footer"), section("hero")] });
  assert.deepStrictEqual(out.sections.map((s) => s.id), ["hero", "footer"]);
});

test("visible defaults to true unless explicitly false", () => {
  const out = normalizeHomepageConfig({
    sections: [{ id: "hero" }, { id: "about", visible: false }],
  });
  assert.strictEqual(out.sections[0].visible, true);
  assert.strictEqual(out.sections[1].visible, false);
});

test("theme keeps valid colours and allowlisted fonts only", () => {
  const out = normalizeHomepageConfig({
    theme: {
      primary: "#ABCDEF",
      heading: "red",
      accent: "",
      fontHeading: "Anek Malayalam",
      fontBody: "Comic Sans",
      hacked: "yes",
    },
    sections: [],
  });
  assert.deepStrictEqual(out.theme, { primary: "#abcdef", accent: "", fontHeading: "Anek Malayalam" });
});

test("drops fields that are not in the section spec", () => {
  const out = normalizeHomepageConfig({
    sections: [section("hero", { content: { titleMl: "x", script: "<b>" }, layout: { width: "full" } })],
  });
  assert.deepStrictEqual(out.sections[0].content, { titleMl: "x" });
  // hero has no width option
  assert.deepStrictEqual(out.sections[0].layout, {});
});

test("caps text length and strips control characters", () => {
  const out = normalizeHomepageConfig({
    sections: [section("hero", { content: { reference: `a\u0000b${"z".repeat(500)}` } })],
  });
  assert.strictEqual(out.sections[0].content.reference.length, 120);
  assert.ok(out.sections[0].content.reference.startsWith("abz"));
});

test("images accept https, builtin tokens and empty, nothing else", () => {
  const img = (value) =>
    normalizeHomepageConfig({ sections: [section("hero", { content: { bgImage: value } })] })
      .sections[0].content.bgImage;
  assert.strictEqual(img("https://cdn.example.com/a.webp"), "https://cdn.example.com/a.webp");
  assert.strictEqual(img("builtin:hero"), "builtin:hero");
  assert.strictEqual(img(""), "");
  assert.strictEqual(img("javascript:alert(1)"), undefined);
  assert.strictEqual(img('https://x.com/a.png") ; background:url("evil'), undefined);
  assert.strictEqual(img("data:image/png;base64,AAAA"), undefined);
});

test("links accept http(s), site paths and anchors, never javascript:", () => {
  const lnk = (value) =>
    normalizeHomepageConfig({ sections: [section("about", { content: { buttonLink: value } })] })
      .sections[0].content.buttonLink;
  assert.strictEqual(lnk("/about"), "/about");
  assert.strictEqual(lnk("https://zaad.info"), "https://zaad.info");
  assert.strictEqual(lnk("#contact-section"), "#contact-section");
  assert.strictEqual(lnk("javascript:alert(1)"), undefined);
  assert.strictEqual(lnk("//evil.com"), undefined);
});

test("map embed must be a Google Maps embed URL", () => {
  const map = (value) =>
    normalizeHomepageConfig({ sections: [section("footer", { content: { mapEmbedUrl: value } })] })
      .sections[0].content.mapEmbedUrl;
  assert.ok(map("https://www.google.com/maps/embed?pb=!1m17"));
  assert.strictEqual(map("https://evil.com/maps/embed?pb=1"), undefined);
});

test("lists are capped and their items validated", () => {
  const items = Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: "x", icon: "Nope" }));
  const out = normalizeHomepageConfig({ sections: [section("stats", { content: { items } })] });
  const stored = out.sections[0].content.items;
  assert.strictEqual(stored.length, 8);
  assert.deepStrictEqual(stored[0], { value: "0", label: "x" });
});

test("added sections need an id that names a known type", () => {
  const out = normalizeHomepageConfig({
    sections: [
      { id: "text-ab12cd", type: "text", content: { heading: "Hi" } },
      { id: "text-zz99zz", type: "faq" },
      { id: "evil-ab12cd", type: "evil" },
      { id: "gallery-1", type: "gallery" },
    ],
  });
  assert.deepStrictEqual(out.sections.map((s) => s.id), ["text-ab12cd"]);
  assert.strictEqual(out.sections[0].type, "text");
  assert.deepStrictEqual(out.sections[0].content, { heading: "Hi" });
});

test("built-in sections never carry a type", () => {
  const out = normalizeHomepageConfig({ sections: [{ id: "hero", type: "text" }] });
  assert.strictEqual(out.sections[0].type, undefined);
});

test("caps the number of added sections", () => {
  const sections = Array.from({ length: 25 }, (_, i) => ({ id: `text-a${String(i).padStart(4, "0")}`, type: "text" }));
  assert.strictEqual(normalizeHomepageConfig({ sections }).sections.length, 20);
});

test("video accepts YouTube links only", () => {
  const vid = (value) =>
    normalizeHomepageConfig({ sections: [{ id: "video-abcd", type: "video", content: { videoUrl: value } }] })
      .sections[0].content.videoUrl;
  assert.ok(vid("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
  assert.ok(vid("https://youtu.be/dQw4w9WgXcQ?t=10"));
  assert.ok(vid("https://www.youtube.com/shorts/dQw4w9WgXcQ"));
  assert.strictEqual(vid("https://evil.com/watch?v=dQw4w9WgXcQ"), undefined);
  assert.strictEqual(vid("javascript:alert(1)"), undefined);
});
