import type { Metadata } from 'next';

import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Đăng ký | KickZone',
  description: 'Tạo tài khoản KickZone để tìm và đặt sân bóng đá.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
