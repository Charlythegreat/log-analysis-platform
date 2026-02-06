import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ParsingService } from '../parsing';
import { NormalizationService } from '../normalization';
import { NormalizedLog } from '../common';
import { IngestLogDto, IngestRawDto } from './dto';
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
}
