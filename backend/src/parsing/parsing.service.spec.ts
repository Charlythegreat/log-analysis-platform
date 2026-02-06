import { ParsingService } from './parsing.service';
import { LogLevel } from '../common';

describe('ParsingService', () => {
  let service: ParsingService;

  beforeEach(() => {
    service = new ParsingService();
  });

  // ── JSON parsing ──────────────────────────────────────

  describe('JSON logs', () => {
    it('should parse a standard JSON log', () => {
      const raw = '{"level":"error","message":"Connection refused","service":"api-gw","requestId":"abc"}';
      const result = service.parse(raw);

      expect(result.format).toBe('json');
      expect(result.level).toBe(LogLevel.ERROR);
      expect(result.message).toBe('Connection refused');
      expect(result.source).toBe('api-gw');
      expect(result.fields).toHaveProperty('requestId', 'abc');
    });

    it('should parse JSON with "msg" and "severity"', () => {
      const raw = '{"severity":"WARNING","msg":"disk usage 91%","hostname":"db-01"}';
      const result = service.parse(raw);

      expect(result.format).toBe('json');
      expect(result.level).toBe(LogLevel.WARN);
      expect(result.message).toBe('disk usage 91%');
      expect(result.source).toBe('db-01');
    });

    it('should parse JSON with timestamp', () => {
      const raw = '{"level":"info","message":"started","timestamp":"2026-02-06T12:00:00Z"}';
      const result = service.parse(raw);

      expect(result.timestamp).toEqual(new Date('2026-02-06T12:00:00Z'));
    });
  });

  // ── Syslog parsing ────────────────────────────────────

  describe('Syslog', () => {
    it('should parse a standard syslog line', () => {
      const raw = 'Feb  6 14:12:01 web-01 sshd[4512]: Accepted publickey for deploy';
      const result = service.parse(raw);

      expect(result.format).toBe('syslog');
      expect(result.source).toBe('web-01');
      expect(result.message).toBe('Accepted publickey for deploy');
      expect(result.fields).toHaveProperty('process', 'sshd');
      expect(result.fields).toHaveProperty('pid', 4512);
    });
  });

  // ── CLF / Apache / Nginx access logs ──────────────────

  describe('CLF (Common Log Format)', () => {
    it('should parse an Apache/Nginx access log line', () => {
      const raw = '192.168.1.1 - admin [06/Feb/2026:14:12:01 +0000] "GET /api/health HTTP/1.1" 200 1234';
      const result = service.parse(raw);

      expect(result.format).toBe('clf');
      expect(result.source).toBe('192.168.1.1');
      expect(result.level).toBe(LogLevel.INFO);
      expect(result.fields).toHaveProperty('method', 'GET');
      expect(result.fields).toHaveProperty('path', '/api/health');
      expect(result.fields).toHaveProperty('status', 200);
    });

    it('should set level to ERROR for 500 status', () => {
      const raw = '10.0.0.1 - - [06/Feb/2026:14:12:01 +0000] "POST /submit HTTP/1.1" 502 0';
      const result = service.parse(raw);

      expect(result.level).toBe(LogLevel.ERROR);
    });
  });

  // ── Generic timestamp + level pattern ─────────────────

  describe('Generic pattern', () => {
    it('should parse a generic timestamped log', () => {
      const raw = '2026-02-06T14:12:01.123Z [ERROR] auth-service: Connection refused';
      const result = service.parse(raw);

      expect(result.format).toBe('generic');
      expect(result.level).toBe(LogLevel.ERROR);
      expect(result.source).toBe('auth-service');
      expect(result.message).toBe('Connection refused');
    });
  });

  // ── Fallback ──────────────────────────────────────────

  describe('Unknown format', () => {
    it('should return raw message for unrecognised lines', () => {
      const raw = 'just some random text without structure';
      const result = service.parse(raw);

      expect(result.format).toBe('unknown');
      expect(result.message).toBe(raw);
    });
  });

  // ── parseMany ─────────────────────────────────────────

  describe('parseMany', () => {
    it('should parse an array of mixed lines', () => {
      const lines = [
        '{"level":"info","message":"ok"}',
        'Feb  6 14:12:01 web-01 nginx: GET /index.html',
        'just a plain line',
      ];
      const results = service.parseMany(lines);

      expect(results).toHaveLength(3);
      expect(results[0].format).toBe('json');
      expect(results[1].format).toBe('syslog');
      expect(results[2].format).toBe('unknown');
    });
  });
});
