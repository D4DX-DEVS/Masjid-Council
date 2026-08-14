const express = require("express");
const Submission = require("../models/submission");
const FormConfiguration = require("../models/formConfiguration");
const { str, exactCI } = require("../lib/queryHelpers");
const { authenticateAreaAdmin } = require("../middleware/auth");

const router = express.Router();

// Every route is scoped by the authenticated area admin's own district+area.
// Client-sent district/area query params are deliberately ignored.
// Case-blind: the area-admin roster is uppercase, master data is mixed case.
const ownScope = (req) => ({
  district: exactCI(req.user.adminData.district),
  area: exactCI(req.user.adminData.area),
});

// Office-use data belongs to admin / super admin only. Hiding it in the UI is
// not enough — it must never leave the server on an area-admin request.
const HIDE_FROM_AREA =
  "-officeComment -approvedAmount -approvedAt -approvedByName -paidAmount -paidAt -paidByName -paidNote -paidMethod";

// List own-area submissions across all form types
router.get("/submissions", authenticateAreaAdmin, async (req, res) => {
  try {
    const formType = str(req.query.formType);
    const status = str(req.query.status);
    const query = { ...ownScope(req) };
    if (formType) query.formType = formType;
    if (status) query.status = status;

    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .select(`-formData ${HIDE_FROM_AREA}`);
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error("Area list error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Own-area submission detail (with config for labeling)
router.get("/submissions/:id", authenticateAreaAdmin, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      ...ownScope(req),
    }).select(HIDE_FROM_AREA);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    const config = await FormConfiguration.findOne({ formType: submission.formType });
    res.json({ success: true, data: submission, config });
  } catch (error) {
    console.error("Area detail error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Add / update verification comment. No status power.
router.patch("/submissions/:id/verify", authenticateAreaAdmin, async (req, res) => {
  try {
    const comment = (req.body.comment || "").trim();
    if (!comment) {
      return res.status(400).json({ success: false, message: "comment is required" });
    }

    // extra answers: only string values, capped lengths — labels come from form config
    const extra = {};
    for (const [k, v] of Object.entries(req.body.extra || {})) {
      if (typeof v === "string" && v.trim()) extra[String(k).slice(0, 200)] = v.trim().slice(0, 500);
    }

    const submission = await Submission.findOneAndUpdate(
      { _id: req.params.id, ...ownScope(req) },
      {
        areaVerification: {
          comment,
          verifiedBy: req.user.adminData._id,
          verifiedByName: req.user.adminData.username,
          verifiedAt: new Date(),
          ...(Object.keys(extra).length ? { extra } : {}),
        },
      },
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    res.json({ success: true, message: "Verification saved", data: submission });
  } catch (error) {
    console.error("Area verify error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
