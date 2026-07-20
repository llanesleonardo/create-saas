# Cloud Run worker — __APP_NAME__
#
# PLACEHOLDER (PeopleForms outbox worker):
# Deploy only after your image contains worker.js (background jobs).
# Until then, skip this service or use Vercel/cron drain instead.
#
# Deploy: gcloud run services replace deploy/gcp/service.worker.yaml --region <REGION>
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: __APP_SLUG__-worker
  labels:
    project: __APP_SLUG__
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "2"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 1
      containers:
        - image: IMAGE
          command: ["node"]
          args: ["worker.js"]
          env:
            - name: DEPLOYMENT_MODE
              value: saas
            - name: DATABASE_PROVIDER
              value: postgres
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: __APP_SLUG__-database-url
          resources:
            limits:
              cpu: "1"
              memory: 512Mi
