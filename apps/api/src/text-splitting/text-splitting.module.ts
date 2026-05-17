import { Module } from '@nestjs/common';
import { SplitterService } from './splitter.service';

@Module({
  providers: [SplitterService],
  exports: [SplitterService],
})
export class TextSplittingModule {}
