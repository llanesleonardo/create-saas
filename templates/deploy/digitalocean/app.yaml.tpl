# DigitalOcean App Platform — __APP_NAME__
#
# Apply:  doctl apps create --spec deploy/digitalocean/app.yaml
# Update: doctl apps update <APP_ID> --spec deploy/digitalocean/app.yaml
#
# Replace DOCR repository/image after first push to DigitalOcean Container Registry.
name: __APP_SLUG__
region: nyc

databases:
  - name: db
    engine: PG
    version: "17"
    production: false

services:
  - name: web
    image:
      registry_type: DOCR
      repository: __APP_SLUG__
      tag: latest
    run_command: node server.js
    http_port: __APP_PORT__
    instance_size_slug: apps-s-1vcpu-1gb
    instance_count: 1
    health_check:
      http_path: /api/health
      initial_delay_seconds: 15
      period_seconds: 30
    envs:
      - key: DEPLOYMENT_MODE
        value: saas
      - key: DATABASE_PROVIDER
        value: postgres
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
        type: SECRET
      - key: PORT
        value: "__APP_PORT__"
      - key: HOSTNAME
        value: 0.0.0.0
      - key: OUTBOX_DRAIN_ON_SUBMIT
        value: "0"
      - key: STORAGE_PROVIDER
        value: s3
      - key: LOG_STDOUT
        value: "1"
      - key: NEXT_PUBLIC_APP_URL
        value: ${APP_URL}
      - key: SESSION_SECRET
        scope: RUN_TIME
        type: SECRET
      - key: SECRETS_ENCRYPTION_KEY
        scope: RUN_TIME
        type: SECRET

# PLACEHOLDER (PeopleForms outbox worker):
# Uncomment when your image includes worker.js (background jobs).
# workers:
#   - name: worker
#     image:
#       registry_type: DOCR
#       repository: __APP_SLUG__
#       tag: latest
#     run_command: node worker.js
#     instance_size_slug: apps-s-1vcpu-1gb
#     instance_count: 1
#     envs:
#       - key: DATABASE_PROVIDER
#         value: postgres
#       - key: DATABASE_URL
#         value: ${db.DATABASE_URL}
#         type: SECRET

# PLACEHOLDER (PeopleForms migrate-postgres.mjs):
# Add a PRE_DEPLOY job when you have idempotent Postgres migrations for this product.
# jobs:
#   - name: migrate
#     kind: PRE_DEPLOY
#     image:
#       registry_type: DOCR
#       repository: __APP_SLUG__
#       tag: latest
#     run_command: node scripts/migrate-postgres.mjs
#     instance_size_slug: apps-s-1vcpu-1gb
#     instance_count: 1
#     envs:
#       - key: DATABASE_URL
#         value: ${db.DATABASE_URL}
#         type: SECRET
