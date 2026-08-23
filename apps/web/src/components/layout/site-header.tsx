'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/fields', label: 'Tìm sân' },
  { href: '/favorites', label: 'Yêu thích' },
  { href: '/how-it-works', label: 'Cách hoạt động' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#bccbb9] bg-[#f8f9fa] shadow-sm">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-(family-name:--font-manrope) text-2xl font-extrabold tracking-tight text-[#006e2f] transition-opacity hover:opacity-90"
        >
          KICKZONE
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[#006e2f]',
                  active
                    ? 'border-b-2 border-[#006e2f] pb-1 font-bold text-[#006e2f]'
                    : 'text-[#575e70]',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#191c1d] transition-colors hover:bg-[#e7e8e9] active:scale-95"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-[#006e2f] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#006e2f]/90 active:scale-95"
          >
            Đăng ký
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-lg p-2 text-[#191c1d] md:hidden hover:bg-[#edeeef]"
          aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#bccbb9] bg-[#f8f9fa] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-[#e7e8e9] font-bold text-[#006e2f]'
                    : 'text-[#575e70] hover:bg-[#edeeef]',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-[#bccbb9] pt-4">
            <Link
              href="/login"
              className="w-full rounded-lg border border-[#bccbb9] py-2.5 text-center text-sm font-semibold text-[#191c1d] hover:bg-[#f3f4f5]"
              onClick={() => setMobileOpen(false)}
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="w-full rounded-lg bg-[#006e2f] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#006e2f]/90"
              onClick={() => setMobileOpen(false)}
            >
              Đăng ký
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
