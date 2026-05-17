import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { TextSplittingModule } from '../text-splitting/text-splitting.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { ToxicityController } from './toxicity.controller';
import { ToxicityService } from './toxicity.service';

@Module({
  imports: [EmbeddingsModule, TextSplittingModule, VectorStoreModule],
  controllers: [ToxicityController],
  providers: [ToxicityService],
})
export class ToxicityModule {}
