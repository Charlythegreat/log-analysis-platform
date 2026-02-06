import { IsString, IsOptional, IsEnum, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogLevel } from '../../common';

/**
 * DTO for ingesting a single structured log entry.
 * The caller already knows the level, message, and source.
 */
export class IngestLogDto {
  @ApiProperty({ enum: LogLevel, example: 'info' })
  @IsEnum(LogLevel)
  level: LogLevel;

  @ApiProperty({ example: 'User login succeeded' })
  @IsString()
  @MaxLength(10_240)
  message: string;

  @ApiProperty({ example: 'auth-service' })
  @IsString()
  @MaxLength(255)
  source: string;

  @ApiPropertyOptional({
    example: 'api',
    description: 'Channel that delivered this log (api, syslog-agent, file-upload, …)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ingestionSource?: string;

  @ApiPropertyOptional({ example: { userId: '123', region: 'us-east' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
