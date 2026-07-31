# Masjid Council

Monorepo.

- `MasjidCouncil-backend/` — Express/Mongo API
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
npm run dev:api   # Express API (nodemon)
npm run dev:web   # Vite dev server
npm run build:web # production build -> MasjidCouncil-frontend/dist
```

## Deploy

Frontend deploys to Netlify from the root [`netlify.toml`](netlify.toml): `base` points at
`MasjidCouncil-frontend/`, and `ignore` skips the build when a push only touched the backend.
Set `VITE_API_BASE_URL` in the Netlify site's environment variables.
