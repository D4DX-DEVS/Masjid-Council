const express = require("express");
const Submission = require("../models/submission");
const FormConfiguration = require("../models/formConfiguration");
const validateSubmission = require("../lib/validateSubmission");
const { str, exactCI, containsCI } = require("../lib/queryHelpers");
const { authenticateAdmin } = require("../middleware/auth");
const { isUploadedDocumentUrl } = require("../utils/documentUrl");

const router = express.Router();

const ALLOWED_STATUSES = ["pending", "under_review", "approved", "rejected"];
const PAID_METHODS = ["bank", "cheque", "cash", "upi"];

// Area verification is a recommendation, not an approval — it is one comment field
// an area admin fills in. It used to hide an application from admin / super admin
// entirely until it arrived, which meant a slow or absent area admin silently froze
// an application where nobody could see it. Now every submission is visible from the
// moment it is filed; an un-verified one is tagged in the list and banner-flagged on
// the detail page, and admin / super admin may decide on it without waiting.
// Khateeb registration has no field-verification step at all.
const AREA_GATED = new Set(["welfarefund", "mosquefund", "affiliation"]);

// Optional list filter, replacing the old super-admin-only ?unverified=1 escape
// hatch: ?verification=pending narrows to the un-verified backlog, ?verification=done
// to what the area admin has already seen. Anything else means "no filter".
const verificationFilter = (formType, req) => {
  if (!AREA_GATED.has(formType)) return {};
  const wanted = str(req.query.verification);
  if (wanted === "pending") return { "areaVerification.comment": null };
  if (wanted === "done") return { "areaVerification.comment": { $ne: null } };
  return {};
};

const NOT_FOUND = "Submission not found";

// Whose name goes on a decision or an edit. Super admins authenticate against env
// credentials and have no Admin row, so their username lives on the token itself.
const actorName = (req) =>
  req.user.role === "superadmin"
    ? req.user.username || "Super Admin"
    : (req.user.adminData && req.user.adminData.username) || "Admin";

// Look up whichever unique keys this submission carries and return a message when
// one is already taken, or null when all of them are free. `blocks` and `lockYears`
// come from the submitted keys, which validateSubmission snapshotted off the field.
// File answers are urls that end up in an admin's <a href>. The forms are public, so
// the value is attacker-controlled and `javascript:...` in an href runs on click —
// accept only what our own upload endpoint could have produced. Returns an error
// message, or null when every file field is fine.
const badFileUrl = (config, formData) => {
  for (const page of config.pages || []) {
    for (const field of page.fields || []) {
      if (field.type !== "file") continue;
      const value = formData[`field_${field.id}`];
      if (value === undefined || value === null || value === "") continue;
      if (typeof value !== "string" || !isUploadedDocumentUrl(value)) {
        return `${field.label}: attachments must be uploaded through this site`;
      }
    }
  }
  return null;
};

const fieldLabels = (config) => {
  const labels = {};
  for (const page of config.pages || []) {
    for (const field of page.fields || []) labels[field.id] = field.label;
  }
  return labels;
};

const findDuplicate = async (formType, uniqueKeys, labels = {}, excludeId = null) => {
  for (const key of uniqueKeys || []) {
    const taken = [];

    if (key.lockYears === null || key.lockYears === undefined) {
      taken.push({ status: "approved" });
    } else {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - Number(key.lockYears));
      taken.push({
        status: "approved",
        // approvals predating approvedAt fall back to when the record was created
        $or: [{ approvedAt: { $gte: cutoff } }, { approvedAt: null, createdAt: { $gte: cutoff } }],
      });
    }
    if (key.blocks === "active") {
      taken.push({ status: { $in: ["pending", "under_review"] } });
    }

    const query = {
      formType,
      uniqueKeys: { $elemMatch: { fieldId: key.fieldId, value: key.value } },
      $or: taken,
    };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await Submission.findOne(query).select("status referenceNumber");
    if (!existing) continue;

    const ref = existing.referenceNumber ? ` (ref: ${existing.referenceNumber})` : "";
    const what = labels[key.fieldId] || "this value";
    if (existing.status === "approved") {
      const years = key.lockYears;
      return years
        ? `An application with this ${what} was already approved. A new application is allowed only after ${years} year${years === 1 ? "" : "s"}.`
        : `An approved application already uses this ${what}${ref}. It cannot be used again.`;
    }
    return `An application with this ${what} is already under process${ref}.`;
  }
  return null;
};

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
        { $group: { _id: { t: "$formType", s: "$status" }, n: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $match: { createdAt: { $gte: new Date(year, 0, 1) } } },
        { $group: { _id: { $month: "$createdAt" }, n: { $sum: 1 } } },
      ]),
      Submission.find({})
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

// Submissions still waiting for an admin decision — feeds the dashboards' "action
// needed" card. Un-verified ones are listed too: they are the ones most at risk of
// being forgotten. Declared before /:formType like /stats/spending.
router.get("/stats/action-needed", authenticateAdmin, async (req, res) => {
  try {
    const match = { status: { $in: ["pending", "under_review"] } };
    const [counts, recent] = await Promise.all([
      Submission.aggregate([{ $match: match }, { $group: { _id: "$formType", count: { $sum: 1 } } }]),
      Submission.find(match)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("formType applicantName district area status createdAt areaVerification.verifiedAt areaVerification.verifiedByName"),
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

    const plainConfig = config.toObject();

    const badFile = badFileUrl(plainConfig, formData);
    if (badFile) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: [badFile] });
    }

    const {
      errors, uniqueKeys, district, area, applicantName, phone,
      requestedAmount, ownContribution, aadhaarNumber,
    } = validateSubmission(plainConfig, formData);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    // Duplicate applications, keyed on whichever fields the form marks unique.
    // A rejected application always frees its key. What else blocks is the field's
    // own choice: "approved" lets a second application queue behind a pending one
    // (Masjid Fund — one grant per masjid, but applying twice is not the offence),
    // "active" also reserves the key while an application is in process (Aadhaar —
    // one application per person at a time).
    const duplicate = await findDuplicate(config.formType, uniqueKeys, fieldLabels(plainConfig));
    if (duplicate) {
      return res.status(409).json({ success: false, message: duplicate });
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
      aadhaarNumber,
      uniqueKeys,
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

    const query = { formType: req.params.formType, ...verificationFilter(req.params.formType, req) };
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
      update.approvedByName = actorName(req);
    } else {
      // leaving approved state clears the grant so the report never counts it
      update.approvedAmount = null;
      update.approvedAt = null;
      update.approvedByName = null;
    }

    const submission = await Submission.findOneAndUpdate(
      { _id: req.params.id, formType: req.params.formType },
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

    const byName = actorName(req);

    const paidAt = clearing ? null : parseDate(req.body.paidAt) || new Date();

    const paidMethod = str(req.body.paidMethod);
    if (!clearing && paidMethod && !PAID_METHODS.includes(paidMethod)) {
      return res.status(400).json({
        success: false,
        message: `paidMethod must be one of: ${PAID_METHODS.join(", ")}`,
      });
    }

    const submission = await Submission.findOneAndUpdate(
      { _id: req.params.id, formType: req.params.formType },
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

    const byName = actorName(req);

    const submission = await Submission.findOneAndUpdate(
      { _id: req.params.id, formType: req.params.formType },
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

// Correct an applicant's answers. State admin and super admin both: a wrong bank
// account or a mistyped amount is fixed by whoever is holding the file, and refusing
// the edit only pushes the correction into a phone call and an unrecorded decision.
//
// The whole formData is replaced, not merged, so a field can be cleared. It is
// re-validated against the live config exactly like a public submit, and the
// denormalized columns are rebuilt from it — editing the district field and leaving
// `district` pointing at the old one is how an application disappears from a list.
router.patch("/:formType/:id/form-data", authenticateAdmin, async (req, res) => {
  try {
    const { formData } = req.body;
    if (!formData || typeof formData !== "object" || Array.isArray(formData)) {
      return res.status(400).json({ success: false, message: "formData is required" });
    }

    const submission = await Submission.findOne({
      _id: req.params.id,
      formType: req.params.formType,
    });
    if (!submission) {
      return res.status(404).json({ success: false, message: NOT_FOUND });
    }

    const config = await FormConfiguration.findOne({ formType: req.params.formType });
    if (!config) {
      return res.status(404).json({ success: false, message: "Form configuration not found" });
    }
    const plainConfig = config.toObject();

    // An admin session is no reason to accept `javascript:` in a form field either.
    const badFile = badFileUrl(plainConfig, formData);
    if (badFile) {
      return res.status(400).json({ success: false, message: badFile });
    }

    const {
      errors, uniqueKeys, district, area, applicantName, phone,
      requestedAmount, ownContribution, aadhaarNumber,
    } = validateSubmission(plainConfig, formData);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    // An edit can introduce a duplicate just as a new submission can. Exclude this
    // record, or saving it unchanged would collide with itself.
    const duplicate = await findDuplicate(
      req.params.formType,
      uniqueKeys,
      fieldLabels(plainConfig),
      submission._id
    );
    if (duplicate) {
      return res.status(409).json({ success: false, message: duplicate });
    }

    submission.formData = formData;
    submission.uniqueKeys = uniqueKeys;
    submission.district = district;
    submission.area = area;
    submission.applicantName = applicantName;
    submission.phone = phone;
    submission.requestedAmount = requestedAmount;
    submission.ownContribution = ownContribution;
    submission.aadhaarNumber = aadhaarNumber;
    submission.lastEditedByName = actorName(req);
    submission.lastEditedAt = new Date();
    await submission.save();

    res.json({ success: true, message: "Application updated", data: submission });
  } catch (error) {
    console.error("Edit submission error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Delete an application outright. Files already in Spaces are left where they are:
// the same url can appear on another record after an admin copied it across, and an
// orphaned object costs storage while a wrongly deleted one costs the applicant their
// evidence.
router.delete("/:formType/:id", authenticateAdmin, async (req, res) => {
  try {
    const submission = await Submission.findOneAndDelete({
      _id: req.params.id,
      formType: req.params.formType,
    });
    if (!submission) {
      return res.status(404).json({ success: false, message: NOT_FOUND });
    }
    res.json({ success: true, message: "Application deleted" });
  } catch (error) {
    console.error("Delete submission error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
