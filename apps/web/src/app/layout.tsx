import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Manrope } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KickZone',
  description: 'Nền tảng đặt sân bóng đá',
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
