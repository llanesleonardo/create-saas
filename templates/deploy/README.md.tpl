# Deployment targets — __APP_NAME__

Scaffolded from Epic 09 multi-cloud patterns. Same ops model as PeopleForms, **without** FormBuilder-specific paths.

| Stack | Spec | Notes |
|-------|------|--------|
| **Docker** | `../Dockerfile`, `../docker-compose.yml` | Local / any registry |
| **Vercel** | [`vercel/`](./vercel/) | Serverless Next; cron PLACEHOLDER for job drain |
| **DigitalOcean** | [`digitalocean/`](./digitalocean/) | App Platform web (+ worker PLACEHOLDER) |
| **AWS** | [`aws/`](./aws/) | ECS task defs (Terraform optional — copy from monorepo `deploy/aws/terraform`) |
| **GCP** | [`gcp/`](./gcp/) | Cloud Run YAML |
| **Azure** | [`azure/`](./azure/) | How to reuse monorepo Bicep with your product name |

## Every cloud needs

| Concern | How |
|---------|-----|
| Database | Managed PostgreSQL via `DATABASE_URL` when you leave SQLite |
| Migrations | PLACEHOLDER — add `scripts/migrate-postgres.mjs` when you have SQL migrations (PeopleForms has FormBuilder + platform SQL; your product only needs *your* tables + chassis migrations) |
| Object storage | `STORAGE_PROVIDER=azure\|s3` — not local disk in cloud |
| Background jobs | PLACEHOLDER — persistent `worker.js` **or** cron → `/api/jobs/drain` (PeopleForms outbox). Scaffold shell apps often start without a worker. |
| Health | `/api/health` (included in shell demo pages) |

## Build & push (example)

```bash
docker build -t __APP_SLUG__:local .
# tag + push to your registry, then point each cloud spec at that image
```
