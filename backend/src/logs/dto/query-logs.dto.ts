import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LogLevel } from '../../common';

export class QueryLogsDto {
  @ApiPropertyOptional({ enum: LogLevel, example: 'error' })
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @ApiPropertyOptional({ example: 'auth-service' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'login' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'syslog-agent', description: 'Filter by ingestion source' })
  @IsOptional()
  @IsString()
  ingestionSource?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
