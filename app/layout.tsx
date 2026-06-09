import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css'; // Global styles
import ClientAuthInterceptor from '@/components/ClientAuthInterceptor';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'bl1nk ink — The Intelligent Personal Operating System',
  description: 'A cinematic, premium workspace for managing tasks, notes, databases, and autonomous workflows. Crafted with Deep Onyx and Electric Gold.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} dark`}>
      <body suppressHydrationWarning className="bg-[#080808] text-zinc-100 min-h-screen antialiased select-none selection:bg-yellow-500/30 selection:text-yellow-200">
        <ClientAuthInterceptor />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
