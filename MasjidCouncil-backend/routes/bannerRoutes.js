const express = require("express");
const Banner = require("../models/banner");
const { authenticateAdmin } = require("../middleware/auth");
const { requireFeature } = require("../lib/featureAccess");

// Same split as publications: public GET unguarded, writes for the super admin and the state
// admin, with the super admin able to switch the feature off for state admins.
const canManage = [authenticateAdmin, requireFeature("banners")];

const router = express.Router();

const fail = (res, error, what) => {
  console.error(`${what} error:`, error);
  res.status(500).json({ success: false, message: "Internal server error" });
};

// The link ends up in an <a href>, so a "javascript:" URL would run in a visitor's browser.
// Only absolute http(s) URLs and paths on this site are accepted; anything else is dropped.
const safeLink = (value) => {
  const link = String(value == null ? "" : value).trim();
  if (!link) return "";
  if (/^https?:\/\//i.test(link)) return link;
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  return null;
};

const imageFrom = (value) => ({
  url: String((value && value.url) || ""),
  key: String((value && value.key) || ""),
});

// Returns the storable fields, or a string describing why the body is rejected.
const bannerFromBody = (body) => {
  const title = String(body.title || "").trim();
  if (!title) return "Title is required";
  const image = imageFrom(body.image);
  if (!image.url) return "A banner image is required";
  const linkUrl = safeLink(body.linkUrl);
  if (linkUrl === null) {
    return "Link must start with http://, https:// or / (a page on this site)";
  }
  return {
    title,
    image,
    mobileImage: imageFrom(body.mobileImage),
    linkUrl,
    openInNewTab: body.openInNewTab !== false,
    enabled: body.enabled !== false,
  };
};

/* ------------------------------------------------------------------ public */

// Cached like the public publication reads: an edit is live within a minute.
router.get("/", async (_req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    const banners = await Banner.find(
      { enabled: true, "image.url": { $ne: "" } },
      "title image.url mobileImage.url linkUrl openInNewTab"
    ).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    fail(res, error, "List banners");
  }
});

/* ------------------------------------------------------------------- admin */

router.get("/admin/all", canManage, async (_req, res) => {
  try {
    const banners = await Banner.find({}).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    fail(res, error, "List banners (admin)");
  }
});

router.post("/", canManage, async (req, res) => {
  try {
    const doc = bannerFromBody(req.body);
    if (typeof doc === "string") {
      return res.status(400).json({ success: false, message: doc });
    }
    const last = await Banner.findOne({}, "order").sort({ order: -1 });
    const created = await Banner.create({ ...doc, order: last ? last.order + 1 : 0 });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    fail(res, error, "Create banner");
  }
});

// Literal path before /:id, otherwise "reorder" is read as an id.
router.put("/reorder", canManage, async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    await Promise.all(
      items.map((item, index) => Banner.updateOne({ _id: item.id }, { $set: { order: index } }))
    );
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Reorder banners");
  }
});

router.put("/:id", canManage, async (req, res) => {
  try {
    const doc = bannerFromBody(req.body);
    if (typeof doc === "string") {
      return res.status(400).json({ success: false, message: doc });
    }
    const updated = await Banner.findByIdAndUpdate(
      req.params.id,
      { $set: doc },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    fail(res, error, "Update banner");
  }
});

router.delete("/:id", canManage, async (req, res) => {
  try {
    const deleted = await Banner.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    res.json({ success: true });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    fail(res, error, "Delete banner");
  }
});

module.exports = router;
