# Dynamic Form System + Area Admin — Design Spec

Date: 2026-08-11
Status: Approved by user

## Goal

1. Replace all hardcoded public application forms with an admin-configurable dynamic form system (per `MasjidCouncil-frontend/FORM_CONFIGURATION_GUIDE.md`, simplified).
2. Add a new **Area Admin** role: sees only submissions from their own district+area, adds a physical-verification recommendation comment (ജമാഅത്തെ ഇസ്ലാമി ഏരിയാ പ്രസിഡന്റിന്റെ ശുപാർശ). Admin/super admin see it and can add an optional office comment (ഓഫീസ് ഉപയോഗത്തിന്).
3. Seed the new IMF and Mosque Fund forms from the PDFs (`IMF Application New-1.md`, `mf application.md`) including the currently-missing fields (IMF page 3: employee details, previous-mosques table, family members table, permanent address, etc.).

## Existing system (facts)

- Backend: Express + Mongoose. Models: `welfarefund` (= IMF form, posted by `MedicalAidForm.jsx`), `mosqueFund`, `mosqueAffiliation`, `khateebRegistration`, `admin`, `masterLocation` (district → area → unit tree).
- Auth: JWT. Roles in token: `admin`, `superadmin`. `Admin` model already has `district` + `area` strings.
- Frontend: React (Vite), pages per form + per-role list/detail pages.

## Form types

Slugs: `welfarefund` (IMF), `mosquefund`, `affiliation`, `khateeb`. One published FormConfiguration per slug.

## Phase 1 — Dynamic form core

### FormConfiguration model (new)

Per the guide, simplified:

- `formType` (slug, unique), `title`, `description`
- `enabled`, `isPublished`, `publishedAt`, `version` (increments each save)
- `pages[]`: `{ id, title, description, order, fields[], conditionalLogic? }`
- `fields[]`: `{ id (int, unique across form), label, type, required, enabled, placeholder, helpText, options[], validation {pattern,minLength,maxLength,min,max,customMessage}, columns, columnTitles[], rows, rowTitles[], firstColumnHeader, conditionalLogic {field, operator, value, action} }`
- Field types: `text, textarea, number, phone, email, date, select, radio, checkbox, multiselect, yesno, file, row, title, group, html`
- Conditional operators: `equals, not_equals, contains, not_contains, greater_than, less_than, is_empty, is_not_empty`; actions `show|hide|require|optional`
- `instructions[]`: `{ id, text, order }` (pre-form instructions page)
- `roleMapping`: `{ districtFieldId, areaFieldId, phoneFieldId }` — which fields hold district/area/phone. District/area fields render options from MasterLocation (area filtered by chosen district).
- Skipped (YAGNI): scoring, themes, drafts, renewal forms, duplicate detection, analytics, multi-tenancy.

### Submission model (new)

- `formType`, `formVersion`
- `formData`: Mixed — `{ "field_<id>": value }` (row type = 2D string array; file = uploaded URL)
- `district`, `area` — denormalized at submit time via roleMapping (for scoping/filtering)
- `status`: `pending | under_review | approved | rejected`; `rejectionReason`
- `areaVerification`: `{ comment, verifiedBy (Admin ref), verifiedByName, verifiedAt }` — null until area admin verifies
- `officeComment`: `{ comment, by, byName, byRole, at }` — optional, admin/super admin
- timestamps

### API (new routes `formConfigRoutes.js`, `submissionRoutes.js`)

- `GET /api/form-config/:formType` — public (published only) & admin (full)
- `PUT /api/form-config/:formType` — super admin: create/update (version++)
- `PATCH /api/form-config/:formType/publish` — super admin
- `POST /api/submissions/:formType` — public submit; server validates required/enabled fields against published config; resolves district/area
- `GET /api/submissions/:formType` — admin/super admin list (filters: status, district, area, search)
- `GET /api/submissions/:formType/:id` — detail
- `PATCH /api/submissions/:formType/:id/status` — admin/super admin approve/reject/under_review
- `PATCH /api/submissions/:formType/:id/office-comment` — admin/super admin
- File upload reuses existing upload route/CDN pattern.

### Form Builder UI (super admin)

- New page `FormBuilder.jsx`: form-type picker → pages tabs, add/edit/delete/reorder fields, field editor panel (label, type, required, options one-per-line, validation, conditional logic, table config), instructions editor, roleMapping picker, live preview tab, save + publish buttons.

## Phase 2 — Replace public forms + admin views

- `DynamicForm.jsx` renderer: fetch published config, render multi-page with per-page validation, conditional logic, MasterLocation-driven district/area selects, file uploads, row-type tables (add-row support), submit → `/api/submissions/:formType`. Malayalam labels come from config content.
- Routes: existing public form URLs point to renderer with the matching formType (old form pages retired).
- Generic `SubmissionListAdmin.jsx` + `SubmissionDetails.jsx` (admin & super admin variants by route/permission): list columns = first few text fields + district/area/status; detail = label→value walk of config incl. tables and file links; status actions as today.
- Old collections/detail pages untouched — old records remain readable where they are today.
- Seed script (`seedFormConfigs.js`) creates the 4 configs from the PDFs, IMF including page-3 employee-detail fields and both `row` tables; Mosque Fund per its PDF; affiliation/khateeb mirroring current hardcoded fields.

## Phase 3 — Area admin

- `Admin` model: add `role: { type: String, enum: ['admin','areaadmin'], default: 'admin' }`. JWT includes role.
- Super admin admin-management UI: create/edit area admins (username, phone, password, district, area from MasterLocation).
- Auth middleware: `authenticateAreaAdmin` (role `areaadmin`); existing `authenticateAdmin` continues to accept `admin`/`superadmin` only.
- Area admin routes:
  - `GET /api/area/submissions` — all form types, filtered `district == admin.district && area == admin.area`
  - `GET /api/area/submissions/:formType/:id` — only if in their area
  - `PATCH /api/area/submissions/:formType/:id/verify` — body `{ comment }` → sets `areaVerification`; comment editable by same area admin; no status power
- Frontend: `AreaAdminLogin` (or reuse AdminLogin with role routing), `AreaAdminDashboard` (list, filters by form type/status), read-only detail + verification comment box.
- Admin/super admin detail pages: show area verification block (name, date, comment) and office comment editor.

## Error handling

- Public route with unpublished/disabled form → 404-style "form unavailable" screen.
- Submit validated server-side against the **published** config version; mismatched/missing required fields → 400 with field labels.
- Area routes always re-filter by the authenticated admin's district/area server-side (never trust client).

## Testing

- Backend (jest or node test, minimal): config CRUD + version increment; submission required-field validation + district/area denormalization; area scoping filter (other-area submission → 404).
- Manual E2E checklist per phase.

## Out of scope

Scoring, drafts, renewal forms, analytics dashboards, migration of old submissions, email notifications beyond existing behavior.
