import { Module } from '@nestjs/common';
import { PgPoolProvider } from './pg-pool.provider';
import { ToxicTermsRepository } from './toxic-terms.repository';

@Module({
  providers: [PgPoolProvider, ToxicTermsRepository],
  exports: [ToxicTermsRepository],
})
export class VectorStoreModule {}
