import { LogLevel } from '../enums';

/**
 * Result produced by the parsing service.
 * All fields are optional because not every format yields every field.
 */
export interface ParsedLog {
  /** Detected log level */
  level?: LogLevel;
  /** Human-readable log message */
  message?: string;
  /** Originating service / host / process */
  source?: string;
  /** Timestamp extracted from the raw log */
  timestamp?: Date;
  /** Arbitrary key-value pairs extracted from the log line */
  fields: Record<string, unknown>;
  /** Name of the format that matched (e.g. 'json', 'syslog', 'clf') */
  format: string;
}

/**
 * Fully normalised log entry ready for persistence.
 */
export interface NormalizedLog {
  level: LogLevel;
  message: string;
  source: string;
  timestamp: Date;
  rawLog: string;
  /** Channel that delivered the log (api, syslog-agent, file-upload, …) */
  ingestionSource: string;
  format: string;
  metadata: Record<string, unknown>;
}
