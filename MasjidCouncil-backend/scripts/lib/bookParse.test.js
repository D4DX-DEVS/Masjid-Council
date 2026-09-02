const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { normaliseText, parseBook, listMarker, endsParagraph } = require("./bookParse");
const { BOOKS } = require("../data/books");

const BACKEND_ROOT = path.join(__dirname, "..", "..");

/* ------------------------------------------------------------- normalisation */

test("folds legacy chillu spellings into their atomic form", () => {
  assert.strictEqual(normaliseText("മഹല്ലുകള്‍"), "മഹല്ലുകൾ");
  assert.strictEqual(normaliseText("പ്രവര്‍ത്തനങ്ങള്‍"), "പ്രവർത്തനങ്ങൾ");
  assert.strictEqual(normaliseText("ഖുര്‍ആന്‍"), "ഖുർആൻ");
  assert.strictEqual(normaliseText("കൗണ്‍സലിംഗ്"), "കൗൺസലിംഗ്");
});

test("repairs Malayalam digits typed in place of chillu letters", () => {
  assert.strictEqual(normaliseText("ഭ൪ത്താവ്"), "ഭർത്താവ്");
  assert.strictEqual(normaliseText("സൗഹൃദമാകാ൯"), "സൗഹൃദമാകാൻ");
});

test("repairs doubled viramas, which are never valid", () => {
  assert.strictEqual(normaliseText("ഇസ്്ലാമിക"), "ഇസ്‌ലാമിക");
});

test("leaves already-correct text alone", () => {
  const clean = "ഇസ്‌ലാമിക ശരീഅത്തിലധിഷ്ടിതമായ സാമൂഹ്യഘടനയുടെ";
  assert.strictEqual(normaliseText(clean), clean);
});

/* -------------------------------------------------------------- line helpers */

test("recognises the list markers the books use", () => {
  assert.deepStrictEqual(listMarker("1. ഒന്ന്"), { type: "decimal", text: "ഒന്ന്" });
  assert.deepStrictEqual(listMarker("I. ഒന്ന്"), { type: "upper-roman", text: "ഒന്ന്" });
  assert.deepStrictEqual(listMarker("a. ഒന്ന്"), { type: "lower-alpha", text: "ഒന്ന്" });
  assert.deepStrictEqual(listMarker("- ഒന്ന്"), { type: "bullet", text: "ഒന്ന്" });
  assert.strictEqual(listMarker("ഒന്ന് രണ്ട്"), null);
});

test("only a sentence-final line closes a paragraph", () => {
  assert.ok(endsParagraph("ചെറിയ കാര്യമല്ല."));
  assert.ok(!endsParagraph("സാമൂഹ്യഘടന"));
  assert.ok(!endsParagraph("മൊഡ്യൂൾ 1:"));
});

/* ------------------------------------------------------------------ assembly */

const parseFixture = (lines, spaceBreaks = []) =>
  parseBook({
    text: ["*T*", ...lines].join("\n"),
    chapterDefs: [{ slug: "t", title: "T", markers: ["*T*"] }],
    spaceBreaks: new Set(spaceBreaks.map((i) => i + 1)), // +1 for the marker line
  })[0].bodyHtml;

test("closes up a wrapped word but keeps a listed break as a space", () => {
  // Line 0 -> 1 is a split word; line 1 -> 2 is two words, so index 1 is a space break.
  const html = parseFixture(["സാമൂഹ്യഘടന", "യുടെ ചുമതല", "നിർവ്വഹിക്കണം."], [1]);
  assert.strictEqual(html, "<p>സാമൂഹ്യഘടനയുടെ ചുമതല നിർവ്വഹിക്കണം.</p>");
});

test("starts a new paragraph after a line that ends in a full stop", () => {
  const html = parseFixture(["ഒന്നാമത്തേത്.", "രണ്ടാമത്തേത്."]);
  assert.strictEqual(html, "<p>ഒന്നാമത്തേത്.</p>\n<p>രണ്ടാമത്തേത്.</p>");
});

test("groups a run of items into one list", () => {
  const html = parseFixture(["1. ഒന്ന്.", "2. രണ്ട്.", "3. മൂന്ന്."]);
  assert.strictEqual(
    html,
    '<ol type="1">\n<li>ഒന്ന്.</li>\n<li>രണ്ട്.</li>\n<li>മൂന്ന്.</li>\n</ol>'
  );
});

test("a completed list item does not swallow the line after it", () => {
  const html = parseFixture(["1. ഒന്ന്.", "\tമൊഡ്യൂൾ 2:", "തലക്കെട്ട്", "1. രണ്ട്."]);
  assert.ok(html.includes("<h3>മൊഡ്യൂൾ 2: തലക്കെട്ട്</h3>"), html);
  assert.ok(!html.includes("ഒന്ന്.മൊഡ്യൂൾ"), html);
});

test("a tab-indented continuation is part of its item, not a heading", () => {
  const html = parseFixture(["\ta. ഈമാനും", "\tഅഖീദയും ദൃഢപ്പെടുത്തുക."]);
  assert.strictEqual(html, '<ol type="a">\n<li>ഈമാനുംഅഖീദയും ദൃഢപ്പെടുത്തുക.</li>\n</ol>');
  assert.ok(!html.includes("<h3>"));
});

test("promotes a short unpunctuated line sitting on top of a list", () => {
  const html = parseFixture(["Methodology", "1. ഒന്ന്."]);
  assert.ok(html.startsWith("<h3>Methodology</h3>"), html);
});

test("does not promote a wrapped paragraph that merely starts short", () => {
  const html = parseFixture([
    "ഈ രംഗത്ത് കൃത്യമായ ആസൂത്രണത്തോടെ ഇടപെട",
    "ലുകൾ നടത്തിയാൽ വലിയ പ്രതിഫലനങ്ങൾ സൃഷ്ടിക്കാൻ സാധിക്കും.",
    "1. ഒന്ന്.",
  ]);
  assert.ok(html.startsWith("<p>"), html);
  assert.ok(html.includes("ഇടപെടലുകൾ"), html);
});

test("a source that is not hard-wrapped separates every line with a space", () => {
  // The signature block of the Minimum booklet: three complete lines, none punctuated.
  // Under the hard-wrapped default these would run together as "ചെയർമാൻമസ്ജിദ്".
  const html = parseBook({
    text: ["*T*", "ചെയർമാൻ", "മസ്ജിദ് കൗൺസിൽ കേരള", "09/01/2024"].join("\n"),
    chapterDefs: [{ slug: "t", title: "T", markers: ["*T*"] }],
    hardWrapped: false,
  })[0].bodyHtml;
  assert.strictEqual(html, "<p>ചെയർമാൻ മസ്ജിദ് കൗൺസിൽ കേരള 09/01/2024</p>");
});

test("escapes html metacharacters in the source", () => {
  const html = parseFixture(["പെയിൻ & പാലിയേറ്റീവ് <b> പ്രവർത്തനം."]);
  assert.ok(html.includes("&amp;"));
  assert.ok(html.includes("&lt;b&gt;"));
});

test("rejects a chapter map whose markers are out of order", () => {
  assert.throws(
    () =>
      parseBook({
        text: "*A*\nഒന്ന്.\n*B*\nരണ്ട്.",
        chapterDefs: [
          { slug: "b", title: "B", markers: ["*B*"] },
          { slug: "a", title: "A", markers: ["*A*"] },
        ],
      }),
    /Chapter marker not found/
  );
});

/* ------------------------------------------------------- the real books */

for (const book of BOOKS) {
  test(`parses ${book.slug} into its full chapter list`, () => {
    const text = fs.readFileSync(path.join(BACKEND_ROOT, book.sourceFile), "utf8");
    const joins = book.joinsFile
      ? JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", book.joinsFile), "utf8"))
      : { spaceBreaks: [] };
    const chapters = parseBook({
      text: text.replace(/^﻿/, ""),
      chapterDefs: book.chapters,
      spaceBreaks: new Set(joins.spaceBreaks),
      hardWrapped: book.hardWrapped !== false,
    });

    assert.strictEqual(chapters.length, book.chapters.length);
    for (const chapter of chapters) {
      assert.ok(chapter.bodyHtml.trim().length > 100, `${chapter.slug} is suspiciously short`);
      // A stray virama pair or a leftover legacy chillu means normalisation regressed.
      assert.ok(!chapter.bodyHtml.includes("്്"), `${chapter.slug} has a doubled virama`);
      assert.ok(!/[൪൯]/.test(chapter.bodyHtml), `${chapter.slug} has a digit used as chillu`);
      assert.ok(!chapter.bodyHtml.includes("\t"), `${chapter.slug} has a raw tab`);
    }
    assert.strictEqual(new Set(chapters.map((c) => c.slug)).size, chapters.length);
  });
}

test("the seeded books keep the wording of the printed opening paragraph", () => {
  const book = BOOKS[0];
  const text = fs.readFileSync(path.join(BACKEND_ROOT, book.sourceFile), "utf8");
  const joins = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", book.joinsFile), "utf8")
  );
  const [first] = parseBook({
    text: text.replace(/^﻿/, ""),
    chapterDefs: book.chapters,
    spaceBreaks: new Set(joins.spaceBreaks),
  });

  // Wrapped words closed up …
  assert.ok(first.bodyHtml.includes("സാമൂഹ്യഘടനയുടെ"));
  assert.ok(first.bodyHtml.includes("മഹല്ലിനുമുണ്ടായിരിക്കണം"));
  // … but a real word boundary preserved.
  assert.ok(first.bodyHtml.includes("ഭാരിച്ച ചുമതല നിർവ്വഹിക്കപ്പെടേണ്ട"));
  // The printed chapter is six paragraphs.
  assert.strictEqual((first.bodyHtml.match(/<p>/g) || []).length, 6);
});
