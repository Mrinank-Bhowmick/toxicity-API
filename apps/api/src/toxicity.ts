import type { Match } from './db';
import type { EmbedBatch } from './embeddings';
import { splitSemantic } from './splitter';

const WHITELIST = new Set(['swear']);
const WORD_THRESHOLD = 0.93;
const SEMANTIC_THRESHOLD = 0.85;
const EMBED_BATCH_SIZE = 50;

export type ClassifyResult =
  | { isToxic: true; score: number; flaggedFor: string }
  | { isToxic: false; score: number };

export type NearestMatch = (vector: number[]) => Promise<Match>;
export type Deps = { embed: EmbedBatch; nearestMatch: NearestMatch };

export async function classify(deps: Deps, rawMessage: string): Promise<ClassifyResult> {
  const cleaned = stripWhitelist(rawMessage);
  const wordChunks = cleaned.length === 0 ? [] : cleaned.split(' ');
  const semanticChunks = await splitSemantic(cleaned);

  const chunks = [
    ...wordChunks.map((c) => ({ text: c, threshold: WORD_THRESHOLD })),
    ...semanticChunks.map((c) => ({ text: c, threshold: SEMANTIC_THRESHOLD })),
  ];
  if (chunks.length === 0) return { isToxic: false, score: 0 };

  const scored: { score: number; text: string; threshold: number }[] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const vectors = await deps.embed(batch.map((b) => b.text));
    const matches = await Promise.all(vectors.map((v) => deps.nearestMatch(v)));
    matches.forEach((m, j) =>
      scored.push({ score: m.score, text: m.word, threshold: batch[j].threshold }),
    );
  }

  const flagged = scored.filter((s) => s.score > s.threshold);
  if (flagged.length > 0) {
    flagged.sort((a, b) => b.score - a.score);
    return { isToxic: true, score: flagged[0].score, flaggedFor: flagged[0].text };
  }
  scored.sort((a, b) => b.score - a.score);
  return { isToxic: false, score: scored[0]?.score ?? 0 };
}

function stripWhitelist(message: string): string {
  return message
    .split(/\b/)
    .filter((w) => {
      const cleaned = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
      return cleaned.length > 0 && !WHITELIST.has(cleaned);
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
