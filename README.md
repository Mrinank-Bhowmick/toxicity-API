# Toxicity API

Detect toxicity in a sentence via vector similarity against a seeded toxic-term corpus.

- **Web:** https://toxicity.its-mrinank.com
- **API:** https://toxicityapi.its-mrinank.com

## Layout

```
apps/
  web/   Next.js frontend
  api/   Fastify service — Postgres + pgvector + Cloudflare Workers AI embeddings
```

## API

```bash
curl -X POST https://toxicityapi.its-mrinank.com/ \
  -H "Content-Type: application/json" \
  -d '{"message":"hello there"}'
```

Response:

```json
{ "isToxic": true,  "score": 0.97, "flaggedFor": "<word>" }
{ "isToxic": false, "score": 0.42 }
```

## Local development

```bash
pnpm install

# api
cp apps/api/.env.example apps/api/.env   # fill DATABASE_URL, CF_ACCOUNT_ID, CF_API_TOKEN
pnpm migrate                              # applies scripts/001-init.sql
pnpm seed                                 # embeds training_data.csv
pnpm dev:api                              # Fastify on port 3001

# web
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web                              # Next.js on port 3000
```

Tests: `pnpm test`.
