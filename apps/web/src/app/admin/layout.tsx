'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { Menu, X, Search, Bell, HelpCircle } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const rawPathname = usePathname() || '';
  const pathname = rawPathname.replace(/\/$/, '') || '/admin';

  let currentTitle = 'Tổng quan';
  if (pathname === '/admin/bookings') {
    currentTitle = 'Quản lý đơn đặt sân';
  } else if (pathname.startsWith('/admin/bookings/')) {
    currentTitle = 'Chi tiết đơn đặt sân';
  } else if (
    pathname === '/admin/fields/new' ||
    pathname.startsWith('/admin/fields/new')
  ) {
    currentTitle = 'Thêm sân bóng mới';
  } else if (pathname === '/admin/fields') {
    currentTitle = 'Quản lý sân bóng';
  } else if (pathname.startsWith('/admin/fields/')) {
    currentTitle = 'Chi tiết sân bóng';
  } else if (pathname === '/admin/users') {
    currentTitle = 'Người dùng';
  } else if (pathname.startsWith('/admin/users/')) {
    currentTitle = 'Chi tiết người dùng';
  } else if (pathname.startsWith('/admin/schedule')) {
    currentTitle = 'Lịch sân';
  } else if (pathname === '/admin') {
    currentTitle = 'Tổng quan';
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64">
        <AdminSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-[#191c1d]/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 flex w-64 flex-col bg-white">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-[#575e70] hover:bg-[#e7e8e9]"
            >
              <X className="h-5 w-5" />
            </button>
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#bccbb9] bg-white/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-[#575e70] md:hidden hover:bg-[#e7e8e9]"
              aria-label="Mở menu sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              {currentTitle}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="h-9 w-60 rounded-full border border-[#bccbb9] bg-[#f3f4f5] pl-9 pr-4 text-xs text-[#191c1d] transition-all focus:border-[#006e2f] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              className="rounded-full p-2 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#bccbb9] bg-[#e7e8e9] font-semibold text-[#006e2f]">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
