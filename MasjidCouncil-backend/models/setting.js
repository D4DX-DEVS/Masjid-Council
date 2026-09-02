const mongoose = require("mongoose");

// Generic key/value store for small pieces of app configuration that the super admin edits
// at runtime. Deliberately one collection rather than one per setting: the Atlas cluster this
// project shares is close to its 500-collection ceiling, and a dedicated collection per flag
// would spend that budget for no benefit.
//
// `value` is Mixed, so every reader is responsible for validating the shape it expects —
// see lib/featureAccess.js for the admin feature flags.

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 60,
    },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
