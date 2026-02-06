import { NormalizationService } from './normalization.service';
import { LogLevel, ParsedLog } from '../common';

describe('NormalizationService', () => {
  let service: NormalizationService;

  beforeEach(() => {
    service = new NormalizationService();
  });

  it('should fill defaults for missing fields', () => {
    const parsed: ParsedLog = {
      fields: {},
      format: 'unknown',
    };

    const result = service.normalize(parsed, 'raw line');

    expect(result.level).toBe(LogLevel.INFO);
    expect(result.source).toBe('unknown');
    expect(result.message).toBe('(empty)');
    expect(result.rawLog).toBe('raw line');
    expect(result.ingestionSource).toBe('api');
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should preserve valid parsed values', () => {
    const ts = new Date('2026-02-06T12:00:00Z');
    const parsed: ParsedLog = {
      level: LogLevel.ERROR,
      message: 'disk full',
      source: 'DB-Master',
      timestamp: ts,
      fields: { partition: '/dev/sda1' },
      format: 'json',
    };

    const result = service.normalize(parsed, '{}');

    expect(result.level).toBe(LogLevel.ERROR);
    expect(result.message).toBe('disk full');
    expect(result.source).toBe('db-master'); // lowercased
    expect(result.timestamp).toEqual(ts);
    expect(result.metadata).toEqual({ partition: '/dev/sda1' });
  });

  it('should propagate a custom ingestionSource', () => {
    const parsed: ParsedLog = {
      level: LogLevel.INFO,
      message: 'test',
      fields: {},
      format: 'json',
    };

    const result = service.normalize(parsed, '{}', 'syslog-agent');
    expect(result.ingestionSource).toBe('syslog-agent');
  });

  it('should truncate very long messages', () => {
    const parsed: ParsedLog = {
      message: 'x'.repeat(20_000),
      fields: {},
      format: 'test',
    };

    const result = service.normalize(parsed, 'raw');

    expect(result.message.length).toBeLessThanOrEqual(10_240 + 20); // truncation marker
    expect(result.message).toContain('[truncated]');
  });

  it('should strip null/undefined from metadata', () => {
    const parsed: ParsedLog = {
      fields: { a: 1, b: null, c: undefined, d: 'ok' },
      format: 'test',
    };

    const result = service.normalize(parsed, 'raw');

    expect(result.metadata).toEqual({ a: 1, d: 'ok' });
  });

  it('should normalizeMany', () => {
    const items = [
      { parsed: { fields: {}, format: 'a' } as ParsedLog, raw: 'r1' },
      { parsed: { fields: {}, format: 'b' } as ParsedLog, raw: 'r2' },
    ];

    const results = service.normalizeMany(items);
    expect(results).toHaveLength(2);
  });
});
