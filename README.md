# Remote Practice Exam Platform

Next.js app for tutors to upload practice exam papers and run timed, camera-free-invigilated sittings for students.

## Local development

```bash
npm install
npm run dev   # runs `next dev --webpack` — Turbopack breaks @prisma/client on Windows
npm run seed  # creates the one tutor account from TUTOR_EMAIL/TUTOR_PASSWORD in .env
```

Requires a `.env` with:

```
DATABASE_URL=       # Postgres connection string (e.g. Neon)
AUTH_SECRET=        # random string, e.g. `openssl rand -base64 32`
TUTOR_EMAIL=
TUTOR_PASSWORD=
```

Optional:

```
RESEND_API_KEY=     # real emails; without it, emails are logged to the console
EMAIL_FROM=
RETENTION_DAYS=90   # data purge window after grading
STORAGE_DRIVER=s3    # switch off local disk; see lib/storage/s3.ts for S3/R2 env vars
CRON_SECRET=         # protects the /api/cron/* sweep routes
```

## Deploying on Netlify

1. Connect this repo in the Netlify dashboard (`@netlify/plugin-nextjs` is already wired via `netlify.toml`).
2. Set the environment variables above in Netlify's site settings (at minimum `DATABASE_URL` and `AUTH_SECRET`).
3. Storage: Netlify functions have an ephemeral filesystem like Vercel — set `STORAGE_DRIVER=s3` with an S3/R2 bucket configured (see `lib/storage/s3.ts`); local disk storage only works on a persistent server (VM/container).
4. Run `npm run seed` once against the production `DATABASE_URL` (locally, pointed at prod) to create the tutor account.
5. **Cron jobs**: `/api/cron/sweep-attempts` (auto-submit backstop, ~every 1 min) and `/api/cron/purge-expired` (daily) are plain Next.js API routes, not Netlify Scheduled Functions — Netlify won't call them automatically. Point an external scheduler (e.g. a GitHub Actions scheduled workflow, or cron-job.org) at these URLs with an `Authorization: Bearer $CRON_SECRET` header.
