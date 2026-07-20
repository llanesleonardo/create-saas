# Templates copied by `create-saas` / `npm run new-saas` (when deploy is enabled).

Tokens replaced at scaffold time:

| Token | Example |
|-------|---------|
| `__APP_SLUG__` | `acme-crm` |
| `__APP_NAME__` | `Acme CRM` |
| `__APP_PORT__` | `3000` |
| `__VOLUME_PREFIX__` | `acmecrm` (docker volume names) |

## Included (not placeholders)

- `scripts/migrate-postgres.mjs` — platform then product SQL
- `scripts/worker.mjs` — outbox worker entry
- `/api/health` + `/api/ready`
- `.env.example` — Stripe, email, **storage (Azure/S3)**, secrets

PeopleForms-only volumes (form uploads/policies) may still appear as comments in Docker templates — not as FormBuilder code.
