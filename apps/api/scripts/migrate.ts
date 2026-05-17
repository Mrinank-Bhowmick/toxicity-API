import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

const SCRIPTS_DIR = resolve(__dirname);

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL must be set');
  }

  const files = readdirSync(SCRIPTS_DIR)
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found');
    return;
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    for (const file of files) {
      const sql = readFileSync(resolve(SCRIPTS_DIR, file), 'utf8');
      console.log(`Applying ${file}`);
      await client.query(sql);
    }
    console.log('Migrations applied');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
