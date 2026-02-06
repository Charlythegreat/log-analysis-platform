import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ParsingService } from '../parsing';
import { NormalizationService } from '../normalization';
import { NormalizedLog } from '../common';
import { IngestLogDto, IngestRawDto } from './dto';
import { UploadResult } from './interfaces/upload-result.interface';
import { LogEntry } from '@prisma/client';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: ParsingService,
    private readonly normalizer: NormalizationService,
  ) {}

  /**
   * Ingest a single pre-structured log entry.
   */
  async ingestStructured(dto: IngestLogDto): Promise<LogEntry> {
    const entry = await this.prisma.logEntry.create({
      data: {
        level: dto.level,
        message: dto.message,
        source: dto.source.toLowerCase(),
        rawLog: JSON.stringify(dto),
        ingestionSource: dto.ingestionSource || 'api',
        format: 'structured',
        metadata: (dto.metadata ?? {}) as object,
      },
    });

    this.logger.debug(`Ingested structured log [${entry.id}]`);
    return entry;
  }

  /**
   * Ingest one or more raw log lines.
   * Each line is parsed → normalised → persisted.
   * Returns the number stored and any lines that failed.
   */
  async ingestRaw(dto: IngestRawDto): Promise<{
    ingested: number;
    failed: number;
    entries: LogEntry[];
  }> {
    const entries: LogEntry[] = [];
    let failed = 0;

    // Parse + normalise all lines
    const normalized: NormalizedLog[] = [];
    const ingSource = dto.ingestionSource || 'api';
    for (const line of dto.lines) {
      try {
        const parsed = this.parser.parse(line);
        const norm = this.normalizer.normalize(parsed, line, ingSource);
        normalized.push(norm);
      } catch (err) {
        this.logger.warn(`Failed to parse line: "${line.slice(0, 80)}…"`, err);
        failed++;
      }
    }

    // Batch insert via a transaction
    if (normalized.length > 0) {
      const created = await this.prisma.$transaction(
        normalized.map((n) =>
          this.prisma.logEntry.create({
            data: {
              level: n.level,
              message: n.message,
              source: n.source,
              timestamp: n.timestamp,
              rawLog: n.rawLog,
              ingestionSource: n.ingestionSource,
              format: n.format,
              metadata: n.metadata as object,
            },
          }),
        ),
      );
      entries.push(...created);
    }

    this.logger.log(
      `Ingested ${entries.length} raw logs (${failed} failed)`,
    );

    return { ingested: entries.length, failed, entries };
  }

  /* ------------------------------------------------------------------ */
  /*  File upload                                                       */
  /* ------------------------------------------------------------------ */

  /** Maximum number of lines we are willing to process from a single file. */
  private static readonly MAX_LINES = 50_000;

  /**
   * Process an uploaded text file: split into lines, parse, normalise,
   * and persist each non-empty line.
   *
   * Lines are inserted in batches (via a Prisma transaction) so we
   * don't hold a single huge transaction open for very large files.
   */
  async ingestFile(
    file: Express.Multer.File,
    ingestionSource = 'file-upload',
  ): Promise<UploadResult> {
    const start = Date.now();

    this.validateFile(file);

    const content = file.buffer.toString('utf-8');
    const allLines = content.split(/\r?\n/);

    let skippedEmpty = 0;
    let failed = 0;
    let ingested = 0;

    /* ---------- parse & normalise ---------- */
    const normalized: NormalizedLog[] = [];

    for (const line of allLines) {
      if (line.trim().length === 0) {
        skippedEmpty++;
        continue;
      }

      try {
        const parsed = this.parser.parse(line);
        const norm = this.normalizer.normalize(parsed, line, ingestionSource);
        normalized.push(norm);
      } catch (err) {
        this.logger.warn(
          `File parse error: "${line.slice(0, 80)}…"`,
          err,
        );
        failed++;
      }
    }

    /* ---------- batch persist ---------- */
    const BATCH_SIZE = 500;

    for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
      const batch = normalized.slice(i, i + BATCH_SIZE);
      await this.prisma.$transaction(
        batch.map((n) =>
          this.prisma.logEntry.create({
            data: {
              level: n.level,
              message: n.message,
              source: n.source,
              timestamp: n.timestamp,
              rawLog: n.rawLog,
              ingestionSource: n.ingestionSource,
              format: n.format,
              metadata: n.metadata as object,
            },
          }),
        ),
      );
      ingested += batch.length;
    }

    const durationMs = Date.now() - start;

    this.logger.log(
      `File "${file.originalname}": ${ingested} ingested, ` +
        `${failed} failed, ${skippedEmpty} empty — ${durationMs}ms`,
    );

    return {
      filename: file.originalname,
      totalLines: allLines.length,
      ingested,
      failed,
      skippedEmpty,
      durationMs,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Internal helpers                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Guard: reject files that are clearly not plain text or exceed the
   * line-count safety limit.
   */
  private validateFile(file: Express.Multer.File): void {
    const allowedMime = ['text/plain', 'application/octet-stream'];
    if (!allowedMime.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Only plain-text files are accepted.`,
      );
    }

    // Quick sanity check — count newlines without splitting
    const lineCount =
      (file.buffer.toString('utf-8').match(/\n/g) || []).length + 1;
    if (lineCount > IngestionService.MAX_LINES) {
      throw new BadRequestException(
        `File has ~${lineCount} lines which exceeds the ${IngestionService.MAX_LINES} line limit. ` +
          'Split the file into smaller chunks and upload each separately.',
      );
    }
  }
}
