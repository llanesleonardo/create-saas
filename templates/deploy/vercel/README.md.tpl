# Vercel — __APP_NAME__

1. Import this repo / app into Vercel.
2. Set env: `DATABASE_URL`, `SESSION_SECRET`, `SECRETS_ENCRYPTION_KEY`, `NEXT_PUBLIC_APP_URL`, Stripe keys as needed.
3. `vercel.json` enables a cron hitting `/api/jobs/drain`.

## PLACEHOLDER (PeopleForms outbox / job drain)

PeopleForms uses `/api/jobs/drain` + `CRON_SECRET` because Vercel has no long-running `worker.js`.

- If your product **does not** have an outbox yet: remove the `crons` block from `vercel.json` (or leave it — the route will 404 until you add it).
- When you add jobs: implement `src/app/api/jobs/drain/route.ts` (see PeopleForms) and set `CRON_SECRET`.
