'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Edit,
  Ban,
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  Eye,
  Star,
  X,
  Check,
  Globe,
  Shield,
  Clock,
  ArrowLeft,
  UserCheck,
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
  fullName: string;
  email: string;
  phone: string;
  registeredDate: string; // '15/08/2023'
  loginProvider: string; // 'Google' | 'Email' | 'Facebook'
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl: string;
  stats: {
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
  fullName: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  phone: '0901234567',
  registeredDate: '15/08/2023',
  loginProvider: 'Google',
  status: 'ACTIVE',
  avatarUrl:
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  stats: {
    totalBookings: 42,
    completed: 38,
    cancelled: 3,
    pending: 1,
  },
  recentBookings: [
    {
      id: 'bk-1042',
      code: '#BK-1042',
      fieldName: 'Sân Cỏ Nhân Tạo A1',
      fieldLocation: 'Khu Thể Thao Thanh Xuân',
      bookingDate: '24/10/2023',
      timeRange: '18:00 - 19:30',
      status: 'PENDING',
    },
    {
      id: 'bk-1028',
      code: '#BK-1028',
      fieldName: 'Sân 7 Người Víp',
      fieldLocation: 'Cụm Sân Mỹ Đình',
      bookingDate: '20/10/2023',
      timeRange: '19:00 - 20:30',
      status: 'COMPLETED',
    },
    {
      id: 'bk-0985',
      code: '#BK-0985',
      fieldName: 'Sân Cỏ Nhân Tạo B2',
      fieldLocation: 'Khu Thể Thao Thanh Xuân',
      bookingDate: '15/10/2023',
      timeRange: '17:30 - 19:00',
      status: 'COMPLETED',
    },
  ],
  recentReviews: [
    {
      id: 'rev-1',
      fieldName: 'Sân Cỏ Nhân Tạo A1',
      rating: 5,
      content:
        'Sân đẹp, mặt cỏ tốt, ánh sáng ban đêm rất rõ. Tuy nhiên giá hơi cao so với mặt bằng chung.',
      date: '24/10/2023',
    },
    {
      id: 'rev-2',
      fieldName: 'Sân 7 Người Víp',
      rating: 4,
      content:
        'Chất lượng sân tạm ổn, chỗ để xe rộng rãi nhưng nhân viên không nhiệt tình lắm.',
      date: '20/10/2023',
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

  const [user, setUser] = useState<UserDetailData>(MOCK_USER_DETAIL);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    fullName: user.fullName,
    phone: user.phone,
    status: user.status,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleStatus = () => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUser((prev) => ({ ...prev, status: nextStatus }));
    showToast(
      nextStatus === 'ACTIVE'
        ? `Đã kích hoạt lại tài khoản cho ${user.fullName}!`
        : `Đã vô hiệu hóa tài khoản của ${user.fullName}.`
    );
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser((prev) => ({
      ...prev,
      fullName: editFormData.fullName,
      phone: editFormData.phone,
      status: editFormData.status,
    }));
    setIsEditModalOpen(false);
    showToast('Cập nhật thông tin người dùng thành công!');
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
            <span className="font-semibold text-[#191c1d]">{user.fullName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditFormData({
                fullName: user.fullName,
                phone: user.phone,
                status: user.status,
              });
              setIsEditModalOpen(true);
            }}
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
        </div>
      </div>

      {/* Bento Grid 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: User Info & Stats (4 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Profile Card */}
          <div className="flex flex-col items-center rounded-2xl border border-[#bccbb9] bg-white p-6 text-center shadow-sm">
            <div className="relative mb-4">
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm ring-1 ring-[#bccbb9]"
              />
              <div
                className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${
                  user.status === 'ACTIVE' ? 'bg-[#22c55e]' : 'bg-[#575e70]'
                }`}
                title={user.status === 'ACTIVE' ? 'Đang hoạt động' : 'Vô hiệu hóa'}
              />
            </div>

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
                  <span className="font-bold text-[#191c1d]">{user.phone}</span>
                </div>

                <div className="flex justify-between items-center border-b border-[#bccbb9]/50 pb-2">
                  <span className="text-[#575e70]">Ngày đăng ký</span>
                  <span className="font-semibold text-[#191c1d]">
                    {user.registeredDate}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-[#bccbb9]/50 pb-2">
                  <span className="text-[#575e70]">Đăng nhập</span>
                  <span className="flex items-center gap-1.5 font-bold text-[#191c1d]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-[10px]">
                      G
                    </span>
                    {user.loginProvider}
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
                  {user.stats.totalBookings}
                </div>
              </div>

              {/* Hoàn thành */}
              <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-4 text-center">
                <div className="mb-1 text-xs font-semibold text-[#004b1e]">
                  Hoàn thành
                </div>
                <div className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold text-[#006e2f]">
                  {user.stats.completed}
                </div>
              </div>

              {/* Đã hủy */}
              <div className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/30 p-4 text-center">
                <div className="mb-1 text-xs font-semibold text-[#ba1a1a]">
                  Đã hủy
                </div>
                <div className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold text-[#ba1a1a]">
                  {user.stats.cancelled}
                </div>
              </div>

              {/* Chờ xác nhận */}
              <div className="rounded-xl border border-[#FFE082] bg-[#FFF8E1] p-4 text-center">
                <div className="mb-1 text-xs font-semibold text-[#F57F17]">
                  Chờ xác nhận
                </div>
                <div className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold text-[#F57F17]">
                  {user.stats.pending}
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
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#bccbb9]/60 bg-[#f8f9fa] text-xs font-semibold text-[#575e70]">
                    <th className="p-4 whitespace-nowrap">Mã Đơn</th>
                    <th className="p-4 whitespace-nowrap">Sân Bóng</th>
                    <th className="p-4 whitespace-nowrap">Thời Gian</th>
                    <th className="p-4 whitespace-nowrap">Trạng Thái</th>
                    <th className="p-4 text-right whitespace-nowrap">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bccbb9]/40">
                  {user.recentBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="transition-colors hover:bg-[#f8f9fa]"
                    >
                      <td className="p-4 font-semibold text-[#191c1d] whitespace-nowrap">
                        {b.code}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-[#191c1d]">
                          {b.fieldName}
                        </div>
                        <div className="text-[11px] text-[#575e70]">
                          {b.fieldLocation}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-medium text-[#191c1d]">
                          {b.bookingDate}
                        </div>
                        <div className="text-[11px] text-[#575e70]">
                          {b.timeRange}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {renderBookingStatusBadge(b.status)}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/bookings/${b.code.replace('#', '').toLowerCase()}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
                          title="Xem chi tiết đơn"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Đánh giá gần đây
            </h3>

            <div className="flex flex-col gap-4">
              {user.recentReviews.map((rev) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#bccbb9]/60 pb-3">
              <h4 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                Chỉnh sửa thông tin người dùng
              </h4>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1.5 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="my-4 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, fullName: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Trạng thái tài khoản
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      status: e.target.value as 'ACTIVE' | 'INACTIVE',
                    })
                  }
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Vô hiệu hóa</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-[#bccbb9] px-4 py-2 text-xs font-semibold text-[#575e70] hover:bg-[#e7e8e9]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#006e2f] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#004b1e]"
                >
                  <Check className="h-4 w-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
