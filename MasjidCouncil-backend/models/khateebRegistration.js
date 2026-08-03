const mongoose = require("mongoose");

const khateebRegistrationSchema = new mongoose.Schema({
  // Personal Details
  fullName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },

  // Masjid Details
  masjidName: {
    type: String,
    required: true,
  },
  mahallu: {
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
  khutbaRegular: {
    type: String,
    enum: ["regular", "occasional"],
    required: true,
  },

  // Movement affiliation
  movementRelation: {
    type: String,
    enum: ["rukn", "karkun", "active_associate", "none"],
    required: true,
  },

  // Participation
  attending: {
    type: String,
    enum: ["yes", "no"],
    required: true,
  },
  notAttendingReason: {
    type: String,
    required: false,
  },

  // Payment — retired from the form; kept optional so existing records keep their value.
  feePaid: {
    type: String,
    enum: ["yes", "no"],
    required: false,
  },

  // Application Status
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "under_review"],
    default: "pending",
  },
  rejectionReason: {
    type: String,
    required: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

khateebRegistrationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("khateebRegistration", khateebRegistrationSchema);
