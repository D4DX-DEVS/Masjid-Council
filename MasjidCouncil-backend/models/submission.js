const mongoose = require("mongoose");

// One collection for every dynamic-form submission. formData is keyed
// "field_<id>": value where value is a string, string[], or 2D string array (row tables).

const submissionSchema = new mongoose.Schema(
  {
    formType: { type: String, required: true, lowercase: true, index: true },
    formVersion: { type: Number, required: true },

    formData: { type: mongoose.Schema.Types.Mixed, required: true },

    // Public tracking reference shown to the applicant at submit time (e.g. WF1758696285090354).
    // Sparse: submissions created before this field exist without one.
    referenceNumber: { type: String, default: null, unique: true, sparse: true },

    // Denormalized from formData via the config's roleMapping at submit time,
    // so area admins can be scoped with a plain query.
    district: { type: String, default: "", index: true },
    area: { type: String, default: "", index: true },
    applicantName: { type: String, default: "" },
    phone: { type: String, default: "" },
    // Digits-only Aadhaar, denormalized via roleMapping.aadhaarFieldId. Kept as a
    // reporting column; the duplicate rule it used to drive now lives in uniqueKeys.
    aadhaarNumber: { type: String, default: "", index: true },

    // Denormalized copies of every field the form marks `unique`, normalized by
    // lib/validateSubmission's normalizeKey so lookups are exact. This is what the
    // submit route queries to refuse a duplicate application; `blocks` and
    // `lockYears` are snapshotted from the field so a later config change cannot
    // silently rewrite the rule an existing application was accepted under.
    uniqueKeys: {
      type: [
        {
          _id: false,
          fieldId: { type: Number, required: true },
          value: { type: String, required: true },
          blocks: { type: String, enum: ["approved", "active"], default: "approved" },
          lockYears: { type: Number, default: null },
        },
      ],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: null },

    // Budget: what the applicant asked for (denormalized via roleMapping.amountFieldId)
    // and what the admin granted at approval time. Feeds the spending report.
    requestedAmount: { type: Number, default: null },
    ownContribution: { type: Number, default: null },
    approvedAmount: { type: Number, default: null },
    approvedAt: { type: Date, default: null },
    approvedByName: { type: String, default: null },

    // What was actually handed over, typed in by the office. No payment gateway is
    // involved — this is bookkeeping so sanctioned vs paid can be compared.
    paidAmount: { type: Number, default: null },
    paidAt: { type: Date, default: null },
    paidByName: { type: String, default: null },
    paidNote: { type: String, default: null },
    paidMethod: { type: String, enum: ["bank", "cheque", "cash", "upi", null], default: null },

    // Area admin's physical-verification recommendation
    areaVerification: {
      comment: { type: String, default: null },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
      verifiedByName: { type: String, default: null },
      verifiedAt: { type: Date, default: null },
      // extra label→value answers, labels configured per form (areaVerificationFields)
      extra: { type: Map, of: String, default: undefined },
    },

    // Office-use comment by admin / super admin
    officeComment: {
      comment: { type: String, default: null },
      byName: { type: String, default: null },
      byRole: { type: String, default: null },
      at: { type: Date, default: null },
    },

    // Admins can correct an applicant's answers and attachments after submission.
    // Not a full history — the point is that an unexplained change is visible to
    // whoever looks next, not that every prior value stays recoverable.
    lastEditedByName: { type: String, default: null },
    lastEditedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

submissionSchema.index({ formType: 1, district: 1, area: 1 });
// Backs the duplicate lookup on submit.
submissionSchema.index({ formType: 1, "uniqueKeys.value": 1 });

module.exports = mongoose.model("Submission", submissionSchema);
