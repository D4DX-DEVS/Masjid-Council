// Imports the district-admin roster (district, username, password) from CSV.
// District admins are view-only: own district, decided submissions only.
// Idempotent: matches on username, so re-running re-syncs district/password.
// Run: node seedDistrictAdmins.js [path/to/districts.csv]
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Admin = require("./models/admin");
const MasterLocation = require("./models/masterLocation");

const DEFAULT_CSV = path.join(__dirname, "..", "MasjidCouncil-frontend", "districts-2026-08-21.csv");

// The roster is machine-generated: every field quoted, no embedded commas or quotes.
// ponytail: no csv library for that — swap to `csv-parse` if the export ever gets messy.
// The export carries a UTF-8 BOM, so strip it before the first quote.
const parseRow = (line) =>
  line.trim().replace(/^﻿/, "").replace(/^"/, "").replace(/"$/, "").split('","');

// Columns: #, District, State, Username, Password. State is informational only —
// scoping is on the district string, which is what submissions carry.
const readRoster = (file) =>
  fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .slice(1) // header
    .map(parseRow)
    .filter((cols) => cols.length >= 5)
    .map(([, district, , username, password]) => ({
      district: district.trim(),
      username: username.trim(),
      password: password.trim(),
    }))
    .filter((r) => r.username && r.password && r.district);

// phoneNumber used to be required+unique. District admins have none, so the index has
// to stay sparse and any explicit nulls have to go, or the second insert collides.
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

// Submissions carry the master-data district spelling ("ALAPUZHA"), the roster CSV
// carries the human one ("ALAPPUZHA"). District admins are scoped on the district
// string, so a spelling gap hides every application from them. Master data wins.
const masterDistricts = async () => {
  const districts = await MasterLocation.find({ type: "district" }).select("title").lean();
  return districts.map((d) => d.title.trim());
};

// Same district spelled slightly differently — compare on letters only.
const squash = (s) => s.toUpperCase().replace(/[^A-Z]/g, "");

// The gaps between the two spellings are a letter or two ("ALAPPUZHA"/"ALAPUZHA",
// "KASARAGOD"/"KASARGOD"), so a distance-2 match closes them. Distinct districts are
// much further apart than that ("KOZHIKODE" vs "KOZHIKODE CITY" is 5).
const MAX_DISTANCE = 2;
const distance = (a, b) => {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = row;
  }
  return prev[b.length];
};

// Nearest master title, but only when it is unambiguously nearest.
const nearest = (candidates, value) => {
  const scored = candidates
    .map((title) => ({ title, d: distance(squash(title), squash(value)) }))
    .filter((x) => x.d <= MAX_DISTANCE)
    .sort((x, y) => x.d - y.d);
  if (scored.length === 0) return null;
  if (scored.length > 1 && scored[0].d === scored[1].d) return null; // tie — do not guess
  return scored[0].title;
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

  const master = await masterDistricts();

  let created = 0;
  let updated = 0;
  let realigned = 0;
  const unmatched = [];

  for (const row of roster) {
    const exact = master.find((title) => title.toUpperCase() === row.district.toUpperCase());
    const matched =
      exact ||
      master.find((title) => squash(title) === squash(row.district)) ||
      nearest(master, row.district);

    if (!matched) {
      // Out-of-state districts (Bangalore, Chennai…) have no master entry. Keep the CSV
      // spelling — submissions from there carry the same string.
      unmatched.push(`${row.username} (${row.district})`);
    } else if (matched !== row.district) {
      console.log(`${row.username}: district "${row.district}" -> "${matched}" (master data)`);
      row.district = matched;
      realigned++;
    }

    // .save() (not updateOne) so the pre-save hook hashes the password.
    const admin = (await Admin.findOne({ username: row.username })) || new Admin();
    const isNew = admin.isNew;

    admin.username = row.username;
    admin.district = row.district;
    admin.area = undefined;
    admin.role = "districtadmin";
    admin.password = row.password;
    admin.phoneNumber = undefined;

    await admin.save();
    if (isNew) created++;
    else updated++;
  }

  console.log(
    `Done — ${created} created, ${updated} updated, ${realigned} districts realigned to master data`
  );
  if (unmatched.length > 0) {
    console.log(`No master-data district (kept CSV spelling): ${unmatched.join(", ")}`);
  }
  await mongoose.disconnect();
};

seed().catch((error) => {
  console.error("District admin seed failed:", error.message);
  process.exit(1);
});
