'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createAdminUser, uploadAdminUserAvatar } from '@/lib/api';
import {
  ChevronRight,
  ArrowLeft,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  User,
  Shield,
  CheckCircle2,
  Camera,
  Check,
} from 'lucide-react';

export default function AdminNewUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'USER' as 'USER' | 'ADMIN',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.warning('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      toast.success('Đã chọn ảnh đại diện.');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validatePassword = (pass: string): boolean => {
    if (!pass || pass.length < 8) return false;
    let passed = 0;
    if (/[a-z]/.test(pass)) passed++;
    if (/[A-Z]/.test(pass)) passed++;
    if (/[0-9]/.test(pass)) passed++;
    if (/[^a-zA-Z0-9]/.test(pass)) passed++;
    return passed >= 3;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.warning('Vui lòng nhập họ và tên');
      return;
    }
    if (!formData.email.trim()) {
      toast.warning('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!formData.password) {
      toast.warning('Vui lòng nhập mật khẩu');
      return;
    }
    if (!validatePassword(formData.password)) {
      toast.warning(
        'Mật khẩu phải có ít nhất 8 ký tự và thỏa mãn ít nhất 3 trong 4 tiêu chuẩn: chữ hoa, chữ thường, chữ số, ký tự đặc biệt.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create User
      const createdUser = await createAdminUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        status: formData.status,
      });

      // 2. Upload Avatar if selected
      if (avatarFile && createdUser?.id) {
        try {
          const avatarFormData = new FormData();
          avatarFormData.append('file', avatarFile);
          await uploadAdminUserAvatar(createdUser.id, avatarFormData);
        } catch (uploadErr) {
          console.warn('Lỗi khi tải ảnh đại diện:', uploadErr);
          toast.warning(
            'Đã tạo người dùng nhưng chưa thể tải ảnh đại diện lên.',
          );
        }
      }

      // Invalidate users cache
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });

      // Navigate back to user list
      toast.success('Đã tạo người dùng mới thành công.');
      router.push('/admin/users');
    } catch (err: unknown) {
      const anyErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        anyErr?.response?.data?.message ||
          anyErr?.message ||
          'Có lỗi xảy ra khi tạo người dùng',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold text-[#191c1d]">
            Thêm người dùng mới
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-[#575e70]">
            <Link
              href="/admin/users"
              className="transition-colors hover:text-[#006e2f]"
            >
              Người dùng
            </Link>
            <ChevronRight className="h-4 w-4 text-[#bccbb9]" />
            <span className="font-semibold text-[#191c1d]">Tạo mới</span>
          </div>
        </div>

        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-lg border border-[#bccbb9] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#575e70] shadow-sm transition-colors hover:bg-[#f3f4f5]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách</span>
        </Link>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Avatar Upload Card (4 cols) */}
          <div className="lg:col-span-4">
            <div className="flex flex-col items-center rounded-2xl border border-[#bccbb9] bg-white p-6 text-center shadow-sm">
              <h3 className="mb-4 font-(family-name:--font-manrope) text-base font-bold text-[#191c1d]">
                Ảnh đại diện
              </h3>

              {/* Avatar Circle with Instant Preview */}
              <div className="relative mb-4 group">
                <img
                  src={
                    avatarPreview ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
                  }
                  alt="Avatar Preview"
                  className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-sm ring-1 ring-[#bccbb9]"
                />

                <label
                  htmlFor="user-avatar-upload"
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/55 text-white cursor-pointer transition-all hover:bg-black/65"
                  title="Tải ảnh đại diện lên"
                >
                  <Camera className="h-7 w-7 mb-1 text-white" />
                  <span className="text-xs font-bold">
                    {avatarPreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                  </span>
                  <input
                    ref={fileInputRef}
                    id="user-avatar-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/jpg"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                </label>
              </div>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="mb-3 text-xs font-semibold text-[#ba1a1a] hover:underline"
                >
                  Xóa ảnh đã chọn
                </button>
              )}

              <p className="text-[11px] text-[#575e70] leading-relaxed">
                Định dạng hỗ trợ: PNG, JPG, WEBP.
                <br />
                Dung lượng tối đa 5MB.
              </p>

              {/* Account Quick Preview */}
              <div className="mt-6 w-full rounded-xl bg-[#f8f9fa] p-4 text-left border border-[#bccbb9]/40 text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#575e70]">Vai trò:</span>
                  <span className="font-bold text-[#191c1d]">
                    {formData.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#575e70]">Trạng thái:</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      formData.status === 'ACTIVE'
                        ? 'bg-[#22c55e]/20 text-[#004b1e]'
                        : 'bg-[#575e70]/20 text-[#575e70]'
                    }`}
                  >
                    {formData.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: User Information Inputs (8 cols) */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-sm space-y-5">
              <h3 className="font-(family-name:--font-manrope) text-base sm:text-lg font-bold text-[#191c1d] border-b border-[#bccbb9]/40 pb-3">
                Thông tin cơ bản
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Họ và tên */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-[#191c1d]">
                    Họ và tên <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#191c1d]">
                    Địa chỉ Email <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="user@example.com"
                      className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#191c1d]">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Ví dụ: 0901234567"
                      className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                    />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-[#191c1d]">
                    Mật khẩu đăng nhập <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                      className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-9 pr-10 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#575e70] hover:text-[#191c1d]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-[#575e70]">
                    Mật khẩu tối thiểu 8 ký tự, bao gồm ít nhất 3 trong 4 loại:
                    chữ hoa, chữ thường, chữ số, ký tự đặc biệt.
                  </p>
                </div>

                {/* Vai trò */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#191c1d]">
                    Phân quyền vai trò
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as 'USER' | 'ADMIN',
                      })
                    }
                    className="w-full rounded-xl border border-[#bccbb9] bg-white p-2.5 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  >
                    <option value="USER">Khách hàng (USER)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#191c1d]">
                    Trạng thái tài khoản
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'ACTIVE' | 'INACTIVE',
                      })
                    }
                    className="w-full rounded-xl border border-[#bccbb9] bg-white p-2.5 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  >
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="INACTIVE">Vô hiệu hóa (INACTIVE)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-[#bccbb9]/40 pt-4 mt-6">
                <Link
                  href="/admin/users"
                  className="rounded-xl border border-[#bccbb9] bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#575e70] transition-colors hover:bg-[#f3f4f5]"
                >
                  Hủy
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-[#006e2f] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004b1e] active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{isSubmitting ? 'Đang tạo...' : 'Tạo người dùng'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
