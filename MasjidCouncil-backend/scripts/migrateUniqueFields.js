// One-off migration: move the hardcoded Aadhaar duplicate rule onto the generic
// per-field `unique` flag, and make the MCK affiliation number the duplicate key for
// Masjid Fund instead of Aadhaar.
//
//   Welfare Fund : Aadhaar field  -> unique, blocks "active", 4-year lock
//                  (exactly the behaviour roleMapping.aadhaarFieldId gave it)
//   Masjid Fund  : "എം സി കെ അഫിലിയേഷൻ നമ്പർ" -> unique, blocks "approved", no expiry
//                  and aadhaarFieldId is cleared, since one masjid gets one grant and
//                  the applicant's Aadhaar is not what identifies the masjid
//
// Then backfills uniqueKeys on existing submissions so old records take part in the
// duplicate check. Idempotent: safe to run more than once.
//
//   node scripts/migrateUniqueFields.js            # apply
//   node scripts/migrateUniqueFields.js --dry-run  # report only

require("dotenv").config();
const mongoose = require("mongoose");
const FormConfiguration = require("../models/formConfiguration");
const Submission = require("../models/submission");
const { normalizeKey } = require("../lib/validateSubmission");

const DRY_RUN = process.argv.includes("--dry-run");

// Matches the seeded label; the legacy schema calls the same thing mckAffiliation.
const AFFILIATION_LABEL_HINT = "അഫിലിയേഷൻ";

const findField = (config, predicate) => {
  for (const page of config.pages || []) {
    for (const field of page.fields || []) {
      if (predicate(field)) return field;
    }
  }
  return null;
};

const log = (...args) => console.log(DRY_RUN ? "[dry-run]" : "[migrate]", ...args);

const migrateWelfareFund = async () => {
  const config = await FormConfiguration.findOne({ formType: "welfarefund" });
  if (!config) {
    log("welfarefund: no config, skipped");
    return null;
  }

  const aadhaarId = config.roleMapping && config.roleMapping.aadhaarFieldId;
  if (aadhaarId === undefined || aadhaarId === null) {
    return log("welfarefund: no aadhaarFieldId mapped, nothing to move");
  }
  const field = findField(config, (f) => f.id === aadhaarId);
  if (!field) return log(`welfarefund: mapped aadhaar field #${aadhaarId} no longer exists`);

  if (field.unique && field.uniqueBlocks === "active" && field.uniqueLockYears === 4) {
    return log("welfarefund: already migrated");
  }

  const lockYears = Number(config.roleMapping.aadhaarLockYears);
  field.unique = true;
  field.required = true;
  field.uniqueBlocks = "active";
  field.uniqueLockYears = Number.isFinite(lockYears) && lockYears > 0 ? lockYears : 4;
  config.version += 1;
  if (!DRY_RUN) await config.save();
  log(`welfarefund: field #${field.id} "${field.label}" -> unique/active/${field.uniqueLockYears}y`);
  return config;
};

const migrateMosqueFund = async () => {
  const config = await FormConfiguration.findOne({ formType: "mosquefund" });
  if (!config) {
    log("mosquefund: no config, skipped");
    return null;
  }

  const field = findField(
    config,
    (f) => f.type === "text" && (f.label || "").includes(AFFILIATION_LABEL_HINT)
  );
  if (!field) {
    return log(`mosquefund: no field whose label contains "${AFFILIATION_LABEL_HINT}" — migrate by hand`);
  }

  const alreadyDone =
    field.unique &&
    field.uniqueBlocks === "approved" &&
    field.uniqueLockYears === null &&
    (config.roleMapping || {}).aadhaarFieldId == null;
  if (alreadyDone) return log("mosquefund: already migrated");

  field.unique = true;
  field.required = true;
  field.uniqueBlocks = "approved";
  field.uniqueLockYears = null;

  // The masjid is identified by its affiliation number, not by whoever filled the
  // form in, so the Aadhaar mapping goes. Its 12-digit format check went with the
  // mapping, so move that onto the field itself first — unmapping should stop the
  // Aadhaar being a duplicate key, not stop it being checked.
  const aadhaarId = config.roleMapping && config.roleMapping.aadhaarFieldId;
  if (aadhaarId !== undefined && aadhaarId !== null) {
    const aadhaarField = findField(config, (f) => f.id === aadhaarId);
    if (aadhaarField && !(aadhaarField.validation && aadhaarField.validation.pattern)) {
      aadhaarField.validation = {
        ...(aadhaarField.validation || {}),
        pattern: "^\\d{12}$",
        customMessage: "Aadhaar number must be exactly 12 digits",
      };
      log(`mosquefund: moved the 12-digit rule onto field #${aadhaarField.id}`);
    }
    config.roleMapping.aadhaarFieldId = null;
  }
  config.version += 1;
  if (!DRY_RUN) await config.save();
  log(`mosquefund: field #${field.id} "${field.label}" -> unique/approved/forever; aadhaarFieldId cleared`);
  return config;
};

// Existing submissions were stored before uniqueKeys existed. Rebuild them from the
// answers so a historical approved application still blocks a new duplicate.
const backfillSubmissions = async (touched = []) => {
  const stored = await FormConfiguration.find({});
  // In a dry run nothing was saved, so re-reading would report "no unique fields"
  // and hide the very work this is meant to preview. Prefer the in-memory copies.
  const configs = stored.map(
    (config) => touched.find((t) => t && t.formType === config.formType) || config
  );
  for (const config of configs) {
    const uniqueFields = [];
    for (const page of config.pages || []) {
      for (const field of page.fields || []) {
        if (field.unique) uniqueFields.push(field);
      }
    }
    if (uniqueFields.length === 0) {
      log(`${config.formType}: no unique fields, no backfill`);
      continue;
    }

    const submissions = await Submission.find({ formType: config.formType }).select(
      "formData uniqueKeys"
    );
    let updated = 0;
    for (const submission of submissions) {
      const keys = [];
      for (const field of uniqueFields) {
        const raw = (submission.formData || {})[`field_${field.id}`];
        if (raw === undefined || raw === null || String(raw).trim() === "") continue;
        keys.push({
          fieldId: field.id,
          value: normalizeKey(raw),
          blocks: field.uniqueBlocks === "active" ? "active" : "approved",
          lockYears: field.uniqueLockYears === undefined ? null : field.uniqueLockYears,
        });
      }
      // Spreading a mongoose subdocument yields its internals, not its fields, so
      // compare the plain shape or every re-run "changes" every record.
      const plain = (k) => ({
        fieldId: k.fieldId,
        value: k.value,
        blocks: k.blocks,
        lockYears: k.lockYears === undefined ? null : k.lockYears,
      });
      const before = JSON.stringify((submission.uniqueKeys || []).map(plain));
      const after = JSON.stringify(keys.map(plain));
      if (before === after) continue;
      submission.uniqueKeys = keys;
      if (!DRY_RUN) await submission.save();
      updated += 1;
    }
    log(`${config.formType}: backfilled ${updated} of ${submissions.length} submissions`);
  }
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const touched = [await migrateWelfareFund(), await migrateMosqueFund()];
    await backfillSubmissions(touched.filter(Boolean));
    log("done");
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
