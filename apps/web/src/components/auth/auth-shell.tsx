'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';

import { cn } from '@/lib/utils';

const LOGIN_IMAGE =
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=85';
const REGISTER_IMAGE =
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1600&q=85';

export function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRegister = pathname.startsWith('/register');

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background lg:h-screen lg:overflow-hidden">
      <section
        className={cn(
          'relative hidden min-h-screen overflow-hidden bg-[#10271b] lg:absolute lg:inset-y-0 lg:left-0 lg:z-10 lg:flex lg:h-screen lg:w-1/2 lg:flex-col lg:justify-end',
          'transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none',
          isRegister ? 'lg:translate-x-full' : 'lg:translate-x-0',
        )}
      >
        <div
          key={isRegister ? 'register-image' : 'login-image'}
          className="auth-image-enter absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${isRegister ? REGISTER_IMAGE : LOGIN_IMAGE}')`,
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,20,11,0.12)_0%,rgba(3,20,11,0.3)_42%,rgba(3,20,11,0.94)_100%)]" />

        <div
          key={isRegister ? 'register-copy' : 'login-copy'}
          className="auth-copy-enter relative z-10 max-w-2xl p-12 xl:p-16"
        >
          {isRegister ? (
            <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-[#4ade80]/30 bg-[#4ade80]/15 text-[#86efac] backdrop-blur-sm">
              <BarChart3 className="size-6" />
            </div>
          ) : (
            <div className="mb-6 h-1 w-16 rounded-full bg-[#4ade80]" />
          )}
          <p className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
            {isRegister ? (
              <>Bắt đầu hành trình cùng KickZone.</>
            ) : (
              <>
                Kết nối đam mê,
                <br />
                bùng nổ sân cỏ.
              </>
            )}
          </p>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
            {isRegister
              ? 'Tìm sân phù hợp, quản lý lịch đặt thông minh và kết nối với cộng đồng đam mê bóng đá.'
              : 'Tìm sân phù hợp, đặt lịch nhanh chóng và sẵn sàng cho mọi trận đấu cùng KickZone.'}
          </p>
        </div>
      </section>

      <section
        className={cn(
          'relative flex min-h-screen w-full items-center justify-center bg-background px-6 py-10 sm:px-10',
          'lg:absolute lg:inset-y-0 lg:left-0 lg:h-screen lg:w-1/2 lg:overflow-y-auto lg:px-12',
          'transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none',
          isRegister ? 'lg:translate-x-0' : 'lg:translate-x-full',
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary lg:hidden" />
        <div key={pathname} className="auth-form-enter flex w-full justify-center">
          {children}
        </div>
      </section>
    </main>
  );
}
