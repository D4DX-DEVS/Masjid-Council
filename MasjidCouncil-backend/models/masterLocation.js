const mongoose = require("mongoose");

// ponytail: one collection for district/area/unit instead of three near-identical models.
// parent = district for an area, area for a unit, null for a district.
const masterLocationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["district", "area", "unit"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterLocation",
      default: null,
      index: true,
    },
    // id of the row in the external unit API, used to re-import without duplicating
    externalId: { type: String, default: null, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

masterLocationSchema.index({ type: 1, parent: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("MasterLocation", masterLocationSchema);
