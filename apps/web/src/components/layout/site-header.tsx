/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Menu,
  X,
  User,
  History,
  Calendar,
  LogOut,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

import { getSupabaseBrowserClient } from '@/lib/supabase';
import { fetchCurrentUserProfile } from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/fields', label: 'Tìm sân' },
  { href: '/bookings', label: 'Đơn đặt sân' },
  { href: '/favorites', label: 'Yêu thích' },
  { href: '/how-it-works', label: 'Cách hoạt động' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{
    email?: string;
    fullName?: string;
    avatarUrl?: string;
    role?: string;
  } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      const setCurrentUser = (currentUser: typeof user) => {
        setUser(currentUser);
        setIsAuthLoading(false);
      };

      const syncProfile = async (
        authUser: {
          email?: string;
          user_metadata?: Record<string, unknown>;
        } | null,
      ) => {
        if (!authUser) {
          setCurrentUser(null);
          return;
        }

        const metadata = authUser.user_metadata || {};
        const fallbackUser = {
          email: authUser.email,
          fullName:
            typeof metadata.full_name === 'string'
              ? metadata.full_name
              : (metadata.name as string | undefined),
          avatarUrl:
            typeof metadata.avatar_url === 'string'
              ? metadata.avatar_url
              : undefined,
          role:
            (metadata.role as string) ||
            (authUser.email?.toLowerCase().startsWith('admin')
              ? 'ADMIN'
              : 'USER'),
        };

        try {
          const profile = await fetchCurrentUserProfile();
          if (profile?.status === 'INACTIVE') {
            await supabase.auth.signOut();
            setCurrentUser(null);
            return;
          }

          if (profile) {
            setCurrentUser({
              email: profile.email || fallbackUser.email,
              fullName: profile.fullName || fallbackUser.fullName,
              avatarUrl: profile.avatarUrl || fallbackUser.avatarUrl,
              role: profile.role || fallbackUser.role,
            });
            return;
          }
        } catch {
          // fallback to auth session metadata
        }

        setCurrentUser(fallbackUser);
      };

      void supabase.auth.getUser().then(({ data, error }) => {
        if (error || !data.user) {
          setCurrentUser(null);
          return;
        }
        void syncProfile(data.user);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        void syncProfile(session?.user || null);
      });

      return () => data.subscription.unsubscribe();
    } catch {
      const timer = window.setTimeout(() => {
        setUser(null);
        setIsAuthLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const isLoggedIn = user !== null;
  const displayName = user?.fullName || user?.email || 'Tài khoản';

  // Close dropdown on outside click or Escape.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Không thể đăng xuất. Vui lòng thử lại.');
        return;
      }

      setDropdownOpen(false);
      setMobileOpen(false);
      toast.success('Đã đăng xuất tài khoản thành công.');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Không thể đăng xuất. Vui lòng thử lại.');
    }
  };

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#bccbb9]/40 bg-[#f8f9fa]/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {isAuthLoading && (
          <span className="sr-only">Đang kiểm tra phiên đăng nhập</span>
        )}
        {/* Brand */}
        <Link
          href="/"
          className="font-(family-name:--font-manrope) text-2xl font-extrabold tracking-tight text-[#006e2f] transition-opacity hover:opacity-90 flex items-center gap-1.5"
        >
          KICKZONE
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-xs font-semibold transition-colors hover:text-[#006e2f] py-1',
                  active
                    ? 'border-b-2 border-[#006e2f] font-bold text-[#006e2f]'
                    : 'text-[#575e70]',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {isAuthLoading ? (
            <div
              className="h-10 w-24 rounded-lg bg-[#edeeef]"
              aria-hidden="true"
            />
          ) : isLoggedIn ? (
            <div className="flex items-center gap-3">
              {/* Notification Button */}
              <button
                type="button"
                onClick={() => toast.info('Bạn không có thông báo mới nào.')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#575e70] hover:text-[#006e2f] hover:bg-[#edeeef] transition-colors active:scale-95"
                aria-label="Thông báo"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* User Avatar & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#edeeef] border border-transparent hover:border-[#bccbb9]/60 transition-all active:scale-95 cursor-pointer"
                  aria-label="Mở menu tài khoản"
                  aria-expanded={dropdownOpen}
                  aria-controls="account-menu"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-[#bccbb9]/60 bg-slate-100 shrink-0">
                    <img
                      src={
                        user?.avatarUrl ||
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuAyn4stmH_FhB4YBxaco0X6B0HM0m_qYbwmSsbm2H2NFvpQEdQKD3phbMHH4rMFvqeymeAdMH2uIFHCuRWkmnASdlA6UkkQIzGDyo4drrZibLpgLg-WKoVFnFb6a3rGxMvlCTiUCnK0SflbZvNJrlKlHCLXfnQuP7pYUqT4vSahZixGtFWS3HRTrM0PGZq7ZNbGc62pmxm7GK69dMI0ZUWep2K3g2VkLWbdwC3YcQG115vhrSA4YUeQ5Q'
                      }
                      alt={`Ảnh đại diện của ${displayName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-[#575e70] transition-transform duration-200',
                      dropdownOpen && 'rotate-180',
                    )}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    id="account-menu"
                    aria-label="Menu tài khoản"
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-xl border border-[#bccbb9]/40 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Header info */}
                    <div className="px-3 py-2.5 border-b border-[#bccbb9]/30 mb-1">
                      <div className="font-bold text-xs text-[#191c1d] flex items-center justify-between gap-1.5">
                        <span className="truncate">{displayName}</span>
                        {user?.role === 'ADMIN' ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-[10px] bg-[#22c55e]/15 text-[#006e2f] border border-[#22c55e]/30 px-1.5 py-0.5 rounded font-bold shrink-0">
                            USER
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#575e70] truncate mt-0.5">
                        {user?.email}
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="space-y-0.5 text-xs">
                      {user?.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#006e2f] bg-[#006e2f]/10 hover:bg-[#006e2f]/20 font-bold transition-colors mb-1"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#006e2f]" />
                          <span>Trang Quản trị (Admin)</span>
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#191c1d] hover:bg-[#006e2f]/10 hover:text-[#006e2f] font-medium transition-colors"
                      >
                        <User className="w-4 h-4 text-[#006e2f]" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>

                      <Link
                        href="/profile/activity"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#191c1d] hover:bg-[#006e2f]/10 hover:text-[#006e2f] font-medium transition-colors"
                      >
                        <History className="w-4 h-4 text-[#006e2f]" />
                        <span>Hoạt động của tôi</span>
                      </Link>

                      <Link
                        href="/bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#191c1d] hover:bg-[#006e2f]/10 hover:text-[#006e2f] font-medium transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-[#006e2f]" />
                        <span>Đơn đặt sân của tôi</span>
                      </Link>
                    </div>

                    {/* Logout button */}
                    <div className="border-t border-[#bccbb9]/30 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-xl p-2 text-[#191c1d] md:hidden hover:bg-[#edeeef]"
          aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#bccbb9]/40 bg-[#f8f9fa] px-6 py-4 md:hidden animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-xl px-3.5 py-2 text-xs font-medium transition-colors',
                  isLinkActive(link.href)
                    ? 'bg-[#e7e8e9] font-bold text-[#006e2f]'
                    : 'text-[#575e70] hover:bg-[#edeeef]',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {isLoggedIn ? (
            <div className="mt-4 border-t border-[#bccbb9]/40 pt-4 space-y-2 text-xs">
              <div className="px-3.5 py-1 text-xs font-bold text-[#191c1d]">
                Tài khoản: {displayName}
              </div>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[#191c1d] hover:bg-[#edeeef]"
              >
                <User className="w-4 h-4 text-[#006e2f]" />
                <span>Hồ sơ cá nhân</span>
              </Link>
              <Link
                href="/profile/activity"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[#191c1d] hover:bg-[#edeeef]"
              >
                <History className="w-4 h-4 text-[#006e2f]" />
                <span>Hoạt động của tôi</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
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
          )}
        </div>
      )}
    </header>
  );
}
