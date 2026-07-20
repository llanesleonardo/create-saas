# AWS ECS — __APP_NAME__

- `task-def.web.json` — Fargate web (`node server.js`)
- `task-def.worker.json` — PLACEHOLDER for PeopleForms-style outbox worker (`node worker.js`). Do not deploy the worker service until `worker.js` exists in your image.

Terraform under the monorepo `deploy/aws/terraform/` can be copied and renamed (`peopleforms` → `__APP_SLUG__`). Keep secrets in SSM/Secrets Manager ARNs listed in the task defs.
