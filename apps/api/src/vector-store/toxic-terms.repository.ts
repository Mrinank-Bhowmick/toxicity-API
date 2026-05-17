import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import pgvector from 'pgvector/pg';
import { PG_POOL } from './pg-pool.provider';

export interface NearestNeighbor {
  word: string;
  score: number;
}

export interface ToxicTermSeed {
  id: string;
  word: string;
  embedding: number[];
}

@Injectable()
export class ToxicTermsRepository implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async nearestNeighbor(vector: number[]): Promise<NearestNeighbor> {
    const sql = `
      SELECT word, 1 - (embedding <=> $1) AS score
      FROM toxic_terms
      ORDER BY embedding <=> $1
      LIMIT 1
    `;
    const result = await this.pool.query<{ word: string; score: string }>(
      sql,
      [pgvector.toSql(vector)],
    );

    if (result.rows.length === 0) {
      return { word: '', score: 0 };
    }
    const row = result.rows[0];
    return { word: row.word, score: Number(row.score) };
  }

  async upsertMany(rows: ToxicTermSeed[]): Promise<void> {
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
        SET word = EXCLUDED.word,
            embedding = EXCLUDED.embedding
    `;
    await this.pool.query(sql, values);
  }

  async count(): Promise<number> {
    const res = await this.pool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM toxic_terms',
    );
    return Number(res.rows[0]?.count ?? '0');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
