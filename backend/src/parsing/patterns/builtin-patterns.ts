import { LogPattern } from './log-pattern.interface';
import { LogLevel } from '../../common';

// ── Helpers ──────────────────────────────────────────────

const LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  dbg: LogLevel.DEBUG,
  trace: LogLevel.DEBUG,
  info: LogLevel.INFO,
  information: LogLevel.INFO,
  notice: LogLevel.INFO,
  warn: LogLevel.WARN,
  warning: LogLevel.WARN,
  error: LogLevel.ERROR,
  err: LogLevel.ERROR,
  critical: LogLevel.FATAL,
  fatal: LogLevel.FATAL,
  crit: LogLevel.FATAL,
  alert: LogLevel.FATAL,
  emerg: LogLevel.FATAL,
};

export function mapLevel(raw: string | undefined): LogLevel | undefined {
  if (!raw) return undefined;
  return LEVEL_MAP[raw.toLowerCase()];
}

// ── 1. Syslog (RFC 3164) ────────────────────────────────
// Example: Feb  6 14:12:01 web-01 sshd[4512]: Accepted publickey for deploy
const SYSLOG_RE =
  /^(?<month>\w{3})\s+(?<day>\d{1,2})\s+(?<time>\d{2}:\d{2}:\d{2})\s+(?<host>\S+)\s+(?<process>\S+?)(?:\[(?<pid>\d+)\])?:\s+(?<message>.+)$/;

export const syslogPattern: LogPattern = {
  name: 'syslog',
  regex: SYSLOG_RE,
  extract(match) {
    const g = match.groups!;
    const year = new Date().getFullYear();
    const timestamp = new Date(`${g.month} ${g.day} ${year} ${g.time}`);
    return {
      source: g.host,
      message: g.message,
      timestamp: isNaN(timestamp.getTime()) ? undefined : timestamp,
      fields: {
        process: g.process,
        pid: g.pid ? Number(g.pid) : undefined,
      },
      format: 'syslog',
    };
  },
};

// ── 2. Common Log Format (CLF) / Apache / Nginx access ──
// Example: 192.168.1.1 - admin [06/Feb/2026:14:12:01 +0000] "GET /api HTTP/1.1" 200 1234
const CLF_RE =
  /^(?<ip>\S+)\s+\S+\s+(?<user>\S+)\s+\[(?<datetime>[^\]]+)\]\s+"(?<method>\w+)\s+(?<path>\S+)\s+\S+"\s+(?<status>\d{3})\s+(?<bytes>\d+|-)(?:\s+"(?<referer>[^"]*)"\s+"(?<ua>[^"]*)")?$/;

export const clfPattern: LogPattern = {
  name: 'clf',
  regex: CLF_RE,
  extract(match) {
    const g = match.groups!;
    // Parse CLF date: 06/Feb/2026:14:12:01 +0000
    const ts = g.datetime.replace(
      /(\d{2})\/(\w{3})\/(\d{4}):(\d{2}:\d{2}:\d{2})\s+([+-]\d{4})/,
      '$2 $1, $3 $4 GMT$5',
    );
    const timestamp = new Date(ts);
    const status = Number(g.status);
    return {
      source: g.ip,
      message: `${g.method} ${g.path} ${g.status}`,
      level:
        status >= 500
          ? LogLevel.ERROR
          : status >= 400
            ? LogLevel.WARN
            : LogLevel.INFO,
      timestamp: isNaN(timestamp.getTime()) ? undefined : timestamp,
      fields: {
        method: g.method,
        path: g.path,
        status,
        bytes: g.bytes === '-' ? 0 : Number(g.bytes),
        user: g.user === '-' ? undefined : g.user,
        referer: g.referer,
        userAgent: g.ua,
      },
      format: 'clf',
    };
  },
};

// ── 3. Generic timestamp + level pattern ─────────────────
// Example: 2026-02-06T14:12:01.123Z [ERROR] auth-service: Connection refused
const GENERIC_RE =
  /^(?<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+\[?(?<level>\w+)\]?\s+(?:(?<source>[\w.-]+):\s+)?(?<message>.+)$/;

export const genericPattern: LogPattern = {
  name: 'generic',
  regex: GENERIC_RE,
  extract(match) {
    const g = match.groups!;
    const timestamp = new Date(g.timestamp);
    return {
      level: mapLevel(g.level),
      source: g.source,
      message: g.message,
      timestamp: isNaN(timestamp.getTime()) ? undefined : timestamp,
      fields: {},
      format: 'generic',
    };
  },
};

// ── Pattern registry (order matters — first match wins) ──
export const BUILTIN_PATTERNS: LogPattern[] = [
  syslogPattern,
  clfPattern,
  genericPattern,
];
