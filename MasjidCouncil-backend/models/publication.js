const mongoose = require("mongoose");

// A publication is a book/guide shown on the public home page as a card. Opening the card
// leads to a reader page whose side panel lists the chapters below.
//
// Chapter bodies are HTML produced by the admin's rich-text editor. They are sanitized in
// the route handler before they ever reach this model, so whatever is stored here is safe
// to render directly — see lib/sanitizeRichText.js.

const chapterSchema = new mongoose.Schema(
  {
    // Unique within the parent publication; the editor uses it as a React key and the
    // reorder/delete handlers address chapters by it.
    id: { type: Number, required: true },
    // URL segment: /resources/<publication slug>/<chapter slug>
    slug: { type: String, required: true, trim: true, maxlength: 200 },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    order: { type: Number, default: 0 },
    bodyHtml: { type: String, default: "" },
  },
  { _id: false }
);

const publicationSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    titleMalayalam: { type: String, default: "", trim: true, maxlength: 300 },
    subtitle: { type: String, default: "", trim: true, maxlength: 300 },
    // Blurb shown on the home card, not in the reader.
    description: { type: String, default: "", maxlength: 1000 },
    coverImage: {
      url: { type: String, default: "" },
      key: { type: String, default: "" },
    },
    order: { type: Number, default: 0 },

    enabled: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },

    chapters: { type: [chapterSchema], default: [] },
  },
  { timestamps: true }
);

// The public list and the reader both filter on these three together.
publicationSchema.index({ isPublished: 1, enabled: 1, order: 1 });

module.exports = mongoose.model("Publication", publicationSchema);
