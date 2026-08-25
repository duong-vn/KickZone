'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { AuthBrand } from '@/components/auth/auth-brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/lib/api';

function validatePasswordCriteria(password: string) {
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const categoryCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(
    Boolean,
  ).length;
  const hasRequiredCategories = categoryCount >= 3;

  return {
    hasMinLength,
    hasLower,
    hasUpper,
    hasDigit,
    hasSpecial,
    categoryCount,
    hasRequiredCategories,
    isValid: hasMinLength && hasRequiredCategories,
  };
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const criteria = useMemo(() => validatePasswordCriteria(password), [password]);
  const doPasswordsMatch = useMemo(
    () => password.length > 0 && password === confirmPassword,
    [password, confirmPassword],
  );

  // Button is enabled ONLY when password is valid AND confirm password matches
  const isFormValid = criteria.isValid && doPasswordsMatch && Boolean(token);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setErrorMessage(
        'Không tìm thấy mã xác thực. Vui lòng kiểm tra lại liên kết trong email hoặc gửi lại yêu cầu.',
      );
      return;
    }

    if (!criteria.isValid) {
      setErrorMessage('Mật khẩu chưa đáp ứng đủ các tiêu chuẩn bảo mật.');
      return;
    }

    if (!doPasswordsMatch) {
      setErrorMessage('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await resetPassword({ token, password });
      setIsSuccess(true);
      toast.success(res.message || 'Thiết lập mật khẩu mới thành công!');
      setTimeout(() => {
        router.replace('/login');
      }, 2500);
    } catch (err: unknown) {
      const anyErr = err as {
        response?: { data?: { message?: string | string[] }; status?: number };
        status?: number;
        message?: string | string[];
      };

      const rawMsg = anyErr?.message ?? anyErr?.response?.data?.message;
      const apiMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg;
      if (apiMsg && typeof apiMsg === 'string' && apiMsg.trim()) {
        setErrorMessage(apiMsg);
      } else {
        setErrorMessage(
          'Không thể cập nhật mật khẩu lúc này. Mã xác thực có thể đã hết hạn hoặc đã được sử dụng.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // SUCCESS STATE SCREEN
  if (isSuccess) {
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <div className="mb-8">
          <AuthBrand />
        </div>

        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <CheckCircle2 className="size-8 text-[#16a34a]" />
          </div>
          <p className="mb-1 text-sm font-semibold text-primary">
            Cập nhật thành công
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Mật khẩu đã được thay đổi
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Mật khẩu mới của bạn đã được lưu an toàn. Đang tự động chuyển hướng đến trang đăng nhập trong giây lát...
          </p>

          <div className="mt-8">
            <Button
              type="button"
              size="lg"
              className="h-11 w-full bg-[#16a34a] font-bold text-white shadow-sm hover:bg-[#15803d]"
              onClick={() => router.replace('/login')}
            >
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // MISSING TOKEN WARNING
  if (!token) {
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <div className="mb-8">
          <AuthBrand />
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-destructive">
            Thiếu mã xác thực
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực. Vui lòng bấm vào liên kết trong email hoặc gửi yêu cầu khôi phục mới.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link href="/forgot-password">
              <Button className="w-full bg-[#16a34a] font-semibold text-white hover:bg-[#15803d]">
                Yêu cầu liên kết mới
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="w-full text-muted-foreground">
                Quay lại trang Đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div className="mb-9">
        <AuthBrand />
      </div>

      <div className="mb-7">
        <div className="mb-3 inline-flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Lock className="size-5" />
        </div>
        <p className="mb-2 text-sm font-semibold text-primary">
          Bảo mật tài khoản
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Thiết lập mật khẩu mới
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Tạo mật khẩu mạnh và an toàn để bảo vệ tài khoản KickZone của bạn.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* NEW PASSWORD FIELD */}
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu mới</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="size-4.5" />
              ) : (
                <Eye className="size-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* CONFIRM PASSWORD FIELD */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((visible) => !visible)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              aria-label={
                showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'
              }
              disabled={isSubmitting}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4.5" />
              ) : (
                <Eye className="size-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* PASSWORD STRENGTH & CRITERIA HELPER */}
        <div className="space-y-2.5 rounded-xl border border-border/80 bg-card/60 p-4 text-xs">
          <p className="font-semibold text-foreground">
            Tiêu chuẩn mật khẩu an toàn:
          </p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li className="flex items-center gap-2">
              {criteria.hasMinLength ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <X className="size-3.5 text-muted-foreground/50" />
              )}
              <span className={criteria.hasMinLength ? 'text-foreground' : ''}>
                Độ dài tối thiểu 8 ký tự
              </span>
            </li>
            <li className="flex items-center gap-2">
              {criteria.hasRequiredCategories ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <X className="size-3.5 text-muted-foreground/50" />
              )}
              <span className={criteria.hasRequiredCategories ? 'text-foreground' : ''}>
                Chứa ít nhất 3 trong 4 nhóm: Chữ hoa, chữ thường, số, ký tự đặc biệt ({criteria.categoryCount}/3)
              </span>
            </li>
            <li className="flex items-center gap-2">
              {doPasswordsMatch ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <X className="size-3.5 text-muted-foreground/50" />
              )}
              <span className={doPasswordsMatch ? 'text-foreground' : ''}>
                Hai mật khẩu khớp nhau
              </span>
            </li>
          </ul>
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

        {/* SUBMIT BUTTON - Enabled only when valid & passwords match */}
        <Button
          type="submit"
          size="lg"
          className="h-11 w-full bg-[#16a34a] text-sm font-bold text-white shadow-sm hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Đang lưu mật khẩu...
            </>
          ) : (
            'Lưu mật khẩu mới'
          )}
        </Button>
      </form>

      <div className="mt-8 border-t border-border pt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          <ArrowLeft className="size-4" />
          Quay lại trang Đăng nhập
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
        <ShieldCheck className="size-4 text-primary" />
        Mật khẩu được mã hóa an toàn
      </div>
    </div>
  );
}
