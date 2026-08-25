'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { fetchCurrentUserProfile } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function UserAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkRole = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
          // Guest user (not logged in) is allowed on user public pages
          if (isMounted) {
            setIsAdmin(false);
            setIsChecking(false);
          }
          return;
        }

        const authUser = data.user;

        try {
          const profile = await fetchCurrentUserProfile();
          if (profile?.role === 'ADMIN') {
            if (isMounted) {
              setIsAdmin(true);
              setIsChecking(false);
            }
            router.replace('/admin');
            return;
          }
        } catch {
          // Fallback check metadata if offline / first load
          const isMetaAdmin =
            authUser.user_metadata?.role === 'ADMIN' ||
            authUser.app_metadata?.role === 'ADMIN' ||
            authUser.email?.toLowerCase().startsWith('admin');

          if (isMetaAdmin) {
            if (isMounted) {
              setIsAdmin(true);
              setIsChecking(false);
            }
            router.replace('/admin');
            return;
          }
        }

        if (isMounted) {
          setIsAdmin(false);
          setIsChecking(false);
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
          setIsChecking(false);
        }
      }
    };

    void checkRole();

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            void checkRole();
          } else {
            if (isMounted) {
              setIsAdmin(false);
              setIsChecking(false);
            }
          }
        },
      );

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    } catch {
      return () => {
        isMounted = false;
      };
    }
  }, [router]);

  if (isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] text-[#191c1d]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#006e2f]" />
          <p className="text-sm font-semibold text-[#575e70]">
            Tài khoản Quản trị viên — Đang chuyển hướng đến trang Admin...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
