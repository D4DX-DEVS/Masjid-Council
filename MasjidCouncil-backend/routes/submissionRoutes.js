const express = require("express");
const Submission = require("../models/submission");
const FormConfiguration = require("../models/formConfiguration");
const validateSubmission = require("../lib/validateSubmission");
const { authenticateAdmin } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_STATUSES = ["pending", "under_review", "approved", "rejected"];

// Spending report — declared before /:formType so "stats" is never read as a form type.
// Sums approved amounts per form type; optional ?year=&month= filter on the approval date.
router.get("/stats/spending", authenticateAdmin, async (req, res) => {
  try {
    const year = Number(req.query.year) || null;
    const month = Number(req.query.month) || null; // 1-12

    const match = { status: "approved" };
    if (year) {
      const from = new Date(year, month ? month - 1 : 0, 1);
      const to = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);
      // old approvals (before approvedAt existed) fall back to updatedAt
      match.$or = [
        { approvedAt: { $gte: from, $lt: to } },
        { approvedAt: null, updatedAt: { $gte: from, $lt: to } },
      ];
    }

    const rows = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$formType",
          approvedCount: { $sum: 1 },
          totalApproved: { $sum: { $ifNull: ["$approvedAmount", 0] } },
          totalRequested: { $sum: { $ifNull: ["$requestedAmount", 0] } },
        },
      },
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Spending stats error:", error);
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
      data: { id: submission._id },
    });
  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// List — admin / super admin
router.get("/:formType", authenticateAdmin, async (req, res) => {
  try {
    const { status, district, area, search } = req.query;
    const query = { formType: req.params.formType };
    if (status && ALLOWED_STATUSES.includes(status)) query.status = status;
    if (district) query.district = district;
    if (area) query.area = area;
    if (search) {
      query.$or = [
        { applicantName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .select("-formData");
    res.json({ success: true, data: submissions });
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
      return res.status(404).json({ success: false, message: "Submission not found" });
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
      { _id: req.params.id, formType: req.params.formType },
      update,
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    res.json({ success: true, message: `Status changed to ${status}`, data: submission });
  } catch (error) {
    console.error("Status change error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Office-use comment — admin / super admin
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
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    res.json({ success: true, message: "Office comment saved", data: submission });
  } catch (error) {
    console.error("Office comment error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
