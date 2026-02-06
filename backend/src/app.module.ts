import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma';
import { ParsingModule } from './parsing';
import { NormalizationModule } from './normalization';
import { IngestionModule } from './ingestion';
import { LogsModule } from './logs/logs.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({ isGlobal: true }),

    // Infrastructure
    PrismaModule,

    // Domain modules
    ParsingModule,
    NormalizationModule,
    IngestionModule,
    LogsModule,

    // Operations
    HealthModule,
  ],
})
export class AppModule {}
