const express = require("express");
const Submission = require("../models/submission");
const FormConfiguration = require("../models/formConfiguration");
const { str, exactCI } = require("../lib/queryHelpers");
const { authenticateDistrictAdmin } = require("../middleware/auth");

const router = express.Router();

// District admins are strictly read-only observers. Two hard rules, both
// enforced server-side on every query (never trusted to the client):
//  1. Own district only — the district comes from the authenticated account.
//  2. Decided submissions only — pending/under_review never leave the server.
const DECIDED = ["approved", "rejected"];

// Office-use comment stays admin/super-admin only.
const HIDE = "-officeComment";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Build the scoped, filtered query from request params.
// Supported filters: formType, status (approved|rejected), area, search (name),
// from / to (createdAt date range, yyyy-mm-dd).
const buildQuery = (req) => {
  const query = {
    district: exactCI(req.user.adminData.district),
    status: { $in: DECIDED },
  };

  const formType = str(req.query.formType);
  const status = str(req.query.status);
  const area = str(req.query.area);
  const search = str(req.query.search);
  const from = str(req.query.from);
  const to = str(req.query.to);

  if (formType) query.formType = formType;
  if (DECIDED.includes(status)) query.status = status; // anything else keeps the $in guard
  if (area) query.area = exactCI(area);
  if (search) query.applicantName = { $regex: escapeRegex(search), $options: "i" };
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }
  return query;
};

// List decided submissions in own district (filters via query params)
router.get("/submissions", authenticateDistrictAdmin, async (req, res) => {
  try {
    const submissions = await Submission.find(buildQuery(req))
      .sort({ createdAt: -1 })
      .select(`-formData ${HIDE}`);
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error("District list error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Decided submission detail (with config for labeling)
router.get("/submissions/:id", authenticateDistrictAdmin, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      district: exactCI(req.user.adminData.district),
      status: { $in: DECIDED },
    }).select(HIDE);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    const config = await FormConfiguration.findOne({ formType: submission.formType });
    res.json({ success: true, data: submission, config });
  } catch (error) {
    console.error("District detail error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
