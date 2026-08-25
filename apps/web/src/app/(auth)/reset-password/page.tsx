import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Thiết lập mật khẩu mới | KickZone',
  description: 'Thiết lập mật khẩu mới cho tài khoản KickZone của bạn.',
};

function ResetPasswordFallback() {
  return (
    <div className="flex h-48 w-full max-w-[420px] items-center justify-center">
      <LoaderCircle className="size-8 animate-spin text-primary" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
