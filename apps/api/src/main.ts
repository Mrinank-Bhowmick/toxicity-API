import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { createPool, nearestToxicTerm } from './db';
import { createEmbedder } from './embeddings';
import { loadEnv, type Env } from './env';
import { buildRoutes } from './routes';
import type { Deps } from './toxicity';

type BuildOpts = { deps: Deps; corsOrigin: string };

export function createServer({ deps, corsOrigin }: BuildOpts): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    bodyLimit: 8 * 1024, // 8KB — message capped at 1000 chars, leaves headroom
  }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(helmet);
  app.register(cors, { origin: corsOrigin, methods: ['POST', 'GET', 'OPTIONS'] });
  app.register(rateLimit, { max: 30, timeWindow: '1 minute' });
  app.register(buildRoutes(deps));
  return app;
}

async function main(env: Env) {
  const pool = await createPool(env.DATABASE_URL);
  const embed = createEmbedder({
    accountId: env.CF_ACCOUNT_ID,
    apiToken: env.CF_API_TOKEN,
    model: env.CF_EMBEDDING_MODEL,
  });

  const app = createServer({
    deps: { embed, nearestMatch: (v) => nearestToxicTerm(pool, v) },
    corsOrigin: env.CORS_ORIGIN,
  });
  app.addHook('onClose', () => pool.end());

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

if (require.main === module) {
  main(loadEnv()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
