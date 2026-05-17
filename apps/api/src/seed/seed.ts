import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CloudflareEmbeddingsService } from '../embeddings/cloudflare-embeddings.service';
import {
  ToxicTermsRepository,
  ToxicTermSeed,
} from '../vector-store/toxic-terms.repository';

const EMBED_BATCH = 50;
const INSERT_BATCH = 100;
const CSV_PATH = resolve(__dirname, '..', '..', 'training_data.csv');

function loadTerms(path: string): string[] {
  const raw = readFileSync(path, 'utf8');
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    if (i === 0 && line.toLowerCase() === 'text') continue;
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const embeddings = app.get(CloudflareEmbeddingsService);
    const repo = app.get(ToxicTermsRepository);

    const terms = loadTerms(CSV_PATH);
    logger.log(`Loaded ${terms.length} unique terms from ${CSV_PATH}`);

    const pendingRows: ToxicTermSeed[] = [];
    let inserted = 0;

    for (let i = 0; i < terms.length; i += EMBED_BATCH) {
      const batch = terms.slice(i, i + EMBED_BATCH);
      const vectors = await embeddings.embedBatch(batch);

      for (let j = 0; j < batch.length; j++) {
        pendingRows.push({
          id: batch[j],
          word: batch[j],
          embedding: vectors[j],
        });
      }

      while (pendingRows.length >= INSERT_BATCH) {
        const chunk = pendingRows.splice(0, INSERT_BATCH);
        await repo.upsertMany(chunk);
        inserted += chunk.length;
        logger.log(`Upserted ${inserted}/${terms.length}`);
      }
    }

    if (pendingRows.length > 0) {
      await repo.upsertMany(pendingRows);
      inserted += pendingRows.length;
      logger.log(`Upserted ${inserted}/${terms.length}`);
    }

    const total = await repo.count();
    logger.log(`Seed complete. toxic_terms row count: ${total}`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
