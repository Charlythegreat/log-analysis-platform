import { LogTable } from '@/components/LogTable';

export default function HomePage() {
  return (
    <main className="container">
      <header className="header">
        <h1>Log Analysis Platform</h1>
        <p>Real-time log monitoring &amp; analysis</p>
      </header>
      <LogTable />
    </main>
  );
}
