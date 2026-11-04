# Masjid Council

Monorepo.

- `MasjidCouncil-backend/` — Express API on Cloudflare Workers (data in D1, uploads in R2)
- `MasjidCouncil-frontend/` — React (Vite) client

Both packages keep their own `package.json` and lockfile. Root `package.json` only holds
convenience scripts — no npm workspaces, nothing is hoisted.

## Setup

```bash
npm run install:all
cp MasjidCouncil-backend/.env.example MasjidCouncil-backend/.env
cp MasjidCouncil-frontend/.env.example MasjidCouncil-frontend/.env
```

## Run

```bash
npm run dev:api   # Worker + local D1/R2 (wrangler dev, http://localhost:8787)
npm run dev:web   # Vite dev server
npm run build:web # production build -> MasjidCouncil-frontend/dist
```

`wrangler dev` reads secrets from `MasjidCouncil-backend/.dev.vars` (gitignored):
`JWT_SECRET`, `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_PASSWORD`, `DXING_API_KEY`,
`DXING_INSTANCE_ID`, plus `FILES_PUBLIC_URL="http://localhost:8787/files"` for local uploads.
Point the frontend at it with `VITE_API_BASE_URL=http://localhost:8787`.

Create the local database once:

```bash
cd MasjidCouncil-backend
npx wrangler d1 execute masjid-council-db --local --file db/schema.sql
```

## Architecture

One Cloudflare Worker, `masjid-council-api` ([`MasjidCouncil-backend/wrangler.jsonc`](MasjidCouncil-backend/wrangler.jsonc)):

- `/api/*` — the Express app ([`app.js`](MasjidCouncil-backend/app.js)), running on Workers' `node:http` support.
- `/files/<key>` — uploaded files, streamed from the R2 bucket `masjid-council-uploads`.
- everything else — the React build (Workers static assets). Unknown paths get the `app.html` SPA shell.

The models and routes are plain Mongoose. [`db/d1Driver.js`](MasjidCouncil-backend/db/d1Driver.js) is a
Mongoose driver backed by the D1 database `masjid-council-db`: one table per former Mongo collection,
each row a document stored as Extended JSON. Unique indexes live in
[`db/indexes.js`](MasjidCouncil-backend/db/indexes.js) → [`db/schema.sql`](MasjidCouncil-backend/db/schema.sql)
(`node db/buildSchema.js > db/schema.sql`).

## Deploy

```bash
cd MasjidCouncil-backend
npm run deploy    # builds the frontend into the Worker's assets, then wrangler deploy
```

Git builds (Cloudflare dashboard → Worker → Settings → Builds): root directory `MasjidCouncil-backend`,
build command `npm ci && npm --prefix ../MasjidCouncil-frontend ci && npm run build:web`,
deploy command `npx wrangler deploy`. Secrets are set on the Worker (`wrangler secret put`), not in the repo.

## Migration from MongoDB / DigitalOcean Spaces

Both scripts read the old `MONGODB_URI` / `DO_SPACES_*` values from `MasjidCouncil-backend/.env`:

```bash
node scripts/cloudflare/exportMongo.js /tmp/data.sql https://masjid-council-api.d4dx-erp.workers.dev/files
npx wrangler d1 execute masjid-council-db --remote --file /tmp/data.sql   # replaces every table
node scripts/cloudflare/copySpacesToR2.js /tmp/r2work /tmp/data.keys.json
```

The one-off scripts in the backend root (`seed*.js`, `addAadhaarField.js`, `test-db.js`, …) still
talk to MongoDB directly and were not ported.
