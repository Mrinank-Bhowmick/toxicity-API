import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ToxicityModule } from './toxicity/toxicity.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ToxicityModule,
  ],
})
export class AppModule {}
