/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, use, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminUserById,
  updateAdminUserStatus,
  updateAdminUser,
  uploadAdminUserAvatar,
} from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  ChevronRight,
  Edit,
  Ban,
  CheckCircle2,
  Mail,
  Eye,
  Star,
  X,
  Check,
  UserCheck,
  ArrowLeft,
  Camera,
} from 'lucide-react';

// Types aligned with database/init.sql
export interface UserDetailBooking {
  id: string;
  code: string;
  fieldName: string;
  fieldLocation: string;
  bookingDate: string;
  timeRange: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
}

export interface UserDetailReview {
  id: string;
  fieldName: string;
  rating: number;
  content: string;
  date: string;
}

export interface UserDetailData {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  phone: string;
  registeredDate?: string;
  createdAt?: string;
  loginProvider?: string;
  role: 'USER' | 'ADMIN';
  roleLabel: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
  totalBookings?: number;
  totalSpent?: number;
  stats?: {
    totalBookings: number;
    completed: number;
    cancelled: number;
    pending: number;
  };
  recentBookings: UserDetailBooking[];
  recentReviews: UserDetailReview[];
}

// Sample User Detail Data
const MOCK_USER_DETAIL: UserDetailData = {
  id: 'u-1',
  authUserId: 'auth-1',
  fullName: 'Nguyễn Văn An',
  email: 'nguyenvanan@email.com',
  phone: '0901 234 567',
  role: 'USER',
  roleLabel: 'Khách hàng',
  status: 'ACTIVE',
  avatarUrl:
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  createdAt: '2023-10-10',
  totalBookings: 12,
  totalSpent: 3600000,
  recentBookings: [
    {
      id: 'b-1',
      code: 'KZ-20231101-01',
      fieldName: 'Sân bóng Lam Sơn 1',
      fieldLocation: 'Quận 5, TP. HCM',
      bookingDate: '2023-11-01',
      timeRange: '18:00 - 19:30',
      status: 'COMPLETED',
    },
  ],
  recentReviews: [
    {
      id: 'r-1',
      fieldName: 'Sân bóng Lam Sơn 1',
      rating: 5,
      content:
        'Sân đẹp, mặt cỏ rất êm, hệ thống đèn chiếu sáng cực tốt ban đêm!',
      date: '2023-11-02',
    },
  ],
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const queryClient = useQueryClient();

  const { data: apiUser, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => fetchAdminUserById(userId),
    retry: false,
  });

  const [localUser, setLocalUser] = useState<Partial<UserDetailData> | null>(
    null,
  );
  const user: UserDetailData = useMemo(() => {
    return {
      ...MOCK_USER_DETAIL,
      ...(apiUser || {}),
      ...(localUser || {}),
      id: userId,
    };
  }, [apiUser, localUser, userId]);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    role: 'USER' as 'USER' | 'ADMIN',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatDateVN = (dateStr?: string) => {
    if (!dateStr) return 'Mới tham gia';
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleStartEdit = () => {
    setEditFormData({
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.role || 'USER',
      status: user.status || 'ACTIVE',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setLocalUser((prev) => ({ ...(prev || {}), status: nextStatus }));
    try {
      await updateAdminUserStatus(userId, nextStatus);
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast(
        nextStatus === 'ACTIVE'
          ? `Đã kích hoạt lại tài khoản cho ${user.fullName}!`
          : `Đã vô hiệu hóa tài khoản của ${user.fullName}.`,
      );
    } catch (err) {
      showToast(`Lỗi cập nhật trạng thái: ${(err as Error).message}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    if (!editFormData.fullName.trim()) {
      showToast('Vui lòng nhập họ và tên');
      return;
    }

    setIsSaving(true);
    try {
      let newAvatarUrl: string | undefined = undefined;

      // 1. If avatar file changed, upload it first
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await uploadAdminUserAvatar(userId, formData);
        newAvatarUrl = uploadRes.avatarUrl || uploadRes.publicUrl;
      }

      // 2. Update user profile data
      await updateAdminUser(userId, {
        fullName: editFormData.fullName.trim(),
        phone: editFormData.phone.trim(),
        role: editFormData.role,
        status: editFormData.status,
        ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
      });

      // 3. Update local state
      setLocalUser((prev) => ({
        ...(prev || {}),
        fullName: editFormData.fullName.trim(),
        phone: editFormData.phone.trim(),
        role: editFormData.role,
        roleLabel:
          editFormData.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng',
        status: editFormData.status,
        ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
      }));

      // 4. Invalidate react-query cache
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });

      // 5. If this is the current logged-in user, also sync Supabase user metadata
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          if (
            authData.user.id === user.authUserId ||
            authData.user.email === user.email
          ) {
            await supabase.auth.updateUser({
              data: {
                full_name: editFormData.fullName.trim(),
                name: editFormData.fullName.trim(),
                phone: editFormData.phone.trim(),
                ...(newAvatarUrl ? { avatar_url: newAvatarUrl } : {}),
              },
            });
          }
        }
      } catch {
        // ignore auth sync error
      }

      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      showToast('Cập nhật thông tin người dùng thành công!');
    } catch (err) {
      showToast(`Lỗi cập nhật: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderBookingStatusBadge = (status: UserDetailBooking['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="rounded-md border border-[#FFE082] bg-[#FFF8E1] px-2.5 py-1 text-[12px] font-semibold text-[#F57F17]">
            Chờ xác nhận
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="rounded-md border border-[#22c55e]/30 bg-[#22c55e]/15 px-2.5 py-1 text-[12px] font-semibold text-[#004b1e]">
            Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="rounded-md border border-[#ba1a1a]/30 bg-[#ffdad6] px-2.5 py-1 text-[12px] font-semibold text-[#93000a]">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="rounded-md border border-[#bccbb9] bg-[#f3f4f5] px-2.5 py-1 text-[12px] font-semibold text-[#575e70]">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
        <div className="h-40 bg-slate-200 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-48 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-48 bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!apiUser && userId !== 'u-1') {
    return (
      <div className="mx-auto w-full max-w-7xl py-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
          <Ban className="w-8 h-8" />
        </div>
        <h2 className="font-(family-name:--font-manrope) text-xl font-bold text-[#191c1d] mb-2">
          Không tìm thấy người dùng
        </h2>
        <p className="text-[#575e70] text-sm max-w-md mb-6">
          Tài khoản này không tồn tại trong hệ thống.
        </p>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006e2f] text-white font-bold hover:bg-[#004b1e] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/15 px-4 py-3 text-sm font-semibold text-[#004b1e] shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#006e2f]" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="rounded p-1 hover:bg-[#22c55e]/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold text-[#191c1d]">
            Chi tiết người dùng
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-[#575e70]">
            <Link
              href="/admin/users"
              className="transition-colors hover:text-[#006e2f]"
            >
              Người dùng
            </Link>
            <ChevronRight className="h-4 w-4 text-[#bccbb9]" />
            <span className="font-semibold text-[#191c1d]">
              {user.fullName}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg border border-[#bccbb9] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#575e70] shadow-sm transition-colors hover:bg-[#f3f4f5] disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                <span>Hủy</span>
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-[#006e2f] px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004b1e] active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartEdit}
                className="flex items-center gap-2 rounded-lg border border-[#bccbb9] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#191c1d] shadow-sm transition-colors hover:bg-[#f3f4f5]"
              >
                <Edit className="h-4 w-4 text-[#575e70]" />
                <span>Chỉnh sửa</span>
              </button>

              <button
                type="button"
                onClick={handleToggleStatus}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all active:scale-95 ${
                  user.status === 'ACTIVE'
                    ? 'bg-[#ba1a1a] hover:bg-[#93000a]'
                    : 'bg-[#006e2f] hover:bg-[#004b1e]'
                }`}
              >
                {user.status === 'ACTIVE' ? (
                  <>
                    <Ban className="h-4 w-4" />
                    <span>Vô hiệu hóa</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    <span>Kích hoạt lại</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bento Grid 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: User Info & Stats (4 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Profile Card */}
          <div className="flex flex-col items-center rounded-2xl border border-[#bccbb9] bg-white p-6 text-center shadow-sm relative">
            {/* Avatar */}
            <div className="relative mb-4">
              <img
                src={
                  avatarPreview ||
                  user.avatarUrl ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
                }
                alt={user.fullName}
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-sm ring-1 ring-[#bccbb9]"
              />

              {isEditing ? (
                <label
                  htmlFor="avatar-file-input"
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/55 text-white cursor-pointer transition-all hover:bg-black/65"
                  title="Nhấn để đổi ảnh đại diện"
                >
                  <Camera className="h-6 w-6 mb-1 text-white" />
                  <span className="text-[11px] font-bold">Đổi ảnh</span>
                  <input
                    ref={fileInputRef}
                    id="avatar-file-input"
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/jpg"
                    className="hidden"
                    onChange={handleAvatarFileSelect}
                  />
                </label>
              ) : (
                <div
                  className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${
                    user.status === 'ACTIVE' ? 'bg-[#22c55e]' : 'bg-[#575e70]'
                  }`}
                  title={
                    user.status === 'ACTIVE' ? 'Đang hoạt động' : 'Vô hiệu hóa'
                  }
                />
              )}
            </div>

            {/* Display / Editable Fields */}
            {isEditing ? (
              <div className="w-full space-y-3.5 text-left text-xs sm:text-sm">
                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-semibold text-[#575e70] mb-1">
                    Họ và tên <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.fullName}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    placeholder="Nhập họ và tên"
                    className="w-full rounded-lg border border-[#bccbb9] bg-white p-2 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-[#575e70] mb-1">
                    Email
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-[#bccbb9]/40 bg-[#f8f9fa] p-2 text-xs sm:text-sm text-[#575e70]">
                    <Mail className="h-3.5 w-3.5 text-[#575e70] shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-xs font-semibold text-[#575e70] mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Nhập số điện thoại"
                    className="w-full rounded-lg border border-[#bccbb9] bg-white p-2 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  />
                </div>

                {/* Vai trò */}
                <div>
                  <label className="block text-xs font-semibold text-[#575e70] mb-1">
                    Vai trò
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        role: e.target.value as 'USER' | 'ADMIN',
                      }))
                    }
                    className="w-full rounded-lg border border-[#bccbb9] bg-white p-2 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  >
                    <option value="USER">Khách hàng</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-xs font-semibold text-[#575e70] mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        status: e.target.value as 'ACTIVE' | 'INACTIVE',
                      }))
                    }
                    className="w-full rounded-lg border border-[#bccbb9] bg-white p-2 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Vô hiệu hóa</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-(family-name:--font-manrope) text-xl font-bold text-[#191c1d]">
                  {user.fullName}
                </h2>
                <p className="mt-1 mb-4 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[#575e70]">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{user.email}</span>
                </p>

                {/* Info Table */}
                <div className="w-full rounded-xl bg-[#f8f9fa] p-4 text-left text-xs sm:text-sm border border-[#bccbb9]/40">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-[#bccbb9]/50 pb-2">
                      <span className="text-[#575e70]">Số điện thoại</span>
                      <span className="font-bold text-[#191c1d]">
                        {user.phone || 'Chưa cập nhật'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-[#bccbb9]/50 pb-2">
                      <span className="text-[#575e70]">Ngày đăng ký</span>
                      <span className="font-semibold text-[#191c1d]">
                        {formatDateVN(user.registeredDate || user.createdAt)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-[#bccbb9]/50 pb-2">
                      <span className="text-[#575e70]">Đăng nhập</span>
                      <span className="flex items-center gap-1.5 font-bold text-[#191c1d]">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-[10px]">
                          {user.loginProvider
                            ? user.loginProvider.charAt(0)
                            : 'E'}
                        </span>
                        {user.loginProvider || 'Email/Password'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-[#bccbb9]/50 pb-2">
                      <span className="text-[#575e70]">Vai trò</span>
                      <span className="font-semibold text-[#191c1d]">
                        {user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[#575e70]">Trạng thái</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                          user.status === 'ACTIVE'
                            ? 'bg-[#22c55e]/20 text-[#004b1e]'
                            : 'bg-[#575e70]/20 text-[#575e70]'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Booking Summary Bento */}
          <div className="rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Tóm tắt hoạt động
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Tổng đơn */}
              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-4 text-center">
                <div className="mb-1 text-xs font-semibold text-[#575e70]">
                  Tổng đơn
                </div>
                <div className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold text-[#191c1d]">
                  {user.stats?.totalBookings ??
                    user.totalBookings ??
                    user.recentBookings.length}
                </div>
              </div>

              {/* Hoàn thành */}
              <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-4 text-center">
                <div className="mb-1 text-xs font-semibold text-[#004b1e]">
                  Hoàn thành
                </div>
                <div className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold text-[#006e2f]">
                  {user.stats?.completed ??
                    user.recentBookings.filter((b) => b.status === 'COMPLETED')
                      .length}
                </div>
              </div>

              {/* Đã hủy */}
              <div className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/30 p-4 text-center">
                <div className="mb-1 text-xs font-semibold text-[#ba1a1a]">
                  Đã hủy
                </div>
                <div className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold text-[#ba1a1a]">
                  {user.stats?.cancelled ??
                    user.recentBookings.filter((b) => b.status === 'CANCELLED')
                      .length}
                </div>
              </div>

              {/* Chờ xác nhận */}
              <div className="rounded-xl border border-[#FFE082] bg-[#FFF8E1] p-4 text-center">
                <div className="mb-1 text-xs font-semibold text-[#F57F17]">
                  Chờ xác nhận
                </div>
                <div className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold text-[#F57F17]">
                  {user.stats?.pending ??
                    user.recentBookings.filter((b) => b.status === 'PENDING')
                      .length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity (8 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Recent Bookings Table */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-[#bccbb9] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#bccbb9]/60 p-6">
              <h3 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                Đơn đặt sân gần đây
              </h3>
              <Link
                href="/admin/bookings"
                className="text-xs sm:text-sm font-bold text-[#006e2f] transition-colors hover:text-[#004b1e]"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left whitespace-nowrap text-sm">
                <thead className="border-b border-[#bccbb9]/60 bg-[#f8f9fa] text-xs font-semibold text-[#575e70]">
                  <tr>
                    <th className="px-6 py-3.5">Mã Đơn</th>
                    <th className="px-6 py-3.5">Sân Bóng</th>
                    <th className="px-6 py-3.5">Thời Gian</th>
                    <th className="px-6 py-3.5">Trạng Thái</th>
                    <th className="px-6 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bccbb9]/50 text-xs sm:text-sm text-[#191c1d]">
                  {user.recentBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-sm text-[#575e70]"
                      >
                        Chưa có đơn đặt sân nào.
                      </td>
                    </tr>
                  ) : (
                    user.recentBookings.map((b) => (
                      <tr
                        key={b.id}
                        className="transition-colors hover:bg-[#f8f9fa]"
                      >
                        <td className="px-6 py-4 font-bold text-[#006e2f]">
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="hover:underline"
                          >
                            {b.code}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#191c1d]">
                            {b.fieldName}
                          </div>
                          <div className="text-[11px] text-[#575e70]">
                            {b.fieldLocation}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{formatDateVN(b.bookingDate)}</div>
                          <div className="text-[11px] text-[#575e70]">
                            {b.timeRange}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {renderBookingStatusBadge(b.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-[#575e70] transition-colors hover:bg-[#006e2f]/10 hover:text-[#006e2f]"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Đánh giá gần đây
            </h3>

            <div className="space-y-4">
              {user.recentReviews.length === 0 ? (
                <p className="text-sm text-[#575e70] text-center py-6">
                  Chưa có đánh giá nào.
                </p>
              ) : (
                user.recentReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="font-bold text-[#191c1d] text-xs sm:text-sm">
                        {rev.fieldName}
                      </div>
                      <div className="flex items-center gap-0.5 text-[#FFB300]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= rev.rating
                                ? 'fill-[#FFB300] text-[#FFB300]'
                                : 'text-[#bccbb9]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mb-2 text-xs sm:text-sm text-[#575e70] leading-relaxed">
                      {rev.content}
                    </p>
                    <div className="text-[11px] text-[#575e70]">{rev.date}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
