# AGENTS.md

Guidance for AI coding agents working in this repo.

## What this is

Monorepo with two apps:

- `apps/web` — Next.js frontend. Deployed to Vercel.
- `apps/api` — Fastify service: Postgres + pgvector for vector similarity, Cloudflare Workers AI for embeddings.

Public surface is a single `POST /` that classifies a message as toxic or not.

## Tooling

- pnpm workspaces (`pnpm-workspace.yaml`).
- Node 22+ (uses `--env-file` flag, no `dotenv` dep).
- TypeScript strict everywhere.
- Tests: Jest + `fastify.inject()` (no supertest, no real HTTP).

## apps/api conventions

- **Flat files, no classes-as-namespaces, no DI container.** Each file does one thing: `env.ts`, `db.ts`, `embeddings.ts`, `splitter.ts`, `toxicity.ts`, `routes.ts`, `main.ts`, `seed.ts`.
- **Dependencies injected as plain functions or values** via the `Deps` type in `src/toxicity.ts`. Compose real deps in `src/main.ts`; tests pass fakes.
- **Validation:** Zod schemas at the route boundary (`src/routes.ts`), strict mode (extra keys rejected). Don't add `class-validator`.
- **DB access:** parameterized queries only. Never string-interpolate user input into SQL.
- **Env:** validated by Zod in `src/env.ts` at boot. Add new vars there or the server won't start.
- **Secrets** (`CF_API_TOKEN`, `DATABASE_URL`) live in `apps/api/.env` and are gitignored. Never log them.

## Build / run

```bash
pnpm --filter api build      # tsc -p tsconfig.build.json → dist/*.js
pnpm --filter api start:prod # node --env-file=.env dist/main.js
pnpm --filter api test       # jest
pnpm --filter api migrate    # apply scripts/001-init.sql
pnpm --filter api seed       # embed training_data.csv into toxic_terms
```

Two tsconfigs: `tsconfig.json` is the editor/test config (loose, includes `test/` and `scripts/`). `tsconfig.build.json` is what `tsc` uses to emit `dist/` (rootDir=src, excludes tests + scripts). Don't merge them — the rootDir split is what keeps `dist/main.js` flat instead of `dist/src/main.js`.

## Public contract (don't break)

`POST /` accepts `{ "message": string (1..1000 chars) }` and returns either:

```json
{ "isToxic": true,  "score": number, "flaggedFor": string }
{ "isToxic": false, "score": number }
```

Thresholds in `src/toxicity.ts`: word ≥ 0.93, semantic ≥ 0.85. The frontend depends on these.

## Things to avoid

- Don't reintroduce NestJS, class-validator, or a DI container — the migration off NestJS was deliberate.
- Don't add framework-style folders (`*.module.ts`, `*.controller.ts`, `*.service.ts`). Keep files flat.
- Don't add `dotenv` — use Node's `--env-file` flag.
- Don't widen the rate-limit, CORS origin, or body-limit defaults without a reason.
- Don't add comments that just narrate what the code does.
