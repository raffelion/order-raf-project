# Order Portal

Client portal for website orders built with:

- React + Vite frontend
- Cloudflare Pages Functions API
- Cloudflare D1 for auth, projects, and revisions
- Cloudflare R2 reserved for future file uploads

## Current product flow

1. User signs up with `name + email`
2. System sends a 6-digit verification code
3. User verifies email
4. User sets password
5. User signs in and lands in the dashboard
6. Client creates project requests and tracks revisions

Roles:

- `client`: only sees their own projects
- `admin`: sees all projects and can update statuses

## Features already in place

- Email verification onboarding
- Password setup after verification
- Sign in / sign out with cookie session
- Protected dashboard routes
- Project request intake form
- Project list and project detail pages
- Revision thread per project
- Admin project status controls
- Verification resend endpoint with cooldown
- Verification code attempt limits

## Project structure

```txt
src/                 React app
functions/api/       Cloudflare Pages Functions routes
functions/_lib/      Shared server utilities
db/schema.sql        Snapshot schema
db/migrations/       Wrangler D1 migrations
scripts/             Local helper scripts
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy local secrets:

```bash
copy .dev.vars.example .dev.vars
```

3. Put your real Resend key in `.dev.vars`.

4. Update [`wrangler.jsonc`](./wrangler.jsonc):

- replace `database_id`
- replace `APP_URL`
- replace `EMAIL_FROM`

5. Apply local D1 migrations:

```bash
npm run cf:migrate:local
```

6. Start frontend-only dev if you are just touching UI:

```bash
npm run dev
```

7. Start the Cloudflare Pages app locally when you need Functions + D1:

```bash
npm run cf:dev
```

## Cloudflare deployment flow

1. Create a D1 database:

```bash
wrangler d1 create order_portal
```

2. Copy the returned database ID into [`wrangler.jsonc`](./wrangler.jsonc).

3. Apply remote migrations:

```bash
npm run cf:migrate:remote
```

4. Add the production email secret:

```bash
wrangler secret put RESEND_API_KEY
```

5. Build and deploy:

```bash
npm run build
npm run cf:deploy
```

## Promote first admin

After a user signs up, promote them manually:

```bash
npm run cf:promote-admin -- --email=you@example.com --local
```

For remote D1:

```bash
npm run cf:promote-admin -- --email=you@example.com --remote
```

This will:

- set `role = 'admin'`
- force `email_verified = 1`
- print the resulting user row

## Useful commands

```bash
npm run lint
npm run build
npm run cf:typegen
npm run cf:migrate:local
npm run cf:migrate:remote
```

## Important notes

- `EMAIL_PROVIDER` is currently implemented for `resend`
- `wrangler.jsonc` still contains placeholders until you wire your real Cloudflare project
- `db/schema.sql` is the schema snapshot, but `db/migrations/` is the source for D1 migration flow
