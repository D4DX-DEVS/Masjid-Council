// Unique indexes carried over from the MongoDB collections (read off the live cluster with
// collection.indexes() at migration time). db/schema.sql creates the matching D1 indexes;
// this map lets the driver turn a D1 "UNIQUE constraint failed: index '<name>'" back into a
// Mongo-shaped duplicate-key error with the right keyPattern.
//
// sparse: true  -> documents without the field never collide (SQLite NULLs are distinct).
// sparse: false -> a missing value counts as a value, like Mongo indexing it as null.

const uniqueIndexes = {
  admins: [
    { name: "admins_username_1", key: { username: 1 }, sparse: false },
    { name: "admins_phoneNumber_1", key: { phoneNumber: 1 }, sparse: true },
  ],
  formconfigurations: [{ name: "formconfigurations_formType_1", key: { formType: 1 }, sparse: false }],
  masterlocations: [
    { name: "masterlocations_type_1_parent_1_title_1", key: { type: 1, parent: 1, title: 1 }, sparse: false },
  ],
  mosqueaffiliations: [
    { name: "mosqueaffiliations_affiliationNumber_1", key: { affiliationNumber: 1 }, sparse: true },
    { name: "mosqueaffiliations_trackingId_1", key: { trackingId: 1 }, sparse: true },
  ],
  mosquefunds: [{ name: "mosquefunds_trackingId_1", key: { trackingId: 1 }, sparse: true }],
  publications: [{ name: "publications_slug_1", key: { slug: 1 }, sparse: false }],
  settings: [{ name: "settings_key_1", key: { key: 1 }, sparse: false }],
  sitesections: [{ name: "sitesections_key_1", key: { key: 1 }, sparse: false }],
  submissions: [{ name: "submissions_referenceNumber_1", key: { referenceNumber: 1 }, sparse: true }],
  welfarefunds: [{ name: "welfarefunds_trackingId_1", key: { trackingId: 1 }, sparse: true }],
};

// ObjectId-typed index fields are stored as {"$oid": "..."} in relaxed EJSON.
const objectIdFields = { masterlocations: ["parent"] };

const collections = [
  "admins",
  "banners",
  "formconfigurations",
  "khateebregistrations",
  "masterlocations",
  "mosqueaffiliations",
  "mosquefunds",
  "publications",
  "settings",
  "sitesections",
  "submissions",
  "welfarefunds",
];

module.exports = { uniqueIndexes, objectIdFields, collections };
