import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { UserAuthGuard } from '@/components/auth/user-auth-guard';

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <UserAuthGuard>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </UserAuthGuard>
  );
}
