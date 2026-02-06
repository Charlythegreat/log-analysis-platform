import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma';
import { ParsingService } from '../parsing';
import { NormalizationService } from '../normalization';
import { LogLevel } from '../common';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Build a minimal Express.Multer.File from a string body. */
function fakeFile(
  content: string,
  originalname = 'app.log',
  mimetype = 'text/plain',
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype,
    buffer: Buffer.from(content, 'utf-8'),
    size: Buffer.byteLength(content, 'utf-8'),
    stream: undefined as any,
    destination: '',
    filename: '',
    path: '',
  };
}

/* ------------------------------------------------------------------ */
/*  Test suite                                                         */
/* ------------------------------------------------------------------ */

describe('IngestionService – file upload', () => {
  let service: IngestionService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        ParsingService,
        NormalizationService,
        {
          provide: PrismaService,
          useValue: {
            logEntry: {
              create: jest.fn().mockImplementation(({ data }) =>
                Promise.resolve({ id: 'uuid-1', createdAt: new Date(), ...data }),
              ),
            },
            $transaction: jest
              .fn()
              .mockImplementation((ops: Promise<any>[]) => Promise.all(ops)),
          },
        },
      ],
    }).compile();

    service = module.get(IngestionService);
    prisma = module.get(PrismaService);
  });

  /* ---------- happy-path tests ---------- */

  it('should ingest a simple multi-line text file', async () => {
    const content = [
      '{"level":"info","msg":"boot","service":"api"}',
      '{"level":"error","msg":"timeout","service":"api"}',
    ].join('\n');

    const result = await service.ingestFile(fakeFile(content));

    expect(result.filename).toBe('app.log');
    expect(result.totalLines).toBe(2);
    expect(result.ingested).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.skippedEmpty).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should skip empty and whitespace-only lines', async () => {
    const content = [
      '{"level":"info","msg":"ok","service":"web"}',
      '',
      '   ',
      '{"level":"warn","msg":"slow","service":"web"}',
      '',
    ].join('\n');

    const result = await service.ingestFile(fakeFile(content));

    expect(result.ingested).toBe(2);
    expect(result.skippedEmpty).toBe(3); // 2 empty + 1 whitespace
  });

  it('should count lines that fail to parse', async () => {
    // One valid JSON line, one completely unparseable binary-looking mess
    // that the fallback parser will still handle — so we inject a mock error.
    const parseSpy = jest
      .spyOn(service['parser'], 'parse')
      .mockImplementationOnce(() => {
        throw new Error('Intentional parse failure');
      })
      .mockImplementationOnce(() => ({
        level: LogLevel.INFO,
        message: 'ok',
        source: 'test',
        fields: {},
        format: 'test',
      }));

    const content = ['BAD_LINE', 'GOOD_LINE'].join('\n');
    const result = await service.ingestFile(fakeFile(content));

    expect(result.failed).toBe(1);
    expect(result.ingested).toBe(1);

    parseSpy.mockRestore();
  });

  it('should propagate custom ingestionSource', async () => {
    const content = '{"level":"info","msg":"ci build","service":"runner"}';
    await service.ingestFile(fakeFile(content), 'ci-pipeline');

    // The $transaction receives an array of create promises —
    // inspect the first create call's data.
    const createCalls = (prisma.logEntry.create as jest.Mock).mock.calls;
    expect(createCalls[0][0].data.ingestionSource).toBe('ci-pipeline');
  });

  it('should default ingestionSource to "file-upload"', async () => {
    const content = '{"level":"info","msg":"hello","service":"app"}';
    await service.ingestFile(fakeFile(content));

    const createCalls = (prisma.logEntry.create as jest.Mock).mock.calls;
    expect(createCalls[0][0].data.ingestionSource).toBe('file-upload');
  });

  it('should handle Windows-style line endings (CRLF)', async () => {
    const content = 'line one\r\nline two\r\nline three\r\n';
    const result = await service.ingestFile(fakeFile(content));

    // Trailing \r\n produces one extra empty line at the end
    expect(result.ingested).toBe(3);
    expect(result.skippedEmpty).toBe(1);
  });

  /* ---------- validation / error tests ---------- */

  it('should reject files with unsupported MIME type', async () => {
    const file = fakeFile('data', 'image.png', 'image/png');

    await expect(service.ingestFile(file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject files that exceed the line-count limit', async () => {
    // Build a file with 50_001+ lines
    const bigContent = Array.from({ length: 50_001 }, (_, i) => `line ${i}`).join('\n');
    const file = fakeFile(bigContent);

    await expect(service.ingestFile(file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should handle an empty file gracefully', async () => {
    const result = await service.ingestFile(fakeFile(''));

    expect(result.ingested).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.skippedEmpty).toBe(1); // one empty line from split
  });
});
