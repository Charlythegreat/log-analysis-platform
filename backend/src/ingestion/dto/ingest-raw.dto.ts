import {
  IsString,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for ingesting one or more raw (unparsed) log lines.
 * The platform will auto-detect the format, parse, normalize,
 * and persist each line.
 */
export class IngestRawDto {
  @ApiProperty({
    example: [
      'Feb  6 14:12:01 web-01 sshd[4512]: Accepted publickey for deploy',
      '{"level":"error","msg":"connection refused","service":"api-gw"}',
    ],
    description: 'Array of raw log lines (any format)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  @MaxLength(20_000, { each: true })
  lines: string[];

  @ApiPropertyOptional({
    example: 'syslog-agent',
    description: 'Channel that delivered these logs (api, syslog-agent, file-upload, …)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ingestionSource?: string;
}
