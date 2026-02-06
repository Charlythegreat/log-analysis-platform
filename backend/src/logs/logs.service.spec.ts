import { Test, TestingModule } from '@nestjs/testing';
import { LogsService } from './logs.service';
import { PrismaService } from '../prisma';

// Minimal Prisma mock for unit testing
const mockPrisma = {
  logEntry: {
    create: jest.fn().mockResolvedValue({
      id: 'test-uuid',
      level: 'info',
      message: 'test message',
      source: 'test-service',
      timestamp: new Date(),
      rawLog: '{}',
      ingestionSource: 'api',
      format: 'structured',
      metadata: {},
      createdAt: new Date(),
    }),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },
  $transaction: jest.fn().mockImplementation((args: unknown[]) =>
    Promise.all(args as Promise<unknown>[]),
  ),
};

describe('LogsService', () => {
  let service: LogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LogsService>(LogsService);
    jest.clearAllMocks();
  });

  it('should create a log entry via Prisma', async () => {
    const result = await service.create({
      level: 'info' as any,
      message: 'test message',
      source: 'test-service',
    });

    expect(result).toHaveProperty('id');
    expect(mockPrisma.logEntry.create).toHaveBeenCalledTimes(1);
  });

  it('should query logs with pagination', async () => {
    mockPrisma.$transaction.mockResolvedValueOnce([[], 0]);

    const result = await service.findAll({ page: 1, limit: 10 });

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page', 1);
    expect(result).toHaveProperty('limit', 10);
  });
});
