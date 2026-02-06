import { Injectable, Logger } from '@nestjs/common';
import { ParsedLog, NormalizedLog, LogLevel } from '../common';

/**
 * Normalization rules applied when a parsed field is missing a required value.
 */
const DEFAULTS = {
  level: LogLevel.INFO,
  source: 'unknown',
  message: '(empty)',
} as const;

@Injectable()
export class NormalizationService {
  private readonly logger = new Logger(NormalizationService.name);

  /**
   * Transform a ParsedLog into a NormalizedLog by:
   *  1. Filling defaults for missing required fields.
   *  2. Coercing timestamps to Date objects.
   *  3. Canonicalising the level string to the LogLevel enum.
   *  4. Merging extra parsed fields into a clean metadata object.
   */
  normalize(parsed: ParsedLog, rawLog: string, ingestionSource = 'api'): NormalizedLog {
    return {
      level: this.normalizeLevel(parsed.level),
      message: this.normalizeMessage(parsed.message),
      source: this.normalizeSource(parsed.source),
      timestamp: this.normalizeTimestamp(parsed.timestamp),
      rawLog,
      ingestionSource: ingestionSource || 'api',
      format: parsed.format,
      metadata: this.normalizeMetadata(parsed.fields),
    };
  }

  /**
   * Batch-normalize an array of parsed logs.
   */
  normalizeMany(
    items: { parsed: ParsedLog; raw: string }[],
    ingestionSource = 'api',
  ): NormalizedLog[] {
    return items.map(({ parsed, raw }) => this.normalize(parsed, raw, ingestionSource));
  }

  // ── Private helpers ────────────────────────────────────

  private normalizeLevel(level?: LogLevel): LogLevel {
    if (level && Object.values(LogLevel).includes(level)) {
      return level;
    }
    this.logger.debug(`Unknown level "${level}", defaulting to INFO`);
    return DEFAULTS.level;
  }

  private normalizeMessage(message?: string): string {
    if (!message || message.trim().length === 0) {
      return DEFAULTS.message;
    }
    // Truncate excessively long messages (>10 KB)
    return message.length > 10_240
      ? message.slice(0, 10_240) + '… [truncated]'
      : message.trim();
  }

  private normalizeSource(source?: string): string {
    if (!source || source.trim().length === 0) {
      return DEFAULTS.source;
    }
    // Lowercase + strip trailing colons, dots
    return source.trim().toLowerCase().replace(/[\.:]+$/, '');
  }

  private normalizeTimestamp(timestamp?: Date): Date {
    if (timestamp && !isNaN(timestamp.getTime())) {
      return timestamp;
    }
    // Fall back to "now" — ingestion time
    return new Date();
  }

  private normalizeMetadata(
    fields: Record<string, unknown>,
  ): Record<string, unknown> {
    // Strip undefined/null values for a clean JSON column
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined && v !== null) {
        clean[k] = v;
      }
    }
    return clean;
  }
}
