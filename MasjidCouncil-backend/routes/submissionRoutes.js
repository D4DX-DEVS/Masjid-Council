const express = require("express");
const Submission = require("../models/submission");
const FormConfiguration = require("../models/formConfiguration");
const validateSubmission = require("../lib/validateSubmission");
const { str, exactCI, containsCI } = require("../lib/queryHelpers");
const { authenticateAdmin } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_STATUSES = ["pending", "under_review", "approved", "rejected"];
const PAID_METHODS = ["bank", "cheque", "cash", "upi"];

// Admin / super admin only see an application once the area admin has physically
// verified it and left a comment. Khateeb registration has no field-verification
// step, so it is not gated.
const AREA_GATED = new Set(["welfarefund", "mosquefund", "affiliation"]);

// Reading: gated forms need a comment. Super admin can pull the un-verified
// backlog with ?unverified=1 — the escape hatch for areas with no area admin yet.
const areaGate = (formType, req) => {
  if (!AREA_GATED.has(formType)) return {};
  if (req.user.role === "superadmin" && str(req.query.unverified) === "1") {
    return { "areaVerification.comment": null };
  }
  return { "areaVerification.comment": { $ne: null } };
};

// Writing: no escape hatch. Nothing can be approved / paid / commented on
// before the area admin has spoken.
const verifiedOnly = (formType) =>
  AREA_GATED.has(formType) ? { "areaVerification.comment": { $ne: null } } : {};

// Same rule expressed for aggregates over every form type at once.
const GATE_MATCH = {
  $or: [
    { formType: { $nin: [...AREA_GATED] } },
    { "areaVerification.comment": { $ne: null } },
  ],
};

const NOT_FOUND = "Submission not found, or the area admin has not verified it yet";

// Same style as the legacy MAF numbers: prefix + timestamp + 3 random digits.
const REF_PREFIX = { welfarefund: "WF", mosquefund: "MF", affiliation: "AF", khateeb: "KH" };
const makeReference = (formType) =>
  `${REF_PREFIX[formType] || formType.slice(0, 2).toUpperCase()}${Date.now()}${Math.floor(Math.random() * 900) + 100}`;

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Spending report — declared before /:formType so "stats" is never read as a form type.
// Sums approved amounts per form type. Filters (all optional): ?from=&to= date range on the
// approval date, ?year=&month= shorthand for the same, ?district=&area= location.
router.get("/stats/spending", authenticateAdmin, async (req, res) => {
  try {
    const year = Number(req.query.year) || null;
    const month = Number(req.query.month) || null; // 1-12

    const match = { status: "approved" };
    if (str(req.query.district)) match.district = exactCI(str(req.query.district));
    if (str(req.query.area)) match.area = exactCI(str(req.query.area));

    let from = parseDate(req.query.from);
    let to = parseDate(req.query.to);
    if (to) to = new Date(to.getTime() + 24 * 60 * 60 * 1000); // 'to' day itself is included
    if (!from && !to && year) {
      from = new Date(year, month ? month - 1 : 0, 1);
      to = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);
    }

    if (from || to) {
      const range = {};
      if (from) range.$gte = from;
      if (to) range.$lt = to;
      // old approvals (before approvedAt existed) fall back to updatedAt
      match.$or = [{ approvedAt: range }, { approvedAt: null, updatedAt: range }];
    }

    const rows = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$formType",
          approvedCount: { $sum: 1 },
          totalApproved: { $sum: { $ifNull: ["$approvedAmount", 0] } },
          totalRequested: { $sum: { $ifNull: ["$requestedAmount", 0] } },
          totalPaid: { $sum: { $ifNull: ["$paidAmount", 0] } },
          paidCount: { $sum: { $cond: [{ $gt: ["$paidAmount", 0] }, 1, 0] } },
        },
      },
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Spending stats error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Dashboard summary over the live submission system: per-form status counts,
// this year's monthly trend, and the latest submissions. Declared before /:formType.
router.get("/stats/summary", authenticateAdmin, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const [byTypeStatus, monthly, recent] = await Promise.all([
      Submission.aggregate([
        { $match: GATE_MATCH },
        { $group: { _id: { t: "$formType", s: "$status" }, n: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $match: { ...GATE_MATCH, createdAt: { $gte: new Date(year, 0, 1) } } },
        { $group: { _id: { $month: "$createdAt" }, n: { $sum: 1 } } },
      ]),
      Submission.find(GATE_MATCH)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("formType applicantName status createdAt"),
    ]);
    res.json({ success: true, data: { byTypeStatus, monthly, recent } });
  } catch (error) {
    console.error("Summary stats error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Area-verified submissions still waiting for an admin decision — feeds the
// dashboards' "action needed" card. Declared before /:formType like /stats/spending.
router.get("/stats/action-needed", authenticateAdmin, async (req, res) => {
  try {
    const match = {
      "areaVerification.comment": { $ne: null },
      status: { $in: ["pending", "under_review"] },
    };
    const [counts, recent] = await Promise.all([
      Submission.aggregate([{ $match: match }, { $group: { _id: "$formType", count: { $sum: 1 } } }]),
      Submission.find(match)
        .sort({ "areaVerification.verifiedAt": -1 })
        .limit(5)
        .select("formType applicantName district area status areaVerification.verifiedAt areaVerification.verifiedByName"),
    ]);
    res.json({ success: true, data: { counts, recent } });
  } catch (error) {
    console.error("Action-needed stats error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Public submit
router.post("/:formType", async (req, res) => {
  try {
    const config = await FormConfiguration.findOne({
      formType: req.params.formType,
      isPublished: true,
      enabled: true,
    });
    if (!config) {
      return res.status(404).json({ success: false, message: "Form is not available" });
    }

    const { formData } = req.body;
    if (!formData || typeof formData !== "object") {
      return res.status(400).json({ success: false, message: "formData is required" });
    }

    const { errors, district, area, applicantName, phone, requestedAmount, ownContribution } =
      validateSubmission(config.toObject(), formData);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const submission = await Submission.create({
      formType: config.formType,
      formVersion: config.version,
      formData,
      referenceNumber: makeReference(config.formType),
      district,
      area,
      applicantName,
      phone,
      requestedAmount,
      ownContribution,
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: { id: submission._id, referenceNumber: submission.referenceNumber },
    });
  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// List — admin / super admin
router.get("/:formType", authenticateAdmin, async (req, res) => {
  try {
    const status = str(req.query.status);
    const district = str(req.query.district);
    const area = str(req.query.area);
    const search = str(req.query.search);

    const query = { formType: req.params.formType, ...areaGate(req.params.formType, req) };
    if (status && ALLOWED_STATUSES.includes(status)) query.status = status;
    if (district) query.district = exactCI(district);
    if (area) query.area = exactCI(area);
    if (search) {
      query.$or = [
        { applicantName: containsCI(search) },
        { phone: containsCI(search) },
        { referenceNumber: containsCI(search) },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    // Counts ignore the status filter so the summary tiles stay put while filtering.
    const { status: _ignored, ...countQuery } = query;

    const [total, submissions, statusRows] = await Promise.all([
      Submission.countDocuments(query),
      Submission.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-formData"),
      Submission.aggregate([{ $match: countQuery }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);

    const counts = statusRows.reduce(
      (acc, r) => ({ ...acc, [r._id]: r.n, all: acc.all + r.n }),
      { all: 0 }
    );

    res.json({
      success: true,
      data: submissions,
      meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), counts },
    });
  } catch (error) {
    console.error("List submissions error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Detail — admin / super admin
router.get("/:formType/:id", authenticateAdmin, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      formType: req.params.formType,
      // Super admin can always open a single record — they own the un-verified
      // backlog. Approving it is still blocked until the area admin comments.
      ...(req.user.role === "superadmin" ? {} : areaGate(req.params.formType, req)),
    });
    if (!submission) {
      return res.status(404).json({ success: false, message: NOT_FOUND });
    }
    // Detail page needs the config to label formData values
    const config = await FormConfiguration.findOne({ formType: req.params.formType });
    res.json({ success: true, data: submission, config });
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Status change — admin / super admin
router.patch("/:formType/:id/status", authenticateAdmin, async (req, res) => {
  try {
    const { status, rejectionReason, approvedAmount } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
      });
    }
    if (status === "rejected" && !(rejectionReason || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "rejectionReason is required when rejecting",
      });
    }

    const update = {
      status,
      rejectionReason: status === "rejected" ? rejectionReason.trim() : null,
    };

    if (status === "approved") {
      const amount = Number(approvedAmount);
      update.approvedAmount = approvedAmount !== undefined && approvedAmount !== "" && !Number.isNaN(amount)
        ? amount
        : null;
      update.approvedAt = new Date();
      update.approvedByName =
        req.user.role === "superadmin"
          ? req.user.username || "Super Admin"
          : (req.user.adminData && req.user.adminData.username) || "Admin";
    } else {
      // leaving approved state clears the grant so the report never counts it
      update.approvedAmount = null;
      update.approvedAt = null;
      update.approvedByName = null;
    }

    const submission = await Submission.findOneAndUpdate(
      { _id: req.params.id, formType: req.params.formType, ...verifiedOnly(req.params.formType) },
      update,
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ success: false, message: NOT_FOUND });
    }
    res.json({ success: true, message: `Status changed to ${status}`, data: submission });
  } catch (error) {
    console.error("Status change error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Office-use comment — admin / super admin
// Record what was actually paid out. Bookkeeping only — no gateway, the office types the number.
// Send paidAmount: null (or "") to undo the entry.
router.patch("/:formType/:id/paid", authenticateAdmin, async (req, res) => {
  try {
    const raw = req.body.paidAmount;
    const clearing = raw === null || raw === "" || raw === undefined;
    const paidAmount = clearing ? null : Number(raw);
    if (!clearing && (!Number.isFinite(paidAmount) || paidAmount < 0)) {
      return res.status(400).json({ success: false, message: "paidAmount must be a positive number" });
    }

    const byName =
      req.user.role === "superadmin"
        ? req.user.username || "Super Admin"
        : (req.user.adminData && req.user.adminData.username) || "Admin";

    const paidAt = clearing ? null : parseDate(req.body.paidAt) || new Date();

    const paidMethod = str(req.body.paidMethod);
    if (!clearing && paidMethod && !PAID_METHODS.includes(paidMethod)) {
      return res.status(400).json({
        success: false,
        message: `paidMethod must be one of: ${PAID_METHODS.join(", ")}`,
      });
    }

    const submission = await Submission.findOneAndUpdate(
      { _id: req.params.id, formType: req.params.formType, ...verifiedOnly(req.params.formType) },
      {
        paidAmount,
        paidAt,
        paidByName: clearing ? null : byName,
        paidNote: clearing ? null : str(req.body.paidNote) || null,
        paidMethod: clearing ? null : paidMethod || null,
      },
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ success: false, message: NOT_FOUND });
    }
    res.json({
      success: true,
      message: clearing ? "Payment entry cleared" : "Paid amount saved",
      data: submission,
    });
  } catch (error) {
    console.error("Paid amount error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.patch("/:formType/:id/office-comment", authenticateAdmin, async (req, res) => {
  try {
    const comment = (req.body.comment || "").trim();
    if (!comment) {
      return res.status(400).json({ success: false, message: "comment is required" });
    }

    const byName =
      req.user.role === "superadmin"
        ? req.user.username || "Super Admin"
        : (req.user.adminData && req.user.adminData.username) || "Admin";

    const submission = await Submission.findOneAndUpdate(
      { _id: req.params.id, formType: req.params.formType, ...verifiedOnly(req.params.formType) },
      {
        officeComment: {
          comment,
          byName,
          byRole: req.user.role,
          at: new Date(),
        },
      },
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ success: false, message: NOT_FOUND });
    }
    res.json({ success: true, message: "Office comment saved", data: submission });
  } catch (error) {
    console.error("Office comment error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
