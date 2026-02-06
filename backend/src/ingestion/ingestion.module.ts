import { Module } from '@nestjs/common';
import { ParsingModule } from '../parsing';
import { NormalizationModule } from '../normalization';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [ParsingModule, NormalizationModule],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
