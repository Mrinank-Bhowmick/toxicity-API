import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CloudflareEmbeddingResult {
  shape: number[];
  data: number[][];
}

interface CloudflareEmbeddingResponse {
  result?: CloudflareEmbeddingResult;
  success: boolean;
  errors?: Array<{ code: number; message: string }>;
  messages?: unknown[];
}

const DEFAULT_MODEL = '@cf/baai/bge-base-en-v1.5';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_BATCH = 100;

@Injectable()
export class CloudflareEmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(CloudflareEmbeddingsService.name);
  private accountId!: string;
  private apiToken!: string;
  private model!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const accountId = this.config.get<string>('CF_ACCOUNT_ID');
    const apiToken = this.config.get<string>('CF_API_TOKEN');
    if (!accountId || !apiToken) {
      throw new Error(
        'CF_ACCOUNT_ID and CF_API_TOKEN must be set for CloudflareEmbeddingsService',
      );
    }
    this.accountId = accountId;
    this.apiToken = apiToken;
    this.model =
      this.config.get<string>('CF_EMBEDDING_MODEL') ?? DEFAULT_MODEL;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (texts.length > MAX_BATCH) {
      throw new Error(
        `embedBatch called with ${texts.length} texts; max is ${MAX_BATCH}`,
      );
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${this.model}`;
    const body = JSON.stringify({ text: texts });

    const response = await this.requestWithRetry(url, body);
    const json = (await response.json()) as CloudflareEmbeddingResponse;

    if (!json.success || !json.result) {
      this.logger.error(
        `Cloudflare embedding failed: ${JSON.stringify(json.errors ?? json)}`,
      );
      throw new InternalServerErrorException('Embedding service failed');
    }
    return json.result.data;
  }

  private async requestWithRetry(
    url: string,
    body: string,
  ): Promise<Response> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt < 2) {
      attempt += 1;
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body,
          signal: controller.signal,
        });

        if (res.status === 429 || res.status >= 500) {
          lastError = new Error(`Upstream ${res.status}`);
          if (attempt < 2) continue;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new InternalServerErrorException(
            `Cloudflare AI ${res.status}: ${text.slice(0, 200)}`,
          );
        }
        return res;
      } catch (err) {
        lastError = err;
        if (attempt >= 2) break;
      } finally {
        clearTimeout(timeout);
      }
    }

    this.logger.error(`Cloudflare AI request failed: ${String(lastError)}`);
    throw new InternalServerErrorException('Embedding service unavailable');
  }
}
