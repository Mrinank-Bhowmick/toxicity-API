import { Module } from '@nestjs/common';
import { CloudflareEmbeddingsService } from './cloudflare-embeddings.service';

@Module({
  providers: [CloudflareEmbeddingsService],
  exports: [CloudflareEmbeddingsService],
})
export class EmbeddingsModule {}
