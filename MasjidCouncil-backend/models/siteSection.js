const mongoose = require("mongoose");

// Editable copy for a block of the public site, keyed by section name. Keeping the heading
// in the database is what lets the council rename the publications section without a
// redeploy — the route path stays fixed, only the visible wording changes.

const siteSectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 60,
    },
    heading: { type: String, default: "", trim: true, maxlength: 200 },
    subtitle: { type: String, default: "", trim: true, maxlength: 400 },
    // Label on each card's button, e.g. "വായിക്കുക".
    ctaLabel: { type: String, default: "", trim: true, maxlength: 60 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSection", siteSectionSchema);
