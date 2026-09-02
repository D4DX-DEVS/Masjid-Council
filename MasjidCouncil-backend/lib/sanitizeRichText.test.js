const test = require("node:test");
const assert = require("node:assert");

// The sanitizer reads the CDN host at require time via utils/documentUrl, so this has to be
// set before the module graph loads.
process.env.DO_SPACES_CDN_ENDPOINT = "cdn.example.com";

const { sanitizeRichText } = require("./sanitizeRichText");

test("keeps the tags the editor can produce", () => {
  const html =
    "<p>plain</p><p><strong>bold</strong> <em>italic</em> <u>under</u> <s>strike</s></p>" +
    "<h2>h2</h2><h3>h3</h3><h4>h4</h4>" +
    "<ul><li>a</li></ul><ol><li>b</li></ol>" +
    "<blockquote>quote</blockquote><hr /><br />";
  const out = sanitizeRichText(html);
  for (const tag of ["p", "strong", "em", "u", "s", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "hr", "br"]) {
    assert.ok(out.includes(`<${tag}`), `expected <${tag}> to survive, got: ${out}`);
  }
});

test("preserves Malayalam text unchanged", () => {
  const text = "ഇസ്‌ലാമിക ശരീഅത്തിലധിഷ്ടിതമായ സാമൂഹ്യഘടനയുടെ";
  assert.strictEqual(sanitizeRichText(`<p>${text}</p>`), `<p>${text}</p>`);
});

test("strips script tags and their contents", () => {
  const out = sanitizeRichText('<p>ok</p><script>alert("xss")</script>');
  assert.ok(!out.includes("script"));
  assert.ok(!out.includes("alert"));
  assert.strictEqual(out, "<p>ok</p>");
});

test("strips event handler attributes", () => {
  const out = sanitizeRichText('<p onclick="steal()" onmouseover="x()">text</p>');
  assert.ok(!out.includes("onclick"));
  assert.ok(!out.includes("onmouseover"));
  assert.ok(out.includes("text"));
});

test("strips style attributes and style blocks", () => {
  const out = sanitizeRichText('<style>p{display:none}</style><p style="position:fixed">t</p>');
  assert.ok(!out.includes("style"));
  assert.ok(out.includes("t"));
});

test("strips iframes, objects, forms and inputs", () => {
  const out = sanitizeRichText(
    '<iframe src="https://evil.test"></iframe><object data="x"></object><form><input name="pw" /></form><p>keep</p>'
  );
  for (const tag of ["iframe", "object", "form", "input"]) {
    assert.ok(!out.includes(`<${tag}`), `expected <${tag}> to be stripped, got: ${out}`);
  }
  assert.ok(out.includes("keep"));
});

test("drops javascript: and data: links but keeps http(s) and mailto", () => {
  assert.ok(!sanitizeRichText('<a href="javascript:alert(1)">x</a>').includes("javascript:"));
  assert.ok(!sanitizeRichText('<a href="data:text/html;base64,PHN2Zz4=">x</a>').includes("data:"));
  assert.ok(sanitizeRichText('<a href="https://ok.test/p">x</a>').includes('href="https://ok.test/p"'));
  assert.ok(sanitizeRichText('<a href="mailto:a@b.test">x</a>').includes("mailto:a@b.test"));
});

test("forces rel and target on links so they cannot reverse-tabnab", () => {
  const out = sanitizeRichText('<a href="https://ok.test">x</a>');
  assert.ok(out.includes('rel="noopener noreferrer"'));
  assert.ok(out.includes('target="_blank"'));
});

test("overwrites an attacker-supplied rel rather than trusting it", () => {
  const out = sanitizeRichText('<a href="https://ok.test" rel="opener">x</a>');
  assert.ok(out.includes('rel="noopener noreferrer"'));
  assert.ok(!/rel="opener"/.test(out));
});

test("keeps images served from the configured CDN", () => {
  const out = sanitizeRichText('<img src="https://cdn.example.com/uploads/a.png" alt="a" />');
  assert.ok(out.includes("https://cdn.example.com/uploads/a.png"));
  assert.ok(out.includes('alt="a"'));
});

test("removes images from any other origin", () => {
  for (const src of [
    "https://evil.test/track.gif",
    "http://cdn.example.com.evil.test/a.png",
    "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    "javascript:alert(1)",
  ]) {
    const out = sanitizeRichText(`<p>before</p><img src="${src}" /><p>after</p>`);
    assert.ok(!out.includes("<img"), `expected ${src} to be dropped, got: ${out}`);
    assert.ok(out.includes("before") && out.includes("after"));
  }
});

test("handles non-string and empty input without throwing", () => {
  for (const input of [undefined, null, 0, {}, [], ""]) {
    assert.strictEqual(sanitizeRichText(input), "");
  }
});

test("is idempotent — sanitizing twice changes nothing further", () => {
  const dirty = '<p onclick="x()">ok <a href="https://ok.test">l</a></p><script>bad()</script>';
  const once = sanitizeRichText(dirty);
  assert.strictEqual(sanitizeRichText(once), once);
});
