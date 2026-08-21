'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  Users,
  CalendarCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_NAV_ITEMS = [
  {
    label: 'Tổng quan',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Đơn đặt sân',
    href: '/admin/bookings',
    icon: CalendarDays,
  },
  {
    label: 'Sân bóng',
    href: '/admin/fields',
    icon: Trophy,
  },
  {
    label: 'Người dùng',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Lịch sân',
    href: '/admin/schedule',
    icon: CalendarCheck,
  },
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#bccbb9] bg-white p-4">
      <div className="mb-8 flex items-center gap-3 px-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#22c55e] font-(family-name:--font-manrope) text-lg font-extrabold text-[#004b1e]">
          K
        </div>
        <div>
          <h1 className="font-(family-name:--font-manrope) text-xl font-extrabold leading-tight text-[#006e2f]">
            KickZone
          </h1>
          <p className="text-xs font-normal text-[#575e70]">Quản lý sân bóng</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-[#22c55e] text-[#004b1e] shadow-sm'
                  : 'text-[#3d4a3d] hover:bg-[#e7e8e9] hover:text-[#191c1d]',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[#bccbb9]/40 pt-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#575e70] transition-colors hover:bg-[#ffdad6]/50 hover:text-[#ba1a1a]"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
