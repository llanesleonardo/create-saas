# Azure — __APP_NAME__

Full Bicep (Container Apps + Postgres + ACR + Key Vault) lives in the **peopleForms monorepo** at `deploy/azure/` (moved from root `infra/`).

## How to reuse for this product

1. Copy `deploy/azure/` from the monorepo into this app (or keep using the monorepo path).
2. Replace product identifiers:
   - Resource / project tags `peopleforms` → `__APP_SLUG__`
   - Database name / env `peopleforms_*` → `__VOLUME_PREFIX___*`
   - Container command stays `node server.js` / PLACEHOLDER `node worker.js`
3. Point `azure.yaml` `infra.path` at your copy if using `azd`.
4. Set `containerImage` to your ACR image for `__APP_SLUG__`.

## PLACEHOLDER (PeopleForms-specific)

| PeopleForms piece | What to do here |
|-------------------|-----------------|
| FormBuilder migrations in the image | Only ship **your** domain SQL + chassis/platform migrations |
| `public/uploads` + `public/policies` | Skip unless your product stores files on disk; prefer Blob/`STORAGE_PROVIDER=azure` |
| Always-on ACA worker | Enable when you have `worker.js`; until then min replicas can be web-only |
| GitHub `deploy-dev.yml` OIDC | Copy workflows from `.github/workflows/deploy-*.yml` and rename app/image |

Reference: monorepo `docs/Epic-09/multi-cloud.md` and `deploy/azure/README.md`.
