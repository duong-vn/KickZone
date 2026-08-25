'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  MailCheck,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { AuthBrand } from '@/components/auth/auth-brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestForgotPassword } from '@/lib/api';

const RESEND_TIMEOUT_SECONDS = 60;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  function validateEmailInput(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      return false;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError(
        'Địa chỉ email không đúng định dạng (ví dụ: ban@example.com).',
      );
      return false;
    }
    setEmailError('');
    return true;
  }

  async function handleSendRequest(targetEmail?: string) {
    const target = (targetEmail ?? email).trim();
    if (!validateEmailInput(target)) {
      return;
    }

    setServerError('');
    setIsSubmitting(true);

    try {
      const res = await requestForgotPassword(target);
      setIsSuccess(true);
      setCountdown(RESEND_TIMEOUT_SECONDS);
      toast.success(res.message || 'Đã gửi liên kết khôi phục mật khẩu!');
    } catch (err: unknown) {
      const anyErr = err as {
        response?: { data?: { message?: string | string[] }; status?: number };
        status?: number;
        message?: string | string[];
      };

      const status = anyErr?.status ?? anyErr?.response?.status;
      const rawMsg = anyErr?.message ?? anyErr?.response?.data?.message;
      const apiMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg;

      if (status === 429) {
        setServerError(
          apiMsg || 'Bạn gửi yêu cầu quá nhanh. Vui lòng chờ giây lát.',
        );
      } else if (apiMsg && typeof apiMsg === 'string' && apiMsg.trim()) {
        setServerError(apiMsg);
      } else {
        setServerError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSendRequest();
  }

  // SCREEN 2: Check Mail Screen (Màn hình Kiểm tra hộp thư)
  if (isSuccess) {
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <div className="mb-8">
          <AuthBrand />
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <MailCheck className="size-8 animate-pulse text-[#16a34a]" />
          </div>
          <p className="mb-1 text-sm font-semibold text-primary">
            Kiểm tra hộp thư của bạn
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Đã gửi liên kết khôi phục
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến địa chỉ:{' '}
            <strong className="font-semibold text-foreground">{email}</strong>.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-4 text-xs leading-5 text-muted-foreground shadow-sm">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Liên kết khôi phục có hiệu lực trong vòng <strong>15 phút</strong>
              .
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Nếu không thấy trong Hộp thư đến, vui lòng kiểm tra mục{' '}
              <strong>Thư rác (Spam)</strong> hoặc <strong>Quảng cáo</strong>.
            </span>
          </div>
        </div>

        {serverError && (
          <p
            role="alert"
            aria-live="polite"
            className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
          >
            {serverError}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full font-semibold"
            disabled={countdown > 0 || isSubmitting}
            onClick={() => handleSendRequest()}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" />
                Đang gửi lại...
              </>
            ) : countdown > 0 ? (
              <>
                <RotateCcw className="size-4" />
                Gửi lại email ({countdown}s)
              </>
            ) : (
              <>
                <RotateCcw className="size-4" />
                Gửi lại email
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setIsSuccess(false);
              setServerError('');
            }}
          >
            Sử dụng địa chỉ email khác
          </Button>
        </div>

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
          Hệ thống bảo mật xác thực KickZone
        </div>
      </div>
    );
  }

  // SCREEN 1: Request Recovery Screen (Màn hình Yêu cầu khôi phục)
  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div className="mb-9">
        <AuthBrand />
      </div>

      <div className="mb-7">
        <div className="mb-3 inline-flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <KeyRound className="size-5" />
        </div>
        <p className="mb-2 text-sm font-semibold text-primary">
          Khôi phục tài khoản
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Quên mật khẩu?
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Nhập email đăng ký tài khoản của bạn để nhận liên kết thiết lập lại
          mật khẩu mới.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Địa chỉ email
          </Label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ban@example.com"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmailInput(e.target.value);
              }}
              onBlur={() => {
                if (email) validateEmailInput(email);
              }}
              disabled={isSubmitting}
              aria-invalid={emailError || serverError ? true : undefined}
              className={
                emailError
                  ? 'border-destructive focus-visible:ring-destructive/30'
                  : ''
              }
            />
          </div>

          {/* Red error warning below input if empty or wrong format */}
          {emailError && (
            <p
              role="alert"
              className="text-xs font-medium text-destructive animate-in fade-in-50 duration-200"
            >
              {emailError}
            </p>
          )}
        </div>

        {serverError && (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
          >
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full bg-[#16a34a] text-sm font-bold text-white shadow-sm hover:bg-[#15803d]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Đang gửi yêu cầu...
            </>
          ) : (
            <>
              <Mail className="size-4" />
              Gửi liên kết khôi phục
            </>
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
        Thông tin yêu cầu được bảo vệ an toàn
      </div>
    </div>
  );
}
