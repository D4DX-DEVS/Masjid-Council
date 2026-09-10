# Admin CRUD, area-gate removal, per-field uniqueness — design

Date: 2026-09-10
Scope: the dynamic `Submission` system only. Legacy `mosqueFund` / `welfarefund` /
`mosqueAffiliation` / `khateebRegistration` models and their `SuperAdmin*Details`
pages are out of scope — their public forms are retired (App.jsx:8).

## 1. Area verification no longer hides applications

Today `areaGate()` (submissionRoutes.js:18-26) removes any gated-form submission
without `areaVerification.comment` from the state-admin and super-admin lists, and
`verifiedOnly()` (:30-31) blocks every write on one. Area verification is not an
approval — it is a single comment field, so a slow area admin silently freezes an
application where no one can see it.

Change: state admin and super admin see every submission. Unverified ones carry an
amber "ഏരിയ വെരിഫിക്കേഷൻ ബാക്കി" tag in the list and a banner on the detail page,
and both roles may approve / reject / pay / comment without waiting (full override).

- `areaGate` returns `{}`; `verifiedOnly` and `GATE_MATCH` are deleted.
- `?unverified=1` (super-admin-only escape hatch) becomes `?verification=pending|done`,
  available to both roles.
- `VerifyPill` / `StatusPill` move out of SubmissionList.jsx into
  `components/StatusBadge.jsx`; seven near-duplicate `getStatusDisplay` helpers exist
  across the app and this is the shared home for the next one.

Accepted consequence: district admins see decided submissions, so a submission
approved without area verification now reaches them. That was previously impossible
because approval itself was gated.

## 2. Full CRUD on a submission

State admin and super admin can edit any answer, replace or remove any attachment,
and delete the record. Every destructive step goes through the existing Radix
`ConfirmDialog`.

- `PATCH /:formType/:id/form-data` re-runs `validateSubmission` so the denormalized
  district / area / name / phone / amount / uniqueKeys stay consistent with the
  answers. File-typed fields must pass `isUploadedDocumentUrl`.
- `DELETE /:formType/:id` hard-deletes. Objects in Spaces are left in place —
  cascading a bucket delete off a record delete is a bigger blast radius than the
  storage it saves.
- `POST /upload-submission-file` is a new admin upload route rather than widening
  `upload-admin-files`, which uploadRoutes.js:171 explicitly asks callers not to do.
- Edits are stamped with `lastEditedByName` / `lastEditedAt` and shown on the page.
  Not a full history: the point is that an unexplained change is visible, not that
  every prior value is recoverable.
- `EditFieldDialog` reuses `DynamicFieldRenderer` so an edited field gets the same
  widget the applicant saw. Needs `@radix-ui/react-dialog` — only `react-alert-dialog`
  is installed, and an edit form is not an alert.

## 3. Per-field uniqueness replaces the hardcoded Aadhaar rule

`roleMapping.aadhaarFieldId` + a hardcoded `/^\d{12}$/` (validateSubmission.js:176-185)
is the only uniqueness mechanism. Mosque Fund needs the MCK affiliation number to be
the unique key instead, and an `MAF…` number is not twelve digits.

Field definitions gain `unique`, `uniqueBlocks` (`approved` | `active`) and
`uniqueLockYears` (`null` = forever). Submissions gain `uniqueKeys: [{fieldId, value}]`
with a compound index. Format validation reads the field's own `validation.pattern`.

- `approved` blocks a new submission only when an approved record holds the value.
- `active` also blocks while a pending / under-review record holds it — today's
  Aadhaar behaviour, kept for Welfare Fund.

Migration (`scripts/migrateUniqueFields.js`, idempotent, bumps `config.version`,
modelled on `addAadhaarField.js`): Welfare Fund Aadhaar → unique / active / 4 years;
Mosque Fund field #2 (എം സി കെ അഫിലിയേഷൻ നമ്പർ) → unique / approved / forever, and
`aadhaarFieldId` cleared for that form. Existing rows get `uniqueKeys` backfilled.

`aadhaarNumber` stays on the model and keeps being written — dropping a denormalized
column is not worth the migration risk — but it no longer drives any rule.

## 4. District admins stop seeing review notes

`officeComment` is already stripped server-side (districtRoutes.js:15). The area
president's recommendation is not, and is rendered at DistrictSubmissionDetails.jsx:120-137.

`HIDE` becomes `-officeComment -areaVerification` so neither leaves the server, and
the JSX block goes. The decision card (approved amount and date) stays — it is why a
district admin opens the page at all.

## 5. Printing with or without attachments — already built

`SubmissionAttachments` with `selectable` (SubmissionDetails.jsx:282) already gives
per-file print checkboxes and a bulk toggle, defaulting to all files included, for
both the browser print and the PDF export. No work.

Known defect, out of scope: `usePdfExport` rasterises the page into one tall PNG and
slices it by A4 height, so `break-inside-avoid` has no effect in the PDF and an
attachment image can be cut across a page boundary.

## Order

4, then 1, then 3, then 2 — cheapest first, and the two that carry risk (a migration,
a new dependency) last. `validateSubmission` changes are test-first.
