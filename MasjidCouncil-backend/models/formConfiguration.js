const mongoose = require("mongoose");

// Admin-configurable dynamic form definition. One document per formType slug.
// Shape follows FORM_CONFIGURATION_GUIDE.md, minus scoring/themes/drafts (not needed yet).

const conditionalLogicSchema = new mongoose.Schema(
  {
    field: { type: Number, required: true }, // field id to watch
    operator: {
      type: String,
      enum: [
        "equals",
        "not_equals",
        "contains",
        "not_contains",
        "greater_than",
        "less_than",
        "is_empty",
        "is_not_empty",
      ],
      required: true,
    },
    value: { type: String, default: "" },
    action: {
      type: String,
      enum: ["show", "hide", "require", "optional"],
      default: "show",
    },
  },
  { _id: false }
);

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "phone",
  "email",
  "date",
  "select",
  "radio",
  "checkbox",
  "multiselect",
  "yesno",
  "file",
  "row",
  "title",
  "group",
  "html",
];

const fieldSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true }, // unique across all pages of the form
    label: { type: String, required: true, trim: true, maxlength: 300 },
    type: { type: String, enum: FIELD_TYPES, required: true },
    required: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    placeholder: { type: String, default: "", maxlength: 500 },
    helpText: { type: String, default: "", maxlength: 1000 },
    options: { type: [String], default: undefined },
    validation: {
      pattern: String,
      minLength: Number,
      maxLength: Number,
      min: Number,
      max: Number,
      customMessage: String,
    },
    // row (table) type
    columns: Number,
    columnTitles: { type: [String], default: undefined },
    rows: Number,
    rowTitles: { type: [String], default: undefined },
    firstColumnHeader: String,
    // free-grow table: user can add rows on the public form
    allowAddRows: { type: Boolean, default: true },
    conditionalLogic: { type: conditionalLogicSchema, default: undefined },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 1000 },
    order: { type: Number, default: 0 },
    fields: { type: [fieldSchema], default: [] },
    conditionalLogic: { type: conditionalLogicSchema, default: undefined },
  },
  { _id: false }
);

const formConfigurationSchema = new mongoose.Schema(
  {
    formType: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: { type: String, required: true, maxlength: 300 },
    description: { type: String, default: "", maxlength: 2000 },

    enabled: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    version: { type: Number, default: 1 },

    pages: { type: [pageSchema], default: [] },
    instructions: {
      type: [
        new mongoose.Schema(
          {
            id: { type: Number, required: true },
            text: { type: String, required: true, maxlength: 500 },
            order: { type: Number, default: 0 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    // Which field ids hold the values used for area-admin scoping and list display.
    roleMapping: {
      districtFieldId: { type: Number, default: null },
      areaFieldId: { type: Number, default: null },
      phoneFieldId: { type: Number, default: null },
      nameFieldId: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

formConfigurationSchema.statics.FIELD_TYPES = FIELD_TYPES;

module.exports = mongoose.model("FormConfiguration", formConfigurationSchema);
