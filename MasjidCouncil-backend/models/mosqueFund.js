const mongoose = require("mongoose");

const mosqueFundSchema = new mongoose.Schema({
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
  managementType: {
    type: String,
    required: false,
  },
  presidentSecretary: {
    type: String,
    required: false,
  },
  jamathIslami: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: false,
  },
  district: {
    type: String,
    required: true,
  },

  // Help Status
  mckFundService: {
    type: String,
    enum: ["yes", "no"],
    required: true,
  },
  previousHelp: {
    type: String,
    enum: ["yes", "no"],
    required: true,
  },

  // Current Help Details
  helpPurpose: {
    type: String,
    required: true,
  },
  needDescription: {
    type: String,
    required: true,
  },
  expectedExpense: {
    type: String,
    required: true,
  },
  ownContribution: {
    type: String,
    required: false,
  },

  // Contact Details
  mosqueOfficialName: {
    type: String,
    required: true,
  },
  mosqueOfficialPhone: {
    type: String,
    required: true,
  },
  whatsappNumber: {
    type: String,
    required: false,
  },

  // Bank Details
  bankPassbook: {
    type: String,
    required: false,
  },
  fullEstimate: {
    type: String,
    required: false,
  },

  // Declarations
  declaration1: {
    type: Boolean,
    required: true,
  },
  declaration2: {
    type: Boolean,
    required: true,
  },

  // Application Status
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "under_review"],
    default: "pending",
  },
  rejectionReason: {
    type: String,
    default: null,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
mosqueFundSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("mosqueFund", mosqueFundSchema);
