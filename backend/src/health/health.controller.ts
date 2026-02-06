import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health-check endpoint' })
  async check() {
    let db = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'connected';
    } catch {
      db = 'error';
    }

    return {
      status: db === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: db,
    };
  }
}
