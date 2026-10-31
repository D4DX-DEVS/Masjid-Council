const express = require("express");
const Setting = require("../models/setting");
const { authenticateAdmin } = require("../middleware/auth");
const { requireFeature } = require("../lib/featureAccess");
const { normalizeHomepageConfig } = require("../lib/homepageConfig");

// Home page customisation. The admin edits a draft; visitors only ever see the published copy,
// so a half-finished edit never reaches the site. Both live in one Setting document (see
// models/setting.js for why that collection rather than a new one).

const canManage = [authenticateAdmin, requireFeature("homepage")];

const router = express.Router();

const SETTING_KEY = "homepage-config";

const fail = (res, error, what) => {
  console.error(`${what} error:`, error);
  res.status(500).json({ success: false, message: "Internal server error" });
};

const load = async () => {
  const setting = await Setting.findOne({ key: SETTING_KEY });
  const value = (setting && setting.value) || {};
  return {
    draft: value.draft === undefined ? value.published ?? null : value.draft,
    published: value.published ?? null,
    publishedAt: value.publishedAt || null,
    draftUpdatedAt: value.draftUpdatedAt || null,
  };
};

const save = (fields) =>
  Setting.findOneAndUpdate(
    { key: SETTING_KEY },
    { $set: Object.fromEntries(Object.entries(fields).map(([k, v]) => [`value.${k}`, v])) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

const adminView = (state) => ({
  ...state,
  hasUnpublished: JSON.stringify(state.draft) !== JSON.stringify(state.published),
});

/* ------------------------------------------------------------------ public */

// null means "not customised" and the page renders its built-in defaults.
router.get("/", async (_req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    const { published } = await load();
    res.json({ success: true, data: published });
  } catch (error) {
    fail(res, error, "Get homepage config");
  }
});

/* ------------------------------------------------------------------- admin */

router.get("/admin", canManage, async (_req, res) => {
  try {
    res.json({ success: true, data: adminView(await load()) });
  } catch (error) {
    fail(res, error, "Get homepage draft");
  }
});

// Sending { config: null } resets the draft to the built-in defaults.
router.put("/admin/draft", canManage, async (req, res) => {
  try {
    await save({ draft: normalizeHomepageConfig(req.body.config), draftUpdatedAt: new Date() });
    res.json({ success: true, data: adminView(await load()) });
  } catch (error) {
    fail(res, error, "Save homepage draft");
  }
});

router.post("/admin/publish", canManage, async (_req, res) => {
  try {
    const { draft } = await load();
    // Normalised again so a draft saved by an older release cannot go live unchecked.
    await save({ published: normalizeHomepageConfig(draft), publishedAt: new Date() });
    res.json({ success: true, data: adminView(await load()) });
  } catch (error) {
    fail(res, error, "Publish homepage");
  }
});

router.post("/admin/discard", canManage, async (_req, res) => {
  try {
    const { published } = await load();
    await save({ draft: published, draftUpdatedAt: new Date() });
    res.json({ success: true, data: adminView(await load()) });
  } catch (error) {
    fail(res, error, "Discard homepage draft");
  }
});

module.exports = router;
