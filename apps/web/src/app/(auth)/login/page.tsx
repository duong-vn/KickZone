import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Đăng nhập | KickZone',
  description: 'Đăng nhập KickZone để đặt sân và quản lý lịch thi đấu.',
};

export default function LoginPage() {
  return <LoginForm />;
}
