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
- **Log In** + first-admin (`needsSetup` / `/setup` closed after first user)
- **Workspace required after login** (`createShellProxy({ requireFirstAdmin, requireWorkspace })`)
- **Default sidebar chrome** — Product placeholders · Workspace · Account · theme · workspace switcher
- **Agent guardrail** — `.cursor/rules/saas-kit-protect.mdc` (ask before changing kit; ~90% domain focus)
- **Docs folders** — `docs/Components`, `docs/Development`, `docs/Software Patterns Docs` (structure only; sync patterns via `sync-docs`)
- **Skill** — `.cursor/skills/saas-docs-picture` (support docs + repo code before architecture decisions)
- **`/billing`** — saas checkout vs selfhosted matrix + invoices (manual Stripe links)

See `@llanesleonardo/saas-product-shell` → `docs/DUAL-MODE-TENANCY.md` + `docs/APP-SHELL-LAYOUT.md`.

PeopleForms-only volumes (form uploads/policies) may still appear as comments in Docker templates — not as FormBuilder code.
