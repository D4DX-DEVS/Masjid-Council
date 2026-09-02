// Seeds the two council books into the publications section.
//
//   node scripts/seedPublications.js            upsert both books, leave them unpublished
//   node scripts/seedPublications.js --publish  upsert and publish them
//
// Re-running is safe: publications are matched on slug and their chapters replaced, so a
// fix to the parser or to the reviewed line-break decisions is applied by seeding again.
// An admin's edits to a chapter body WILL be overwritten — that is the point of a re-seed,
// but it is why the script says which slugs it is about to touch.

require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");

const Publication = require("../models/publication");
const SiteSection = require("../models/siteSection");
const { parseBook } = require("./lib/bookParse");
const { sanitizeRichText } = require("../lib/sanitizeRichText");
const { BOOKS } = require("./data/books");

const BACKEND_ROOT = path.join(__dirname, "..");
const publish = process.argv.includes("--publish");

const loadChapters = (book) => {
  const sourcePath = path.join(BACKEND_ROOT, book.sourceFile);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source text not found: ${book.sourceFile}`);
  }
  // Only the two hard-wrapped books need reviewed line-break decisions; the later ones were
  // supplied with one paragraph per line, so there is nothing to decide.
  const joins = book.joinsFile
    ? JSON.parse(fs.readFileSync(path.join(__dirname, "data", book.joinsFile), "utf8"))
    : { spaceBreaks: [] };

  const chapters = parseBook({
    // Strip a UTF-8 BOM; it would otherwise land inside the first chapter's first word.
    text: fs.readFileSync(sourcePath, "utf8").replace(/^﻿/, ""),
    chapterDefs: book.chapters,
    spaceBreaks: new Set(joins.spaceBreaks),
    hardWrapped: book.hardWrapped !== false,
  });

  // A silently truncated parse would seed a half book that looks fine in the list, so fail
  // loudly instead.
  if (chapters.length !== book.chapters.length) {
    throw new Error(
      `${book.slug}: expected ${book.chapters.length} chapters, parsed ${chapters.length}`
    );
  }
  for (const chapter of chapters) {
    if (chapter.bodyHtml.trim().length < 100) {
      throw new Error(`${book.slug}: chapter "${chapter.title}" parsed almost empty`);
    }
  }

  // Seeded HTML goes through the same sanitizer as anything an admin types, so the stored
  // body is safe by the same rule everywhere.
  return chapters.map((chapter) => ({
    ...chapter,
    bodyHtml: sanitizeRichText(chapter.bodyHtml),
  }));
};

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(process.env.MONGODB_URI);

  let order = 0;
  for (const book of BOOKS) {
    const chapters = loadChapters(book);
    const existing = await Publication.findOne({ slug: book.slug });

    const doc = {
      slug: book.slug,
      title: book.title,
      titleMalayalam: book.titleMalayalam,
      subtitle: book.subtitle,
      description: book.description,
      chapters,
      order: order += 1,
      enabled: true,
    };

    if (publish) {
      doc.isPublished = true;
      doc.publishedAt = existing?.publishedAt || new Date();
    }
    // Without --publish, an already-published book keeps its state rather than being
    // yanked off the live site by a content refresh.

    await Publication.findOneAndUpdate({ slug: book.slug }, { $set: doc }, { upsert: true });

    const words = chapters.reduce(
      (n, c) => n + c.bodyHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length,
      0
    );
    console.log(
      `${existing ? "updated" : "created"}  ${book.slug}  ` +
        `${chapters.length} chapters, ~${words.toLocaleString()} words` +
        `${publish ? ", published" : ""}`
    );
  }

  // Create the section copy on first run only; after that the admin owns the wording.
  const section = await SiteSection.findOne({ key: "publications" });
  if (!section) {
    // Heading and subtitle start empty on purpose — the home page shows neither until an
    // admin types them in, so a fresh install has no placeholder copy to delete.
    await SiteSection.create({
      key: "publications",
      heading: "",
      subtitle: "",
      ctaLabel: "വായിക്കുക",
      enabled: true,
    });
    console.log('created   site section "publications"');
  } else {
    console.log('kept      site section "publications" (already configured)');
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
