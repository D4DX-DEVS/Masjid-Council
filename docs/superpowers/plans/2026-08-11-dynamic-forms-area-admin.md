# Dynamic Forms + Area Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin-configurable dynamic forms replacing all 4 hardcoded public forms, plus a new area-admin role that verifies own-area submissions with a recommendation comment.

**Architecture:** New `FormConfiguration` (per formType slug) + `Submission` (formData map, denormalized district/area) Mongoose models; new `formConfigRoutes`/`submissionRoutes`/`areaRoutes` Express routers; React `FormBuilder` (super admin), `DynamicForm` public renderer, generic submission list/detail pages, and area-admin dashboard. Old collections and detail pages stay untouched for old records.

**Tech Stack:** Express + Mongoose (CommonJS), JWT auth, React 18 + react-router (Vite, .jsx, Tailwind classes as in existing pages), DO Spaces upload route (existing).

## Global Constraints

- Backend files: CommonJS (`require`), match existing `{ success, message, data }` response shape.
- Field IDs: plain integers unique across all pages of a form (per FORM_CONFIGURATION_GUIDE.md).
- Form type slugs: `welfarefund`, `mosquefund`, `affiliation`, `khateeb`.
- Area routes must re-filter by the authenticated admin's own district+area server-side.
- Old data untouched; no migrations.
- Roles: `admin`, `areaadmin` (Admin collection), `superadmin` (env-based). `authenticateAdmin` keeps rejecting `areaadmin`.

---

### Task 1: Models — FormConfiguration + Submission

**Files:**
- Create: `MasjidCouncil-backend/models/formConfiguration.js`
- Create: `MasjidCouncil-backend/models/submission.js`

**Interfaces (Produces):**
- `FormConfiguration` model: `formType` (unique slug), `title`, `description`, `enabled`, `isPublished`, `publishedAt`, `version`, `pages[] {id,title,description,order,fields[],conditionalLogic}`, fields per spec, `instructions[]`, `roleMapping {districtFieldId, areaFieldId, phoneFieldId}`.
- `Submission` model: `formType`, `formVersion`, `formData` (Mixed), `district`, `area`, `applicantName`, `status` enum `pending|under_review|approved|rejected`, `rejectionReason`, `areaVerification {comment, verifiedBy, verifiedByName, verifiedAt}`, `officeComment {comment, byName, byRole, at}`, timestamps.

Steps: write both models (formData via Mixed), commit.

### Task 2: Submission validation lib + check

**Files:**
- Create: `MasjidCouncil-backend/lib/validateSubmission.js`
- Create: `MasjidCouncil-backend/lib/validateSubmission.test.js` (node:test, `node --test lib/`)

**Interfaces (Produces):**
- `validateSubmission(config, formData) -> { errors: string[], district, area, applicantName }` — checks required+enabled fields honoring conditionalLogic show/hide/require, resolves district/area/name via `config.roleMapping`.

Steps: failing test (missing required field label in errors; conditional hidden field not required; district/area resolved), implement, pass, commit.

### Task 3: Form config routes

**Files:**
- Create: `MasjidCouncil-backend/routes/formConfigRoutes.js`
- Modify: `MasjidCouncil-backend/server.js` (mount `/api/form-config`)

**Interfaces (Produces):**
- `GET /api/form-config/:formType` — public: published+enabled only, else 404 `{available:false}`.
- `GET /api/form-config/:formType/admin` — superadmin: full doc or `{hasConfiguration:false}`.
- `PUT /api/form-config/:formType` — superadmin: upsert, `version` +1 each save.
- `PATCH /api/form-config/:formType/publish` — superadmin: body `{isPublished}`.
- `GET /api/form-config` — superadmin: list all configs (summary).

### Task 4: Submission routes

**Files:**
- Create: `MasjidCouncil-backend/routes/submissionRoutes.js`
- Modify: `MasjidCouncil-backend/server.js` (mount `/api/submissions`, also mount `uploadRoutes` under `/api/submissions`)

**Interfaces (Produces):**
- `POST /api/submissions/:formType` — public; validates against published config via `validateSubmission`; 400 with `errors`; stores denormalized district/area/applicantName.
- `GET /api/submissions/:formType` — `authenticateAdmin`; query `status`, `district`, `area`, `search`; sorted newest first.
- `GET /api/submissions/:formType/:id` — `authenticateAdmin`.
- `PATCH /api/submissions/:formType/:id/status` — `authenticateAdmin`; status enum + rejectionReason required when rejecting.
- `PATCH /api/submissions/:formType/:id/office-comment` — `authenticateAdmin`; body `{comment}` → `officeComment {comment, byName, byRole, at}`.

### Task 5: Area admin backend

**Files:**
- Modify: `MasjidCouncil-backend/models/admin.js` (add `role` enum `['admin','areaadmin']` default `'admin'`)
- Modify: `MasjidCouncil-backend/routes/superAdminRoutes.js` (login token carries `role: admin.role`; create/update accept `role`; areaadmin requires district+area)
- Modify: `MasjidCouncil-backend/middleware/auth.js` (add `authenticateAreaAdmin`; `authenticateAdmin` explicitly rejects `areaadmin`)
- Create: `MasjidCouncil-backend/routes/areaRoutes.js`
- Modify: `MasjidCouncil-backend/server.js` (mount `/api/area`)

**Interfaces (Produces):**
- `GET /api/area/submissions?formType=&status=` — areaadmin; always filtered `{district: admin.district, area: admin.area}`.
- `GET /api/area/submissions/:id` — areaadmin; 404 if outside own area.
- `PATCH /api/area/submissions/:id/verify` — body `{comment}` → `areaVerification` set/updated; no status change ability.

### Task 6: Seed form configs

**Files:**
- Create: `MasjidCouncil-backend/seedFormConfigs.js` (run: `node seedFormConfigs.js`)

Seeds 4 configs (skip if one already exists for a slug): `welfarefund` from `IMF Application New-1.md` incl. page-3 employee details + previous-mosques `row` table + family-members `row` table; `mosquefund` from `mf application.md`; `affiliation` + `khateeb` mirroring current hardcoded form fields. Each sets `roleMapping` to its district/area/phone field ids, `isPublished: true`.

### Task 7: FormBuilder page (super admin)

**Files:**
- Create: `MasjidCouncil-frontend/src/pages/FormBuilder.jsx`
- Modify: `MasjidCouncil-frontend/src/App.jsx` (route `/superadmin-form-builder`), `SuperAdminDashboard.jsx` (link)

Form-type picker; pages tabs (add/rename/delete/reorder); field list with inline label/type/required; expandable editor (placeholder, helpText, options textarea one-per-line, validation, table rows/cols/titles, conditional logic dropdowns); instructions editor; roleMapping selects; preview tab reusing renderer components; Save (PUT) + Publish (PATCH). Auth: superadmin token from localStorage as existing superadmin pages do.

### Task 8: DynamicForm public renderer

**Files:**
- Create: `MasjidCouncil-frontend/src/pages/DynamicForm.jsx`
- Create: `MasjidCouncil-frontend/src/components/DynamicFieldRenderer.jsx` (shared with builder preview)
- Modify: `MasjidCouncil-frontend/src/App.jsx` (routes `/apply/:formType`; point `/medical-aid`, `/mosque-fund`, `/affiliation`, `/khateeb-registration` at DynamicForm with fixed formType)

Instructions screen → multi-page form; per-page required validation; conditionalLogic evaluation; district/area selects from `/api/master-data` (area filtered by district via roleMapping); file fields upload via `/api/submissions/upload-files` then store cdnUrl; `row` tables with add-row; submit POST `/api/submissions/:formType`; unavailable-form screen.

### Task 9: Generic submission list + detail (admin & super admin)

**Files:**
- Create: `MasjidCouncil-frontend/src/pages/SubmissionList.jsx` (prop `role`)
- Create: `MasjidCouncil-frontend/src/pages/SubmissionDetails.jsx` (prop `role`)
- Modify: `MasjidCouncil-frontend/src/App.jsx` (routes `/submissions/:formType` admin, `/superadmin-submissions/:formType`, details routes), `AdminHome.jsx` + `SuperAdminDashboard.jsx` (links)

List: fetch config + submissions, columns = applicantName/district/area/status/date, filters. Details: label→value walk of config pages (tables rendered as tables, files as links), area verification block (ജമാഅത്തെ ഇസ്ലാമി ഏരിയാ പ്രസിഡന്റിന്റെ ശുപാർശ) read-only, office comment (ഓഫീസ് ഉപയോഗത്തിന്) textarea + save, approve/reject/under-review buttons per existing pattern.

### Task 10: Area admin frontend

**Files:**
- Modify: `MasjidCouncil-frontend/src/pages/AdminLogin.jsx` (route by `user.role`: areaadmin → `/area-home`)
- Create: `MasjidCouncil-frontend/src/pages/AreaAdminHome.jsx` (list all own-area submissions, formType/status filters)
- Create: `MasjidCouncil-frontend/src/pages/AreaAdminSubmissionDetails.jsx` (read-only detail + verification comment box)
- Modify: `MasjidCouncil-frontend/src/App.jsx` (routes `/area-home`, `/area-submission-details/:id`)
- Modify: super admin admin-management UI to include role select + district/area required for areaadmin.

### Task 11: Smoke check

Run backend (`node --test lib/`), start server, exercise config PUT/GET + submit + area verify happy path; `npm run build` frontend. Commit.
