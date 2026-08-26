/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  History,
  Key,
  Lock,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { fetchCurrentUserProfile, updateCurrentUserProfile } from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase';

function validatePassword(password: string): boolean {
  const categoryCount = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  return password.length >= 8 && categoryCount >= 3;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s.-]/g, '');
}

export default function ProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          router.replace('/login');
          return;
        }

        if (!isMounted) return;

        try {
          const profile = await fetchCurrentUserProfile();
          if (profile && isMounted) {
            setEmail(profile.email || data.user.email || '');
            setFullName(profile.fullName || '');
            setPhone(profile.phone || '');
            setAvatarUrl(profile.avatarUrl || '');
            return;
          }
        } catch {
          // Fallback to Supabase metadata if API is offline
        }

        const metadata = data.user.user_metadata;
        setEmail(data.user.email ?? '');
        setFullName(
          typeof metadata.full_name === 'string' ? metadata.full_name : '',
        );
        setPhone(typeof metadata.phone === 'string' ? metadata.phone : '');
        setAvatarUrl(
          typeof metadata.avatar_url === 'string' ? metadata.avatar_url : '',
        );
      } catch {
        toast.error('Không thể tải hồ sơ. Vui lòng đăng nhập lại.');
        router.replace('/login');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSaveInfo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = fullName.trim();
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedName) {
      toast.error('Họ và tên không được để trống.');
      return;
    }
    if (!/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/.test(normalizedPhone)) {
      toast.error('Số điện thoại Việt Nam chưa đúng định dạng.');
      return;
    }

    setIsSavingInfo(true);
    try {
      // 1. Cập nhật bảng profiles qua API backend
      await updateCurrentUserProfile({
        fullName: normalizedName,
        phone: normalizedPhone,
      });

      // 2. Đồng bộ user_metadata trên Supabase Auth
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.updateUser({
        data: { full_name: normalizedName, phone: normalizedPhone },
      });

      setFullName(normalizedName);
      setPhone(normalizedPhone);
      toast.success('Cập nhật thông tin hồ sơ thành công!');
    } catch {
      toast.error('Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleSavePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!validatePassword(newPassword)) {
      toast.error(
        'Mật khẩu phải có độ dài tối thiểu 8 ký tự và chứa ít nhất 3 loại: chữ thường, viết hoa, số, ký tự đặc biệt.',
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsSavingPass(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        toast.error('Không thể cập nhật mật khẩu. Vui lòng thử lại.');
        return;
      }

      setNewPassword('');
      setConfirmPassword('');
      toast.success('Cập nhật mật khẩu mới thành công!');
    } catch {
      toast.error('Không thể cập nhật mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsSavingPass(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-sm text-[#575e70]">
        Đang tải hồ sơ...
      </div>
    );
  }

  const displayName = fullName || email || 'Tài khoản';
  const defaultAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAyn4stmH_FhB4YBxaco0X6B0HM0m_qYbwmSsbm2H2NFvpQEdQKD3phbMHH4rMFvqeymeAdMH2uIFHCuRWkmnASdlA6UkkQIzGDyo4drrZibLpgLg-WKoVFnFb6a3rGxMvlCTiUCnK0SflbZvNJrlKlHCLXfnQuP7pYUqT4vSahZixGtFWS3HRTrM0PGZq7ZNbGc62pmxm7GK69dMI0ZUWep2K3g2VkLWbdwC3YcQG115vhrSA4YUeQ5Q';

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen pb-16 font-sans">
      <div className="bg-white border-b border-[#bccbb9]/40 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-xs text-[#575e70] mb-2">
                <Link
                  href="/"
                  className="hover:text-[#006e2f] transition-colors"
                >
                  Trang chủ
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#191c1d] font-semibold">
                  Hồ sơ cá nhân
                </span>
              </nav>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1d] font-['Manrope']">
                Hồ sơ cá nhân
              </h1>
              <p className="text-xs text-[#575e70] mt-1">
                Quản lý thông tin tài khoản, liên hệ và bảo mật cá nhân.
              </p>
            </div>
            <Link href="/profile/activity">
              <Button
                variant="outline"
                className="bg-[#f8f9fa] border-[#bccbb9]/60 hover:border-[#006e2f] hover:text-[#006e2f] text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2"
              >
                <History className="w-4 h-4 text-[#006e2f]" /> Hoạt động của tôi
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 xl:col-span-8">
            <section className="bg-white border border-[#bccbb9]/40 rounded-2xl shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="flex flex-col items-center space-y-3 shrink-0 self-center sm:self-start">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md group bg-slate-100">
                    <img
                      src={avatarUrl || defaultAvatar}
                      alt={`Ảnh đại diện của ${displayName}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Đổi ảnh đại diện"
                      onClick={() =>
                        toast.info('Tính năng đổi ảnh đại diện chưa khả dụng.')
                      }
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#22c55e]/15 text-[#006e2f] border border-[#22c55e]/30 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực
                  </span>
                </div>

                <form
                  onSubmit={handleSaveInfo}
                  className="flex-1 w-full space-y-5"
                >
                  <h2 className="text-lg font-bold text-[#191c1d] font-['Manrope'] pb-3 border-b border-[#bccbb9]/30 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#006e2f]" />
                    Thông tin cơ bản
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileField
                      id="profile-full-name"
                      label="Họ và tên *"
                      icon={<User className="w-4 h-4" />}
                    >
                      <input
                        id="profile-full-name"
                        type="text"
                        autoComplete="name"
                        required
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Nhập họ và tên"
                        className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#191c1d] outline-none focus:border-[#006e2f] transition-colors"
                      />
                    </ProfileField>
                    <ProfileField
                      id="profile-phone"
                      label="Số điện thoại *"
                      icon={<Phone className="w-4 h-4" />}
                    >
                      <input
                        id="profile-phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="Nhập số điện thoại"
                        className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#191c1d] outline-none focus:border-[#006e2f] transition-colors"
                      />
                    </ProfileField>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-email"
                        className="block text-xs font-bold text-[#191c1d]"
                      >
                        Địa chỉ Email (Đăng nhập)
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        autoComplete="email"
                        disabled
                        value={email}
                        className="w-full bg-slate-100 border border-[#bccbb9]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#575e70] font-medium cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSavingInfo}
                      className="bg-[#006e2f] hover:bg-[#005321] text-white text-xs font-bold px-6 py-2.5 rounded-xl"
                    >
                      {isSavingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </form>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <section className="bg-white border border-[#bccbb9]/40 rounded-2xl shadow-sm p-6 sm:p-8">
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#bccbb9]/30">
                  <Lock className="w-5 h-5 text-[#006e2f]" />
                  <h2 className="text-lg font-bold text-[#191c1d] font-['Manrope']">
                    Đổi mật khẩu
                  </h2>
                </div>
                <PasswordField
                  id="profile-new-password"
                  label="Mật khẩu mới *"
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showNew}
                  onToggle={() => setShowNew((value) => !value)}
                />
                <PasswordField
                  id="profile-confirm-password"
                  label="Xác nhận mật khẩu mới *"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirm}
                  onToggle={() => setShowConfirm((value) => !value)}
                />
                <div className="bg-[#f8f9fa] p-3.5 rounded-xl border border-[#bccbb9]/40 space-y-1.5 text-[11px] text-[#575e70]">
                  <span className="font-bold text-[#191c1d] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#006e2f]" />
                    Quy tắc bảo mật mật khẩu:
                  </span>
                  <p>
                    Ít nhất 8 ký tự và đạt 3/4 nhóm: chữ thường, chữ hoa, số, ký
                    tự đặc biệt.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={isSavingPass}
                  className="w-full bg-white border border-[#bccbb9]/60 hover:bg-[#006e2f]/5 text-[#191c1d] hover:text-[#006e2f] text-xs font-bold py-5 rounded-xl"
                >
                  <Key className="w-4 h-4 text-[#006e2f]" />
                  {isSavingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </Button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-[#191c1d]">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#575e70] pointer-events-none z-10">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-[#191c1d]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-[#191c1d] outline-none focus:border-[#006e2f]"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            visible
              ? `Ẩn ${label.toLowerCase()}`
              : `Hiện ${label.toLowerCase()}`
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#575e70] hover:text-[#006e2f]"
        >
          {visible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
