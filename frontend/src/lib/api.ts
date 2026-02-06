const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchLogs(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_URL}/logs${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createLog(body: {
  level: string;
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${API_URL}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
