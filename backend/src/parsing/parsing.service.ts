import { Injectable, Logger } from '@nestjs/common';
import { ParsedLog, LogLevel } from '../common';
import { BUILTIN_PATTERNS, mapLevel } from './patterns';

@Injectable()
export class ParsingService {
  private readonly logger = new Logger(ParsingService.name);

  /**
   * Parse a raw log string into a structured ParsedLog.
   *
   * Strategy:
   *  1. Try JSON parse first (structured logs).
   *  2. Fall through the built-in regex patterns (first match wins).
   *  3. If nothing matches, return a raw/unknown result.
   */
  parse(raw: string): ParsedLog {
    const trimmed = raw.trim();

    // ── 1. JSON strategy ──────────────────────────────────
    if (trimmed.startsWith('{')) {
      try {
        const json = JSON.parse(trimmed);
        return this.fromJson(json);
      } catch {
        // Not valid JSON — fall through to regex
      }
    }

    // ── 2. Regex strategy ─────────────────────────────────
    for (const pattern of BUILTIN_PATTERNS) {
      const match = pattern.regex.exec(trimmed);
      if (match) {
        const parsed = pattern.extract(match);
        return {
          level: parsed.level,
          message: parsed.message,
          source: parsed.source,
          timestamp: parsed.timestamp,
          fields: parsed.fields ?? {},
          format: parsed.format ?? pattern.name,
        };
      }
    }

    // ── 3. Fallback — treat entire line as message ────────
    this.logger.debug(`No pattern matched, treating as raw: "${trimmed.slice(0, 80)}…"`);
    return {
      message: trimmed,
      fields: {},
      format: 'unknown',
    };
  }

  /**
   * Parse multiple raw log lines (e.g. from a bulk upload).
   */
  parseMany(rawLines: string[]): ParsedLog[] {
    return rawLines.map((line) => this.parse(line));
  }

  // ── Private: JSON extraction ────────────────────────────

  private fromJson(obj: Record<string, unknown>): ParsedLog {
    // Support common JSON log shapes:
    //   { "level": "error", "msg": "...", "timestamp": "..." }
    //   { "severity": "ERROR", "message": "...", "time": "..." }
    const rawLevel =
      (obj.level as string) ??
      (obj.severity as string) ??
      (obj.loglevel as string);

    const message =
      (obj.message as string) ??
      (obj.msg as string) ??
      (obj.error as string) ??
      JSON.stringify(obj);

    const rawTs =
      (obj.timestamp as string) ??
      (obj.time as string) ??
      (obj['@timestamp'] as string) ??
      (obj.ts as string);
    const timestamp = rawTs ? new Date(rawTs) : undefined;

    const source =
      (obj.source as string) ??
      (obj.service as string) ??
      (obj.logger as string) ??
      (obj.hostname as string);

    // Everything else goes into fields
    const reserved = new Set([
      'level', 'severity', 'loglevel',
      'message', 'msg', 'error',
      'timestamp', 'time', '@timestamp', 'ts',
      'source', 'service', 'logger', 'hostname',
    ]);
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!reserved.has(k)) fields[k] = v;
    }

    return {
      level: mapLevel(rawLevel),
      message,
      source,
      timestamp:
        timestamp && !isNaN(timestamp.getTime()) ? timestamp : undefined,
      fields,
      format: 'json',
    };
  }
}
