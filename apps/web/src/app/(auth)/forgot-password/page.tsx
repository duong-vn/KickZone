import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Quên mật khẩu | KickZone',
  description: 'Khôi phục mật khẩu tài khoản KickZone nhanh chóng và an toàn.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
