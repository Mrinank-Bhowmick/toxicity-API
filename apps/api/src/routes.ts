import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { classify, type Deps } from './toxicity';

const BodySchema = z
  .object({
    message: z.string().min(1, 'message is required').max(1000, 'message exceeds 1000 characters'),
  })
  .strict();

export function buildRoutes(deps: Deps): FastifyPluginAsync {
  return async (app) => {
    const typed = app.withTypeProvider<ZodTypeProvider>();

    typed.get('/health', async () => ({ ok: true }));

    typed.post('/', { schema: { body: BodySchema } }, async (req) => {
      return classify(deps, req.body.message);
    });
  };
}
