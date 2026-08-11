const express = require("express");
const router = express.Router();
const mosqueAffiliation = require("../models/mosqueAffiliation");
const welfarefund = require("../models/welfarefund");
const mosqueFund = require("../models/mosqueFund");
const khateebRegistration = require("../models/khateebRegistration");
const Submission = require("../models/submission");

const SUBMISSION_TYPE_LABELS = {
  welfarefund: "Welfare Fund",
  mosquefund: "Masjid Fund",
  affiliation: "Masjid Affiliation",
  khateeb: "Mirqath '26",
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Public status lookup by affiliation number or by the phone number used on the form.
router.get("/", async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) {
    return res.status(400).json({ success: false, message: "Enter a reference number or mobile number" });
  }

  // ponytail: uppercase exact match hits the unique index; the /i regex would force a collection scan.
  const ref = query.toUpperCase();
  const digits = query.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : null;
  const phone = last10 ? new RegExp(`${escapeRegex(last10)}$`) : null;

  try {
    const [affiliations, welfare, fund, khateeb, dynamicSubs] = await Promise.all([
      mosqueAffiliation.find({
        $or: [
          { affiliationNumber: ref },
          ...(last10 ? [{ "address.phone": Number(last10) }] : [])
        ]
      }).select("affiliationNumber name status createdAt").lean(),
      phone ? welfarefund.find({ phone }).select("mosqueName status createdAt").lean() : [],
      phone ? mosqueFund.find({ phone }).select("mosqueName status createdAt").lean() : [],
      phone ? khateebRegistration.find({ phone }).select("fullName status createdAt").lean() : [],
      Submission.find({
        $or: [
          { referenceNumber: ref },
          ...(phone ? [{ phone: { $regex: phone } }] : [])
        ]
      }).select("formType referenceNumber applicantName status createdAt").lean()
    ]);

    const results = [
      ...affiliations.map(d => ({
        type: "Masjid Affiliation", reference: d.affiliationNumber,
        name: d.name, status: d.status, createdAt: d.createdAt
      })),
      ...welfare.map(d => ({ type: "Welfare Fund", name: d.mosqueName, status: d.status, createdAt: d.createdAt })),
      ...fund.map(d => ({ type: "Masjid Fund", name: d.mosqueName, status: d.status, createdAt: d.createdAt })),
      ...khateeb.map(d => ({ type: "Mirqath '26", name: d.fullName, status: d.status, createdAt: d.createdAt })),
      ...dynamicSubs.map(d => ({
        type: SUBMISSION_TYPE_LABELS[d.formType] || d.formType, reference: d.referenceNumber,
        name: d.applicantName, status: (d.status || "").replace("_", " "), createdAt: d.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error("Track lookup error:", error);
    res.status(500).json({ success: false, message: "Lookup failed. Please try again." });
  }
});

module.exports = router;
