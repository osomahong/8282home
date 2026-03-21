import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import QueryProvider from '@/components/QueryProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '딱도착 — 출근 경로 비교',
  description: '실시간 출근 경로 비교',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '딱도착',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a1a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col relative overflow-x-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1035 40%, #0d1b2a 100%)' }}
      >
        {/* Floating blur orbs */}
        <div className="orb orb-pink" aria-hidden="true" />
        <div className="orb orb-orange" aria-hidden="true" />
        <div className="orb orb-blue" aria-hidden="true" />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
