import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { IngestLogDto, IngestRawDto } from './dto';

@ApiTags('ingestion')
@Controller('ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest a single structured log entry' })
  @ApiResponse({ status: 201, description: 'Log entry created' })
  async ingestStructured(@Body() dto: IngestLogDto) {
    return this.ingestionService.ingestStructured(dto);
  }

  @Post('raw')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest one or more raw log lines (auto-parsed)' })
  @ApiResponse({ status: 201, description: 'Logs ingested. Returns counts.' })
  async ingestRaw(@Body() dto: IngestRawDto) {
    return this.ingestionService.ingestRaw(dto);
  }
}
