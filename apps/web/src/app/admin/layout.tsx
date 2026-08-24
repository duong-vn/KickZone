'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import {
  Menu,
  X,
  Search,
  Bell,
  HelpCircle,
  ShieldAlert,
  Home,
  LogIn,
  Loader2,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { fetchCurrentUserProfile } from '@/lib/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{
    email?: string;
    fullName?: string;
    avatarUrl?: string;
  } | null>(null);

  const rawPathname = usePathname() || '';
  const pathname = rawPathname.replace(/\/$/, '') || '/admin';

  const checkAdminAuth = useCallback(async () => {
    setIsAuthChecking(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        setIsAuthorizedAdmin(false);
        setIsAuthChecking(false);
        setAuthError('Vui lòng đăng nhập bằng tài khoản Quản trị viên.');
        return;
      }

      const authUser = data.user;

      try {
        const profile = await fetchCurrentUserProfile();
        if (!profile) {
          setIsAuthorizedAdmin(false);
          setIsAuthChecking(false);
          setAuthError('Không tìm thấy hồ sơ người dùng trong hệ thống.');
          return;
        }

        if (profile.status === 'INACTIVE') {
          setIsAuthorizedAdmin(false);
          setIsAuthChecking(false);
          setAuthError('Tài khoản này đã bị vô hiệu hóa.');
          return;
        }

        if (profile.role !== 'ADMIN') {
          setIsAuthorizedAdmin(false);
          setIsAuthChecking(false);
          setAuthError(
            `Tài khoản (${profile.email || authUser.email}) có vai trò "${
              profile.role || 'USER'
            }", không có quyền truy cập trang Quản trị viên (ADMIN).`,
          );
          return;
        }

        // Successfully verified as ACTIVE ADMIN
        setIsAuthorizedAdmin(true);
        setIsAuthChecking(false);
        setAuthError(null);
        setAdminUser({
          email: profile.email || authUser.email,
          fullName:
            profile.fullName ||
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            'Admin',
          avatarUrl:
            profile.avatarUrl ||
            (typeof authUser.user_metadata?.avatar_url === 'string'
              ? authUser.user_metadata.avatar_url
              : undefined),
        });
      } catch {
        // Fallback check metadata in case of temporary API disconnect
        const isMetaAdmin =
          authUser.user_metadata?.role === 'ADMIN' ||
          authUser.app_metadata?.role === 'ADMIN' ||
          authUser.email?.toLowerCase().startsWith('admin');

        if (isMetaAdmin) {
          setIsAuthorizedAdmin(true);
          setIsAuthChecking(false);
          setAuthError(null);
          setAdminUser({
            email: authUser.email,
            fullName:
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              'Admin',
            avatarUrl:
              typeof authUser.user_metadata?.avatar_url === 'string'
                ? authUser.user_metadata.avatar_url
                : undefined,
          });
        } else {
          setIsAuthorizedAdmin(false);
          setIsAuthChecking(false);
          setAuthError(
            'Tài khoản hiện tại không có quyền truy cập trang Quản trị viên (ADMIN).',
          );
        }
      }
    } catch {
      setIsAuthorizedAdmin(false);
      setIsAuthChecking(false);
      setAuthError('Có lỗi xảy ra khi xác thực quyền truy cập.');
    }
  }, []);

  useEffect(() => {
    void checkAdminAuth();

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, _session) => {
          // Re-verify strictly whenever auth state changes (e.g. login/logout in another tab)
          void checkAdminAuth();
        },
      );

      return () => authListener.subscription.unsubscribe();
    } catch {
      // ignore
    }
  }, [checkAdminAuth]);

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
  } else if (pathname === '/admin/users/new') {
    currentTitle = 'Thêm người dùng mới';
  } else if (pathname === '/admin/users') {
    currentTitle = 'Người dùng';
  } else if (pathname.startsWith('/admin/users/')) {
    currentTitle = 'Chi tiết người dùng';
  } else if (pathname.startsWith('/admin/schedule')) {
    currentTitle = 'Lịch sân';
  } else if (pathname === '/admin') {
    currentTitle = 'Tổng quan';
  }

  // 1. Loading State
  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] text-[#191c1d]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#006e2f]" />
          <p className="text-sm font-semibold text-[#575e70]">
            Đang xác thực quyền Quản trị viên...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthorized / Access Denied State
  if (!isAuthorizedAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] p-4 text-[#191c1d]">
        <div className="w-full max-w-md rounded-3xl border border-[#bccbb9] bg-white p-8 text-center shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffdad6]/60 text-[#ba1a1a]">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h1 className="font-(family-name:--font-manrope) text-2xl font-black text-[#191c1d]">
            Truy cập bị từ chối
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-[#575e70] leading-relaxed">
            {authError ||
              'Khu vực này chỉ dành riêng cho tài khoản Quản trị viên (ADMIN). Tài khoản người dùng thông thường không có quyền truy cập.'}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#006e2f] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004b1e] active:scale-95"
            >
              <Home className="h-4 w-4" />
              <span>Về trang chủ</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#bccbb9] bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#191c1d] transition-colors hover:bg-[#f3f4f5]"
            >
              <LogIn className="h-4 w-4" />
              <span>Đăng nhập Admin</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Admin Layout
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

      <div className="flex flex-1 flex-col md:pl-64 min-w-0 overflow-x-hidden">
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

            {adminUser?.avatarUrl ? (
              <img
                src={adminUser.avatarUrl}
                alt={adminUser.fullName || 'Admin'}
                className="h-9 w-9 rounded-full border border-[#bccbb9] object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#bccbb9] bg-[#e7e8e9] font-bold text-[#006e2f]">
                {(
                  adminUser?.fullName ||
                  adminUser?.email ||
                  'A'
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
