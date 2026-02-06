import { Injectable, Logger } from '@nestjs/common';
import { Prisma, LogEntry } from '@prisma/client';
import { PrismaService } from '../prisma';
import { CreateLogDto } from './dto/create-log.dto';
import { QueryLogsDto } from './dto/query-logs.dto';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a log entry directly (backwards-compatible endpoint).
   */
  async create(dto: CreateLogDto): Promise<LogEntry> {
    return this.prisma.logEntry.create({
      data: {
        level: dto.level,
        message: dto.message,
        source: dto.source.toLowerCase(),
        rawLog: JSON.stringify(dto),
        ingestionSource: dto.ingestionSource || 'api',
        format: 'structured',
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Query logs with filtering, search, pagination.
   */
  async findAll(query: QueryLogsDto): Promise<{
    data: LogEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: Prisma.LogEntryWhereInput = {};

    if (query.level) {
      where.level = query.level;
    }
    if (query.source) {
      where.source = { contains: query.source.toLowerCase(), mode: 'insensitive' };
    }
    if (query.search) {
      where.message = { contains: query.search, mode: 'insensitive' };
    }
    if (query.ingestionSource) {
      where.ingestionSource = query.ingestionSource;
    }
    if (query.from || query.to) {
      where.timestamp = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.logEntry.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
