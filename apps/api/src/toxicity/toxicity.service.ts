import { Injectable, Logger } from '@nestjs/common';
import { CloudflareEmbeddingsService } from '../embeddings/cloudflare-embeddings.service';
import { SplitterService } from '../text-splitting/splitter.service';
import { ToxicTermsRepository } from '../vector-store/toxic-terms.repository';
import { ClassifyResponse } from './dto/classify.dto';

const WHITELIST = new Set(['swear']);
const WORD_THRESHOLD = 0.93;
const SEMANTIC_THRESHOLD = 0.85;
const EMBED_BATCH_SIZE = 50;

interface ScoredChunk {
  score: number;
  text: string;
  threshold: number;
}

@Injectable()
export class ToxicityService {
  private readonly logger = new Logger(ToxicityService.name);

  constructor(
    private readonly embeddings: CloudflareEmbeddingsService,
    private readonly splitter: SplitterService,
    private readonly repo: ToxicTermsRepository,
  ) {}

  async classify(rawMessage: string): Promise<ClassifyResponse> {
    const cleaned = this.stripWhitelist(rawMessage);

    const wordChunks = cleaned.length === 0 ? [] : cleaned.split(' ');
    const semanticChunks = await this.splitter.splitSemantic(cleaned);

    const allChunks: { chunk: string; threshold: number }[] = [
      ...wordChunks.map((chunk) => ({ chunk, threshold: WORD_THRESHOLD })),
      ...semanticChunks.map((chunk) => ({
        chunk,
        threshold: SEMANTIC_THRESHOLD,
      })),
    ];

    const scored = await this.scoreChunks(allChunks);

    const flagged = scored.filter((r) => r.score > r.threshold);
    if (flagged.length > 0) {
      flagged.sort((a, b) => b.score - a.score);
      return {
        isToxic: true,
        score: flagged[0].score,
        flaggedFor: flagged[0].text,
      };
    }

    scored.sort((a, b) => b.score - a.score);
    return {
      isToxic: false,
      score: scored[0]?.score ?? 0,
    };
  }

  private stripWhitelist(message: string): string {
    return message
      .split(/\b/)
      .filter((word) => {
        const cleaned = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        return cleaned.length > 0 && !WHITELIST.has(cleaned);
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async scoreChunks(
    chunks: { chunk: string; threshold: number }[],
  ): Promise<ScoredChunk[]> {
    if (chunks.length === 0) return [];

    const batches: { chunk: string; threshold: number }[][] = [];
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      batches.push(chunks.slice(i, i + EMBED_BATCH_SIZE));
    }

    const embeddedBatches = await Promise.all(
      batches.map(async (batch) => {
        const vectors = await this.embeddings.embedBatch(
          batch.map((b) => b.chunk),
        );
        return { vectors, batch };
      }),
    );

    const queries = embeddedBatches.flatMap(({ vectors, batch }) =>
      vectors.map(async (vector, index) => {
        const match = await this.repo.nearestNeighbor(vector);
        return {
          score: match.score,
          text: match.word,
          threshold: batch[index].threshold,
        };
      }),
    );

    return Promise.all(queries);
  }
}
