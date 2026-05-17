# Toxicity API

Detect toxicity in a sentence via vector similarity against a seeded toxic-term corpus.

## Layout

```
apps/
  web/   Next.js frontend (deploys to Vercel)
  api/   NestJS service (deploys to VM) — Postgres + pgvector + Cloudflare Workers AI REST API
```

## Make an API Request

```javascript
const res = await fetch(process.env.NEXT_PUBLIC_TOXICITY_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message }),
});
```

Response:

```json
{ "isToxic": true,  "score": 0.97, "flaggedFor": "<word>" }
{ "isToxic": false, "score": 0.42 }
```

## Local development

```bash
pnpm install                                      # installs all workspaces

# backend
cp apps/api/.env.example apps/api/.env            # fill DATABASE_URL, CF_ACCOUNT_ID, CF_API_TOKEN
pnpm migrate                                      # applies scripts/001-init.sql (vector ext + schema)
pnpm seed                                         # embeds training_data.csv into toxic_terms
pnpm dev:api                                      # NestJS on PORT (default 3001)

# frontend
cp apps/web/.env.example apps/web/.env.local      # NEXT_PUBLIC_TOXICITY_API_URL
pnpm dev:web                                      # Next.js on port 3000
```

Tests: `pnpm test` (api e2e).

## Deploy

- **Vercel** — set **Root Directory** to `apps/web`. Build command and output stay as Next.js defaults.
- **VM** — `git clone`, `pnpm install --prod=false`, `pnpm --filter api build`, then `node apps/api/dist/main.js` (or build the image with `docker build apps/api/`).
