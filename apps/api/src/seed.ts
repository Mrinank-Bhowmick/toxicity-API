import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { countToxicTerms, createPool, upsertToxicTerms, type ToxicTerm } from './db';
import { createEmbedder } from './embeddings';
import { loadEnv } from './env';

const EMBED_BATCH = 50;
const INSERT_BATCH = 100;
const CSV_PATH = resolve(__dirname, '..', 'training_data.csv');

function loadTerms(path: string): string[] {
  const raw = readFileSync(path, 'utf8');
  const seen = new Set<string>();
  const out: string[] = [];
  raw.split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    if (i === 0 && t.toLowerCase() === 'text') return;
    if (seen.has(t)) return;
    seen.add(t);
    out.push(t);
  });
  return out;
}

async function main() {
  const env = loadEnv();
  const pool = await createPool(env.DATABASE_URL);
  const embed = createEmbedder({
    accountId: env.CF_ACCOUNT_ID,
    apiToken: env.CF_API_TOKEN,
    model: env.CF_EMBEDDING_MODEL,
  });

  try {
    const terms = loadTerms(CSV_PATH);
    console.log(`Loaded ${terms.length} unique terms`);

    const pending: ToxicTerm[] = [];
    let inserted = 0;
    for (let i = 0; i < terms.length; i += EMBED_BATCH) {
      const batch = terms.slice(i, i + EMBED_BATCH);
      const vectors = await embed(batch);
      batch.forEach((word, j) => pending.push({ id: word, word, embedding: vectors[j] }));

      while (pending.length >= INSERT_BATCH) {
        const chunk = pending.splice(0, INSERT_BATCH);
        await upsertToxicTerms(pool, chunk);
        inserted += chunk.length;
        console.log(`Upserted ${inserted}/${terms.length}`);
      }
    }
    if (pending.length > 0) {
      await upsertToxicTerms(pool, pending);
      inserted += pending.length;
      console.log(`Upserted ${inserted}/${terms.length}`);
    }
    console.log(`Seed complete. Row count: ${await countToxicTerms(pool)}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
