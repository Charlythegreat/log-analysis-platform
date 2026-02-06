'use client';

import { useEffect, useState } from 'react';

interface LogEntry {
  id: string;
  level: string;
  message: string;
  source: string;
  timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function LogTable() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch(`${API_URL}/logs`);
        const json = await res.json();
        setLogs(json.data ?? []);
      } catch {
        console.error('Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  if (loading) return <p>Loading logs…</p>;
  if (logs.length === 0) return <p>No log entries yet.</p>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Level</th>
          <th>Source</th>
          <th>Message</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td data-level={log.level}>{log.level.toUpperCase()}</td>
            <td>{log.source}</td>
            <td>{log.message}</td>
            <td>{new Date(log.timestamp).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
