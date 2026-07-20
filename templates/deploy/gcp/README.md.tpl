# Google Cloud Run — __APP_NAME__

1. Push image to Artifact Registry.
2. Create secrets `__APP_SLUG__-database-url`, `-session-secret`, `-encryption-key`.
3. Replace `IMAGE` in the YAML files, then `gcloud run services replace ...`.

`service.worker.yaml` is a PLACEHOLDER for PeopleForms-style outbox workers — enable when `worker.js` exists.
