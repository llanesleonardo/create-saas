# DigitalOcean — __APP_NAME__

1. Build/push image to DOCR as `__APP_SLUG__`.
2. Fill secrets in the App Platform UI (`SESSION_SECRET`, etc.).
3. `doctl apps create --spec deploy/digitalocean/app.yaml`

Worker + migrate job blocks are commented PLACEHOLDERs — enable when you add outbox worker / SQL migrations (PeopleForms has both for FormBuilder).
