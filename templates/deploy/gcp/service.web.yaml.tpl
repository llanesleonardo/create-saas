# Cloud Run web — __APP_NAME__
# Deploy: gcloud run services replace deploy/gcp/service.web.yaml --region <REGION>
# CI substitutes IMAGE / secret names before apply.
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: __APP_SLUG__-web
  labels:
    project: __APP_SLUG__
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "5"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
        - image: IMAGE
          command: ["node"]
          args: ["server.js"]
          ports:
            - containerPort: __APP_PORT__
          env:
            - name: DEPLOYMENT_MODE
              value: saas
            - name: DATABASE_PROVIDER
              value: postgres
            - name: PORT
              value: "__APP_PORT__"
            - name: HOSTNAME
              value: 0.0.0.0
            - name: OUTBOX_DRAIN_ON_SUBMIT
              value: "0"
            - name: STORAGE_PROVIDER
              value: s3
            - name: LOG_STDOUT
              value: "1"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: __APP_SLUG__-database-url
            - name: SESSION_SECRET
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: __APP_SLUG__-session-secret
            - name: SECRETS_ENCRYPTION_KEY
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: __APP_SLUG__-encryption-key
          resources:
            limits:
              cpu: "1"
              memory: 512Mi
          startupProbe:
            httpGet:
              path: /api/health
              port: __APP_PORT__
            initialDelaySeconds: 10
            periodSeconds: 10
            failureThreshold: 6
          livenessProbe:
            httpGet:
              path: /api/health
              port: __APP_PORT__
            periodSeconds: 30
