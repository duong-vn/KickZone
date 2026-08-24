'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { AuthBrand } from '@/components/auth/auth-brand';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { fetchCurrentUserProfile } from '@/lib/api';

type OAuthProvider = 'google' | 'facebook';

function getLoginErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes('banned') ||
    normalizedMessage.includes('disabled') ||
    normalizedMessage.includes('vô hiệu hóa') ||
    normalizedMessage.includes('khóa')
  ) {
    return 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được kích hoạt lại.';
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu không chính xác.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Bạn cần xác nhận email trước khi đăng nhập.';
  }

  return 'Không thể đăng nhập lúc này. Vui lòng thử lại.';
}

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(getLoginErrorMessage(error.message));
        return;
      }

      // Check if account status in database is INACTIVE
      try {
        const profile = await fetchCurrentUserProfile();
        if (profile && profile.status === 'INACTIVE') {
          await supabase.auth.signOut();
          setErrorMessage(
            'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được kích hoạt lại.',
          );
          return;
        }
      } catch (err: unknown) {
        const anyErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
        if (
          anyErr?.response?.status === 403 ||
          anyErr?.response?.data?.message?.includes('vô hiệu hóa') ||
          anyErr?.response?.data?.message?.includes('khóa')
        ) {
          await supabase.auth.signOut();
          setErrorMessage(
            'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được kích hoạt lại.',
          );
          return;
        }
      }

      toast.success('Đăng nhập thành công');

      const isAdmin =
        data.user?.user_metadata?.role === 'ADMIN' ||
        data.user?.app_metadata?.role === 'ADMIN' ||
        data.user?.email?.toLowerCase().startsWith('admin');

      if (isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
      router.refresh();
    } catch {
      setErrorMessage('Thiếu cấu hình Supabase hoặc kết nối đang gián đoạn.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOAuth(provider: OAuthProvider) {
    setErrorMessage('');
    setOauthProvider(provider);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setErrorMessage(getLoginErrorMessage(error.message));
      }
    } catch {
      setErrorMessage('Không thể mở đăng nhập mạng xã hội. Vui lòng thử lại.');
    } finally {
      setOauthProvider(null);
    }
  }

  const isBusy = isSubmitting || oauthProvider !== null;

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-9">
        <AuthBrand />
      </div>

      <div className="mb-7">
        <p className="mb-2 text-sm font-semibold text-primary">
          Chào mừng trở lại
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Đăng nhập tài khoản
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Đăng nhập để đặt sân, theo dõi lịch đấu và quản lý các trận của bạn.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ban@example.com"
            autoComplete="email"
            inputMode="email"
            required
            disabled={isBusy}
            aria-invalid={errorMessage ? true : undefined}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              required
              minLength={8}
              disabled={isBusy}
              aria-invalid={errorMessage ? true : undefined}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              disabled={isBusy}
            >
              {showPassword ? (
                <EyeOff className="size-4.5" />
              ) : (
                <Eye className="size-4.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Checkbox id="remember" name="remember" defaultChecked />
          <Label
            htmlFor="remember"
            className="cursor-pointer text-sm font-normal text-muted-foreground"
          >
            Duy trì đăng nhập trên thiết bị này
          </Label>
        </div>

        {errorMessage && (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full bg-[#16a34a] text-sm font-bold text-white shadow-sm hover:bg-[#15803d]"
          disabled={isBusy}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-4" aria-hidden="true">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Hoặc tiếp tục với
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 bg-card font-semibold"
          onClick={() => handleOAuth('google')}
          disabled={isBusy}
        >
          {oauthProvider === 'google' ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 bg-card font-semibold"
          onClick={() => handleOAuth('facebook')}
          disabled={isBusy}
        >
          {oauthProvider === 'facebook' ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <FacebookIcon />
          )}
          Facebook
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{' '}
        <Link
          href="/register"
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Đăng ký ngay
        </Link>
      </p>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
        <ShieldCheck className="size-4 text-primary" />
        Thông tin đăng nhập được bảo vệ an toàn
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.8 6.8 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A10.95 10.95 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-[#1877f2]"
    >
      <path d="M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  );
}
