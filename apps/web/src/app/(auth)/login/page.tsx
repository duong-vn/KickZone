import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Đăng nhập | KickZone',
  description: 'Đăng nhập KickZone để đặt sân và quản lý lịch thi đấu.',
};

function LoginFallback() {
  return (
    <div className="flex h-48 w-full max-w-[420px] items-center justify-center">
      <LoaderCircle className="size-8 animate-spin text-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
