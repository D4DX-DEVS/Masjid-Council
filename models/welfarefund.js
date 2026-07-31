const mongoose = require("mongoose");

const welfarefundSchema = new mongoose.Schema(
  {
    // Mosque Details
    mosqueName: {
      type: String,
      required: true,
    },
    mckAffiliation: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },

    // Management Details
    committeePerson: {
      type: String,
      required: true,
    },
    managementType: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    whatsapp: {
      type: String,
    },
    presidentPhone: {
      type: String,
    },
    presidentChairman: {
      type: String,
    },

    // Jamaat Details
    jammatDetails: {
      type: String,
    },
    area: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },

    // Application Details
    applicantDetails: {
      type: String,
      required: true,
    },
    chairmanDesignation: {
      type: String,
    },
    salary: {
      type: Number,
    },

    // Help Details
    helpPurpose: {
      type: String,
      required: true,
      enum: ["house", "marriage", "medical", "education"],
    },
    needDescription: {
      type: String,
      required: true,
    },
    expectedExpense: {
      type: Number,
      required: true,
    },
    ownContribution: {
      type: Number,
    },
    previousHelp: {
      type: String,
      enum: ["yes", "no"],
    },

    // Mosque Official Details
    mosquePresident: {
      type: String,
      required: true,
    },
    mosquePhone: {
      type: String,
      required: true,
    },

    // Application Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },

    // Timestamps
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("welfarefund", welfarefundSchema);
