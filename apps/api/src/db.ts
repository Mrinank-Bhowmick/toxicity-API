import { Pool } from 'pg';
import pgvector from 'pgvector/pg';

export type ToxicTerm = { id: string; word: string; embedding: number[] };
export type Match = { word: string; score: number };

export async function createPool(connectionString: string): Promise<Pool> {
  const pool = new Pool({ connectionString });
  pool.on('connect', async (client) => {
    await pgvector.registerTypes(client);
  });
  const client = await pool.connect();
  try {
    await pgvector.registerTypes(client);
  } finally {
    client.release();
  }
  return pool;
}

export async function nearestToxicTerm(
  pool: Pool,
  vector: number[],
): Promise<Match> {
  const sql = `
    SELECT word, 1 - (embedding <=> $1) AS score
    FROM toxic_terms
    ORDER BY embedding <=> $1
    LIMIT 1
  `;
  const res = await pool.query<{ word: string; score: string }>(sql, [
    pgvector.toSql(vector),
  ]);
  if (res.rows.length === 0) return { word: '', score: 0 };
  return { word: res.rows[0].word, score: Number(res.rows[0].score) };
}

export async function upsertToxicTerms(
  pool: Pool,
  rows: ToxicTerm[],
): Promise<void> {
  if (rows.length === 0) return;
  const placeholders: string[] = [];
  const values: unknown[] = [];
  rows.forEach((row, i) => {
    const base = i * 3;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
    values.push(row.id, row.word, pgvector.toSql(row.embedding));
  });
  const sql = `
    INSERT INTO toxic_terms (id, word, embedding)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (id) DO UPDATE
      SET word = EXCLUDED.word, embedding = EXCLUDED.embedding
  `;
  await pool.query(sql, values);
}

export async function countToxicTerms(pool: Pool): Promise<number> {
  const res = await pool.query<{ count: string }>(
    'SELECT count(*)::text AS count FROM toxic_terms',
  );
  return Number(res.rows[0]?.count ?? '0');
}
