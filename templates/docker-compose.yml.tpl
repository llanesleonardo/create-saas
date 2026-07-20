# __APP_NAME__ — local Docker Compose (scaffolded from Epic 09 patterns)
#
# Default: SQLite volume (no external DB).
# Optional Postgres: docker compose --profile postgres up -d
#
# cp .env.example .env.local  (or .env) then edit before starting.

services:
  app:
    build: .
    ports:
      - "${PORT:-__APP_PORT__}:__APP_PORT__"
    env_file:
      - .env.local
    environment:
      DEPLOYMENT_MODE: ${DEPLOYMENT_MODE:-saas}
      DATABASE_PROVIDER: ${DATABASE_PROVIDER:-sqlite}
      SQLITE_PATH: ${SQLITE_PATH:-/app/data/__APP_SLUG__.db}
      HOSTNAME: 0.0.0.0
      PORT: __APP_PORT__
    volumes:
      - __VOLUME_PREFIX__-data:/app/data
      - __VOLUME_PREFIX__-logs:/app/logs
      # PLACEHOLDER (PeopleForms): pf-uploads / pf-policies volumes for form files + PDFs.
      # Add bind mounts only if your product stores uploads on local disk.
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://127.0.0.1:__APP_PORT__/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 25s

  # Outbox worker (enable after registering handlers in src/domain/jobs.ts).
  # worker:
  #   build: .
  #   command: ["node", "worker.js"]
  #   env_file: [.env.local]
  #   environment:
  #     DATABASE_PROVIDER: ${DATABASE_PROVIDER:-sqlite}
  #     SQLITE_PATH: ${SQLITE_PATH:-/app/data/__APP_SLUG__.db}
  #   volumes:
  #     - __VOLUME_PREFIX__-data:/app/data
  #   depends_on:
  #     app:
  #       condition: service_healthy
  #   restart: unless-stopped

  db:
    profiles: ["postgres"]
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-__VOLUME_PREFIX__}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-__VOLUME_PREFIX__}
      POSTGRES_DB: ${POSTGRES_DB:-__VOLUME_PREFIX__}
    volumes:
      - __VOLUME_PREFIX__-postgres:/var/lib/postgresql/data
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

volumes:
  __VOLUME_PREFIX__-data:
  __VOLUME_PREFIX__-logs:
  __VOLUME_PREFIX__-postgres:
