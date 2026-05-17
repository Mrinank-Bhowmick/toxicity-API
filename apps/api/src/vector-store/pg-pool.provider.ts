import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import pgvector from 'pgvector/pg';

export const PG_POOL = Symbol('PG_POOL');

export const PgPoolProvider: Provider = {
  provide: PG_POOL,
  inject: [ConfigService],
  useFactory: async (config: ConfigService): Promise<Pool> => {
    const connectionString = config.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL must be set');
    }
    const pool = new Pool({ connectionString });
    const logger = new Logger('PgPool');

    pool.on('connect', async (client) => {
      try {
        await pgvector.registerTypes(client);
      } catch (err) {
        logger.error(`registerTypes failed: ${String(err)}`);
      }
    });

    pool.on('error', (err) => {
      logger.error(`pg pool error: ${err.message}`);
    });

    const client = await pool.connect();
    try {
      await pgvector.registerTypes(client);
    } finally {
      client.release();
    }

    return pool;
  },
};
