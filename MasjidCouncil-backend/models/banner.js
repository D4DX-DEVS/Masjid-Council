const mongoose = require("mongoose");

// A promotional banner shown in the carousel on the public home page. The image is the whole
// banner — its copy is baked into the artwork — so the title only serves as the alt text and
// as the name the admin list shows.

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    key: { type: String, default: "" },
  },
  { _id: false }
);

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    image: { type: imageSchema, default: () => ({}) },
    // Optional narrower artwork for phones. A wide banner shrunk to 375px leaves its text
    // unreadable, so the council can upload a portrait cut; without one the desktop image is used.
    mobileImage: { type: imageSchema, default: () => ({}) },
    // Where a click on the banner goes. Empty means the banner is not a link. The route
    // handler only lets through http(s) URLs and site-relative paths.
    linkUrl: { type: String, default: "", trim: true, maxlength: 500 },
    openInNewTab: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bannerSchema.index({ enabled: 1, order: 1 });

module.exports = mongoose.model("Banner", bannerSchema);
