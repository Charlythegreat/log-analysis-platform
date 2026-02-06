import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_LOGS = [
  {
    level: 'info' as const,
    message: 'Application started successfully',
    source: 'api-gateway',
    format: 'structured',
    rawLog: '{"level":"info","message":"Application started successfully"}',
    metadata: { version: '1.2.0', env: 'staging' },
  },
  {
    level: 'error' as const,
    message: 'Connection refused: ECONNREFUSED 10.0.3.12:5432',
    source: 'user-service',
    format: 'structured',
    rawLog: '{"level":"error","message":"Connection refused"}',
    metadata: { host: '10.0.3.12', port: 5432 },
  },
  {
    level: 'warn' as const,
    message: 'Disk usage at 91% on /dev/sda1',
    source: 'monitoring-agent',
    format: 'structured',
    rawLog: '{"level":"warn","message":"Disk usage at 91%"}',
    metadata: { partition: '/dev/sda1', usagePercent: 91 },
  },
  {
    level: 'debug' as const,
    message: 'Cache miss for key user:profile:42',
    source: 'cache-layer',
    format: 'structured',
    rawLog: '{"level":"debug","message":"Cache miss"}',
    metadata: { key: 'user:profile:42' },
  },
  {
    level: 'fatal' as const,
    message: 'Out of memory — process killed by OOM killer',
    source: 'worker-3',
    format: 'structured',
    rawLog: '{"level":"fatal","message":"OOM"}',
    metadata: { pid: 29481, memoryMB: 4096 },
  },
];

async function main() {
  console.log('🌱 Seeding database…');

  for (const log of SAMPLE_LOGS) {
    await prisma.logEntry.create({ data: log });
  }

  const count = await prisma.logEntry.count();
  console.log(`✓ Seeded ${count} log entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
