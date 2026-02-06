import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Log Analysis Platform',
  description: 'Real-time log monitoring and analysis dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
