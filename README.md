# @llanesleonardo/create-saas

Scaffold a **new SaaS product** on:

- `@llanesleonardo/saas-platform` (chassis)
- `@llanesleonardo/saas-product-shell` (auth, workspaces, billing kits)

**Independent of PeopleForms / FormBuilder.**  
**Source of truth:** this repository.

## Partner usage

```bash
# GitHub Packages auth (read:packages)
export NODE_AUTH_TOKEN=ghp_...   # Windows: set NODE_AUTH_TOKEN=...

npx @llanesleonardo/create-saas@0.2.2 --name my-crm --prefix my_
cd my-crm
npm install
cp .env.example .env.local
npm run dev
```

### Options

| Flag | Meaning |
|------|---------|
| `--name` | Folder / package slug (required) |
| `--prefix` | Cookie / API prefix ending in `_` (required), e.g. `acme_` |
| `--product-name` | Display name |
| `--dir` | Output path (default `./<name>`) |
| `--db sqlite\|memory` | Default DB provider |
| `--port` | Dev port (default 3000) |
| `--no-deploy` | Skip Docker / multi-cloud stubs |

## What you get

- Next.js app with setup / login / workspaces / account / pricing
- Branded `shell.ts` + `createShellProxy`
- `.env.example` (SQLite, Stripe, email, object storage Azure/S3, secrets)
- `scripts/migrate-postgres.mjs`, `/api/health` + `/api/ready`, outbox worker
- Empty `src/domain/` for your product
- Optional Docker + `deploy/` stubs

Pins: `saas-platform@0.3.0` + `saas-product-shell@0.2.1`

## Publish (CI)

1. Repo secret `NODE_AUTH_TOKEN` = PAT with `write:packages` (and `read:packages` if you add deps later)
2. Bump `version` in `package.json`
3. Tag `vX.Y.Z` matching version → Actions publishes

## Develop

```bash
node bin/create-saas.mjs --name demo --prefix demo_ --dir ../demo-out --no-deploy
```
