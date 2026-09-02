const express = require("express");
const Publication = require("../models/publication");
const SiteSection = require("../models/siteSection");
const { sanitizeRichText } = require("../lib/sanitizeRichText");
const { uniqueSlug } = require("../lib/slug");
// Publications are editorial content, so both the super admin and the state admin manage
// them — authenticateAdmin already admits exactly those two roles. Public GETs are unguarded.
const { authenticateAdmin } = require("../middleware/auth");

const router = express.Router();

const SECTION_KEY = "publications";

// Shown until an admin sets the real wording from the admin screen.
const SECTION_DEFAULTS = {
  key: SECTION_KEY,
  heading: "പ്രസിദ്ധീകരണങ്ങൾ",
  subtitle: "",
  ctaLabel: "വായിക്കുക",
  enabled: true,
};

const fail = (res, error, what) => {
  console.error(`${what} error:`, error);
  res.status(500).json({ success: false, message: "Internal server error" });
};

// Normalises whatever the editor posted into storable chapters: bodies sanitized, order
// taken from array position, slugs unique within the publication.
const normaliseChapters = (input) => {
  if (!Array.isArray(input)) return [];
  const taken = new Set();
  return input
    .filter((c) => c && typeof c === "object")
    .map((c, index) => {
      const id = Number.isFinite(Number(c.id)) ? Number(c.id) : index + 1;
      const title = String(c.title || "").trim() || `Chapter ${index + 1}`;
      // A slug the admin already has links to must survive an edit of the title.
      const slug = uniqueSlug(c.slug || title, taken, `chapter-${id}`);
      taken.add(slug);
      return { id, slug, title, order: index, bodyHtml: sanitizeRichText(c.bodyHtml) };
    });
};

const publicationFromBody = (body, slug) => ({
  slug,
  title: String(body.title || "").trim(),
  titleMalayalam: String(body.titleMalayalam || "").trim(),
  subtitle: String(body.subtitle || "").trim(),
  description: String(body.description || "").trim(),
  coverImage: {
    url: String((body.coverImage && body.coverImage.url) || ""),
    key: String((body.coverImage && body.coverImage.key) || ""),
  },
  enabled: body.enabled !== false,
  isPublished: body.isPublished === true,
  chapters: normaliseChapters(body.chapters),
});

/* ------------------------------------------------------------------ public */

// Card list. Chapter bodies are deliberately excluded — the home page only needs titles,
// and the two seeded books are ~70KB of HTML between them.
router.get("/", async (_req, res) => {
  try {
    const publications = await Publication.find(
      { isPublished: true, enabled: true },
      "slug title titleMalayalam subtitle description coverImage order chapters.title"
    ).sort({ order: 1, createdAt: 1 });

    res.json({
      success: true,
      data: publications.map((p) => ({
        slug: p.slug,
        title: p.title,
        titleMalayalam: p.titleMalayalam,
        subtitle: p.subtitle,
        description: p.description,
        coverImage: p.coverImage,
        chapterCount: p.chapters.length,
      })),
    });
  } catch (error) {
    fail(res, error, "List publications");
  }
});

// Declared before /:slug, otherwise "section" is read as a publication slug.
router.get("/section", async (_req, res) => {
  try {
    const section = await SiteSection.findOne({ key: SECTION_KEY });
    res.json({ success: true, data: section || SECTION_DEFAULTS });
  } catch (error) {
    fail(res, error, "Get publications section");
  }
});

// Everything including drafts, for the admin list.
router.get("/admin/all", authenticateAdmin, async (_req, res) => {
  try {
    const publications = await Publication.find({}, "-chapters.bodyHtml").sort({
      order: 1,
      createdAt: 1,
    });
    res.json({ success: true, data: publications });
  } catch (error) {
    fail(res, error, "List publications (admin)");
  }
});

// Full record for the editor — drafts included, so this cannot be the public route.
router.get("/admin/:id", authenticateAdmin, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ success: false, message: "Publication not found" });
    }
    res.json({ success: true, data: publication });
  } catch (error) {
    fail(res, error, "Get publication (admin)");
  }
});

// Reader payload. Published only — a draft must not be readable by guessing its slug.
router.get("/:slug", async (req, res) => {
  try {
    const publication = await Publication.findOne({
      slug: String(req.params.slug).toLowerCase(),
      isPublished: true,
      enabled: true,
    });
    if (!publication) {
      return res.status(404).json({ success: false, message: "Publication not found" });
    }
    res.json({ success: true, data: publication });
  } catch (error) {
    fail(res, error, "Get publication");
  }
});

/* ------------------------------------------------------------------- admin */

router.post("/", authenticateAdmin, async (req, res) => {
  try {
    if (!String(req.body.title || "").trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    const taken = new Set((await Publication.find({}, "slug")).map((p) => p.slug));
    const slug = uniqueSlug(req.body.slug || req.body.title, taken, "publication");
    const doc = publicationFromBody(req.body, slug);
    const last = await Publication.findOne({}, "order").sort({ order: -1 });

    const created = await Publication.create({
      ...doc,
      order: last ? last.order + 1 : 0,
      publishedAt: doc.isPublished ? new Date() : null,
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    fail(res, error, "Create publication");
  }
});

// Literal paths must come before /:id or they are swallowed as an id.
router.put("/reorder", authenticateAdmin, async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    await Promise.all(
      items.map((item, index) =>
        Publication.updateOne({ _id: item.id }, { $set: { order: index } })
      )
    );
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Reorder publications");
  }
});

router.put("/section", authenticateAdmin, async (req, res) => {
  try {
    const section = await SiteSection.findOneAndUpdate(
      { key: SECTION_KEY },
      {
        $set: {
          heading: String(req.body.heading == null ? "" : req.body.heading).trim(),
          subtitle: String(req.body.subtitle == null ? "" : req.body.subtitle).trim(),
          ctaLabel: String(req.body.ctaLabel == null ? "" : req.body.ctaLabel).trim(),
          enabled: req.body.enabled !== false,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: section });
  } catch (error) {
    fail(res, error, "Update publications section");
  }
});

router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const existing = await Publication.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Publication not found" });
    }
    if (!String(req.body.title || "").trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const taken = new Set(
      (await Publication.find({ _id: { $ne: existing._id } }, "slug")).map((p) => p.slug)
    );
    // Renaming a publication must not break links already shared, so the slug is only
    // recomputed when the admin explicitly sends a different one.
    const requested = String(req.body.slug || "").trim();
    const slug =
      requested && requested !== existing.slug
        ? uniqueSlug(requested, taken, "publication")
        : existing.slug;

    const doc = publicationFromBody(req.body, slug);
    const nowPublished = doc.isPublished && !existing.isPublished;

    Object.assign(existing, doc, {
      publishedAt: nowPublished ? new Date() : existing.publishedAt,
    });
    await existing.save();

    res.json({ success: true, data: existing });
  } catch (error) {
    fail(res, error, "Update publication");
  }
});

router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const deleted = await Publication.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Publication not found" });
    }
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Delete publication");
  }
});

module.exports = router;
