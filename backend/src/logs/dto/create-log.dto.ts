/**
 * @deprecated — Use IngestLogDto from the ingestion module instead.
 * Kept for backwards compatibility with POST /api/logs.
 */
import { IsString, IsOptional, IsEnum, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogLevel } from '../../common';

export { LogLevel };

export class CreateLogDto {
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
    description: 'Channel that delivered this log',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ingestionSource?: string;

  @ApiPropertyOptional({ example: { userId: '123' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
