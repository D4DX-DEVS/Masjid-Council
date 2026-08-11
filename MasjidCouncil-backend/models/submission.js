const mongoose = require("mongoose");

// One collection for every dynamic-form submission. formData is keyed
// "field_<id>": value where value is a string, string[], or 2D string array (row tables).

const submissionSchema = new mongoose.Schema(
  {
    formType: { type: String, required: true, lowercase: true, index: true },
    formVersion: { type: Number, required: true },

    formData: { type: mongoose.Schema.Types.Mixed, required: true },

    // Denormalized from formData via the config's roleMapping at submit time,
    // so area admins can be scoped with a plain query.
    district: { type: String, default: "", index: true },
    area: { type: String, default: "", index: true },
    applicantName: { type: String, default: "" },
    phone: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: null },

    // Area admin's physical-verification recommendation
    areaVerification: {
      comment: { type: String, default: null },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
      verifiedByName: { type: String, default: null },
      verifiedAt: { type: Date, default: null },
    },

    // Office-use comment by admin / super admin
    officeComment: {
      comment: { type: String, default: null },
      byName: { type: String, default: null },
      byRole: { type: String, default: null },
      at: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

submissionSchema.index({ formType: 1, district: 1, area: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
