'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LoaderCircle, MailCheck } from 'lucide-react';
import { toast } from 'sonner';

import { AuthBrand } from '@/components/auth/auth-brand';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseBrowserClient } from '@/lib/supabase';

type RegistrationValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

function validatePassword(password: string) {
  const categoryCount = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  return password.length >= 8 && categoryCount >= 3;
}

function getRegistrationErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes('already registered') ||
    normalizedMessage.includes('already been registered')
  ) {
    return 'Email này đã được sử dụng. Hãy đăng nhập hoặc dùng email khác.';
  }

  if (normalizedMessage.includes('password')) {
    return 'Mật khẩu chưa đáp ứng yêu cầu bảo mật của hệ thống.';
  }

  return 'Không thể tạo tài khoản lúc này. Vui lòng thử lại.';
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  function readFormValues(form: HTMLFormElement): RegistrationValues {
    const formData = new FormData(form);

    return {
      fullName: String(formData.get('fullName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
      confirmPassword: String(formData.get('confirmPassword') ?? ''),
      acceptedTerms: formData.get('terms') === 'on',
    };
  }

  function validateRegistration(values: RegistrationValues) {
    if (!validatePassword(values.password)) {
      return 'Mật khẩu cần ít nhất 8 ký tự và đạt 3/4 nhóm: chữ thường, chữ hoa, số, ký tự đặc biệt.';
    }

    if (values.password !== values.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }

    const normalizedPhone = values.phone.replace(/[\s.-]/g, '');
    if (!/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/.test(normalizedPhone)) {
      return 'Số điện thoại Việt Nam chưa đúng định dạng.';
    }

    if (!values.acceptedTerms) {
      return 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.';
    }

    return '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    const values = readFormValues(event.currentTarget);
    const validationError = validateRegistration(values);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: values.fullName,
            phone: values.phone.replace(/[\s.-]/g, ''),
          },
        },
      });

      if (error) {
        setErrorMessage(getRegistrationErrorMessage(error.message));
        return;
      }

      if (data.session) {
        toast.success('Tạo tài khoản thành công');
        router.replace('/');
        router.refresh();
        return;
      }

      setRegisteredEmail(values.email);
    } catch {
      setErrorMessage('Thiếu cấu hình Supabase hoặc kết nối đang gián đoạn.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (registeredEmail) {
    return (
      <div className="mx-auto w-full max-w-[420px] text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-8" />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-foreground">
          Kiểm tra hộp thư của bạn
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          KickZone đã gửi liên kết xác nhận tới{' '}
          <strong className="font-semibold text-foreground">
            {registeredEmail}
          </strong>
          . Hãy xác nhận email để hoàn tất đăng ký.
        </p>
        <Button
          type="button"
          size="lg"
          className="mt-7 h-11 w-full font-bold"
          onClick={() => router.push('/login')}
        >
          Về trang đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[420px] py-2 lg:py-10">
      <div className="mb-7">
        <AuthBrand />
      </div>

      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold text-primary">
          Tham gia KickZone
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Tạo tài khoản mới
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Đăng ký để tìm sân, đặt lịch và quản lý các trận đấu thuận tiện hơn.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Nhập họ và tên của bạn"
            autoComplete="name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registerEmail">Email</Label>
          <Input
            id="registerEmail"
            name="email"
            type="email"
            placeholder="ban@example.com"
            autoComplete="email"
            inputMode="email"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Ví dụ: 0912 345 678"
            autoComplete="tel"
            inputMode="tel"
            required
            disabled={isSubmitting}
          />
        </div>

        <PasswordField
          id="registerPassword"
          name="password"
          label="Mật khẩu"
          placeholder="Tạo mật khẩu"
          visible={showPassword}
          onToggle={() => setShowPassword((visible) => !visible)}
          disabled={isSubmitting}
          autoComplete="new-password"
        />
        <p className="-mt-2 text-xs leading-5 text-muted-foreground">
          Ít nhất 8 ký tự và đạt 3/4 nhóm: chữ thường, chữ hoa, số, ký tự đặc
          biệt.
        </p>

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((visible) => !visible)}
          disabled={isSubmitting}
          autoComplete="new-password"
        />

        <div className="flex items-start gap-2.5 pt-1">
          <Checkbox id="terms" name="terms" required className="mt-0.5" />
          <Label
            htmlFor="terms"
            className="block cursor-pointer text-xs font-normal leading-5 text-muted-foreground"
          >
            Tôi đồng ý với{' '}
            <Link
              href="/terms"
              className="font-semibold text-primary hover:underline"
            >
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link
              href="/privacy"
              className="font-semibold text-primary hover:underline"
            >
              Chính sách bảo mật
            </Link>{' '}
            của KickZone.
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Đang tạo tài khoản...
            </>
          ) : (
            <>
              Đăng ký
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{' '}
        <Link
          href="/login"
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  visible: boolean;
  disabled: boolean;
  autoComplete: string;
  onToggle: () => void;
};

function PasswordField({
  id,
  name,
  label,
  placeholder,
  visible,
  disabled,
  autoComplete,
  onToggle,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          minLength={8}
          disabled={disabled}
          className="pr-11"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          aria-label={
            visible
              ? `Ẩn ${label.toLowerCase()}`
              : `Hiện ${label.toLowerCase()}`
          }
          disabled={disabled}
        >
          {visible ? (
            <EyeOff className="size-4.5" />
          ) : (
            <Eye className="size-4.5" />
          )}
        </button>
      </div>
    </div>
  );
}
