// Imports the area-admin roster (area, district, username, password) from CSV.
// Idempotent: matches on username, so re-running re-syncs district/area/password.
// Run: node seedAreaAdmins.js [path/to/areas.csv]
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Admin = require("./models/admin");

const DEFAULT_CSV = path.join(__dirname, "..", "MasjidCouncil-frontend", "areas-2026-08-12.csv");

// The roster is machine-generated: every field quoted, no embedded commas or quotes.
// ponytail: no csv library for that — swap to `csv-parse` if the export ever gets messy.
const parseRow = (line) => line.trim().replace(/^"/, "").replace(/"$/, "").split('","');

const readRoster = (file) =>
  fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .slice(1) // header
    .map(parseRow)
    .filter((cols) => cols.length >= 5)
    .map(([, area, district, username, password]) => ({
      area: area.trim(),
      district: district.trim(),
      username: username.trim(),
      password: password.trim(),
    }))
    .filter((r) => r.username && r.password && r.district && r.area);

// phoneNumber used to be required+unique. Area admins have none, so the index has
// to become sparse and any explicit nulls have to go, or the second insert collides.
const relaxPhoneIndex = async () => {
  await Admin.collection.updateMany({ phoneNumber: null }, { $unset: { phoneNumber: "" } });

  const existing = await Admin.collection.indexes();
  const phoneIndex = existing.find((i) => i.name === "phoneNumber_1");
  if (phoneIndex && !phoneIndex.sparse) {
    await Admin.collection.dropIndex("phoneNumber_1");
    console.log("dropped non-sparse phoneNumber index");
  }
  await Admin.syncIndexes();
};

const seed = async () => {
  const file = process.argv[2] || DEFAULT_CSV;
  if (!fs.existsSync(file)) {
    throw new Error(`CSV not found: ${file}`);
  }

  const roster = readRoster(file);
  if (roster.length === 0) throw new Error("CSV parsed to 0 usable rows");

  const duplicates = roster
    .map((r) => r.username)
    .filter((u, i, all) => all.indexOf(u) !== i);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate usernames in CSV: ${[...new Set(duplicates)].join(", ")}`);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB — ${roster.length} rows from ${path.basename(file)}`);

  await relaxPhoneIndex();

  let created = 0;
  let updated = 0;

  for (const row of roster) {
    // .save() (not updateOne) so the pre-save hook hashes the password.
    const admin = (await Admin.findOne({ username: row.username })) || new Admin();
    const isNew = admin.isNew;

    admin.username = row.username;
    admin.district = row.district;
    admin.area = row.area;
    admin.role = "areaadmin";
    admin.password = row.password;
    admin.phoneNumber = undefined;

    await admin.save();
    if (isNew) created++;
    else updated++;
  }

  console.log(`Done — ${created} created, ${updated} updated`);
  await mongoose.disconnect();
};

seed().catch((error) => {
  console.error("Area admin seed failed:", error.message);
  process.exit(1);
});
