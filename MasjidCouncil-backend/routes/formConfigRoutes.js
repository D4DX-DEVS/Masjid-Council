const express = require("express");
const FormConfiguration = require("../models/formConfiguration");
// Form configuration is super-admin-only. State admins work with submissions,
// never with the field definitions. Only the public GET /:formType is unguarded.
const { authenticateAdmin } = require("../middleware/auth");
// The super admin can switch form editing off for state admins. The sidebar entry is hidden
// too, but that is cosmetic — this guard is what actually enforces the switch.
const { requireFeature } = require("../lib/featureAccess");

const canManage = [authenticateAdmin, requireFeature("formBuilder")];

const router = express.Router();

const FORM_TYPES = ["welfarefund", "mosquefund", "affiliation", "khateeb"];

const badFormType = (res, formType) =>
  res.status(404).json({
    success: false,
    message: `Unknown form type '${formType}'`,
  });

// List all configs (summary) — super admin
router.get("/", canManage, async (req, res) => {
  try {
    const configs = await FormConfiguration.find(
      {},
      "formType title enabled isPublished version updatedAt"
    ).sort({ formType: 1 });
    res.json({ success: true, data: configs, formTypes: FORM_TYPES });
  } catch (error) {
    console.error("List form configs error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Full config for the builder — super admin
router.get("/:formType/admin", canManage, async (req, res) => {
  try {
    const config = await FormConfiguration.findOne({ formType: req.params.formType });
    if (!config) {
      return res.json({ success: true, hasConfiguration: false, data: null });
    }
    res.json({ success: true, hasConfiguration: true, data: config });
  } catch (error) {
    console.error("Get form config (admin) error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Published config for the public renderer
router.get("/:formType", async (req, res) => {
  try {
    const config = await FormConfiguration.findOne({
      formType: req.params.formType,
      isPublished: true,
      enabled: true,
    });
    if (!config) {
      return res.status(404).json({
        success: false,
        available: false,
        message: "Form is not available",
      });
    }
    res.json({ success: true, available: true, data: config });
  } catch (error) {
    console.error("Get form config error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Create/update config — super admin. Version increments on every save.
router.put("/:formType", canManage, async (req, res) => {
  try {
    const { formType } = req.params;
    if (!FORM_TYPES.includes(formType)) return badFormType(res, formType);

    const { title, description, areaVerificationHint, areaVerificationFields, officeCommentHint, enabled, pages, instructions, roleMapping } = req.body;

    if (!title || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "title and at least one page are required",
      });
    }

    // Field ids must be unique across all pages
    const ids = pages.flatMap((p) => (p.fields || []).map((f) => f.id));
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({
        success: false,
        message: "Field ids must be unique across all pages",
      });
    }

    let config = await FormConfiguration.findOne({ formType });
    if (config) {
      config.title = title;
      config.description = description || "";
      config.areaVerificationHint = areaVerificationHint || "";
      config.areaVerificationFields = Array.isArray(areaVerificationFields) ? areaVerificationFields : [];
      config.officeCommentHint = officeCommentHint || "";
      if (enabled !== undefined) config.enabled = enabled;
      config.pages = pages;
      config.instructions = instructions || [];
      config.roleMapping = roleMapping || {};
      config.version += 1;
    } else {
      config = new FormConfiguration({
        formType,
        title,
        description: description || "",
        areaVerificationHint: areaVerificationHint || "",
        areaVerificationFields: Array.isArray(areaVerificationFields) ? areaVerificationFields : [],
        officeCommentHint: officeCommentHint || "",
        enabled: enabled !== undefined ? enabled : true,
        pages,
        instructions: instructions || [],
        roleMapping: roleMapping || {},
      });
    }

    await config.save();
    res.json({ success: true, message: "Form configuration saved", data: config });
  } catch (error) {
    console.error("Save form config error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
});

// Publish / unpublish — super admin
router.patch("/:formType/publish", canManage, async (req, res) => {
  try {
    const { isPublished } = req.body;
    const config = await FormConfiguration.findOne({ formType: req.params.formType });
    if (!config) {
      return res.status(404).json({ success: false, message: "Form configuration not found" });
    }

    config.isPublished = !!isPublished;
    config.publishedAt = isPublished ? new Date() : config.publishedAt;
    await config.save();

    res.json({
      success: true,
      message: isPublished ? "Form published" : "Form unpublished",
      data: { formType: config.formType, isPublished: config.isPublished },
    });
  } catch (error) {
    console.error("Publish form config error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
