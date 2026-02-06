import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { IngestLogDto, IngestRawDto, UploadFileDto } from './dto';

/** 10 MB – practical upper bound for a single text log file. */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a plain-text log file for ingestion',
    description:
      'Accepts a text file (up to 10 MB), reads it line by line, ' +
      'parses each line, normalises it, and stores the results. ' +
      'Returns ingestion statistics.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        ingestionSource: {
          type: 'string',
          example: 'file-upload',
          description: 'Ingestion channel identifier',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File processed. Returns ingestion statistics.',
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size.' })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    return this.ingestionService.ingestFile(
      file,
      dto.ingestionSource || 'file-upload',
    );
  }
}
