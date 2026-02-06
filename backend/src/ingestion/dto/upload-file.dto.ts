import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Optional metadata that accompanies a file upload.
 * Sent as form fields alongside the file.
 */
export class UploadFileDto {
  @ApiPropertyOptional({
    example: 'file-upload',
    description:
      'Channel that delivered this file (file-upload, ci-pipeline, …)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ingestionSource?: string;
}
