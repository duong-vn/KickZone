'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  Trophy,
  Users,
  ArrowUp,
  Eye,
  MoreHorizontal,
  PlusCircle,
  XCircle,
  UserPlus,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';

// Types mapping directly to KickZone database schema
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

interface PendingBookingItem {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  fieldName: string;
  fieldType: string;
  dateLabel: string;
  timeSlot: string;
  finalPrice: number;
  status: BookingStatus;
  statusLabel: string;
}

interface ScheduleTimelineItem {
  id: string;
  timeSlot: string;
  courtName: string;
  customerName: string;
  isPending: boolean;
  status: 'PENDING' | 'CONFIRMED';
}

interface ActivityItem {
  id: string;
  type: 'NEW_BOOKING' | 'CANCEL_BOOKING' | 'CONFIRM_BOOKING' | 'NEW_USER';
  title: string;
  subject: string;
  timeAgo: string;
}

// Sample initial data strictly aligned with design mockups and KickZone schema
const INITIAL_PENDING_BOOKINGS: PendingBookingItem[] = [
  {
    id: 'b1',
    code: '#BK-9271',
    customerName: 'Nguyễn Văn C',
    customerPhone: '0901 234 567',
    fieldName: 'Sân 3',
    fieldType: '5 người',
    dateLabel: 'Hôm nay',
    timeSlot: '19:30 - 21:00',
    finalPrice: 350000,
    status: 'PENDING',
    statusLabel: 'Chờ xác nhận',
  },
  {
    id: 'b2',
    code: '#BK-9272',
    customerName: 'Trần Thị B',
    customerPhone: '0912 345 678',
    fieldName: 'Sân 1',
    fieldType: '7 người',
    dateLabel: 'Hôm nay',
    timeSlot: '20:00 - 21:30',
    finalPrice: 450000,
    status: 'PENDING',
    statusLabel: 'Chờ xác nhận',
  },
  {
    id: 'b3',
    code: '#BK-9273',
    customerName: 'Lê Hoàng D',
    customerPhone: '0983 456 789',
    fieldName: 'Sân 5',
    fieldType: '5 người',
    dateLabel: 'Ngày mai',
    timeSlot: '17:00 - 18:30',
    finalPrice: 300000,
    status: 'PENDING',
    statusLabel: 'Chờ xác nhận',
  },
  {
    id: 'b4',
    code: '#BK-9274',
    customerName: 'Phạm Văn E',
    customerPhone: '0974 567 890',
    fieldName: 'Sân 2',
    fieldType: '7 người',
    dateLabel: 'Ngày mai',
    timeSlot: '18:30 - 20:00',
    finalPrice: 450000,
    status: 'PENDING',
    statusLabel: 'Chờ xác nhận',
  },
];

const TODAY_SCHEDULE: ScheduleTimelineItem[] = [
  {
    id: 'sch-1',
    timeSlot: '18:00 - 19:30',
    courtName: 'Sân 1',
    customerName: 'Trần Văn A',
    isPending: false,
    status: 'CONFIRMED',
  },
  {
    id: 'sch-2',
    timeSlot: '19:30 - 21:00',
    courtName: 'Sân 3',
    customerName: 'Nguyễn Văn C (Chờ)',
    isPending: true,
    status: 'PENDING',
  },
  {
    id: 'sch-3',
    timeSlot: '20:00 - 21:30',
    courtName: 'Sân 1',
    customerName: 'Trần Thị B (Chờ)',
    isPending: true,
    status: 'PENDING',
  },
];

const RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'NEW_BOOKING',
    title: 'đã đặt Sân 2',
    subject: 'Hoàng Nam',
    timeAgo: '10 phút trước',
  },
  {
    id: 'act-2',
    type: 'CANCEL_BOOKING',
    title: 'đã hủy đơn #BK-9270',
    subject: 'Lê Vũ',
    timeAgo: '45 phút trước',
  },
  {
    id: 'act-3',
    type: 'CONFIRM_BOOKING',
    title: 'Bạn đã xác nhận đơn',
    subject: '#BK-9269',
    timeAgo: '2 giờ trước',
  },
  {
    id: 'act-4',
    type: 'NEW_USER',
    title: 'đăng ký tài khoản',
    subject: 'Người dùng mới Đặng T',
    timeAgo: '3 giờ trước',
  },
];

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<PendingBookingItem[]>(INITIAL_PENDING_BOOKINGS);
  const [selectedBooking, setSelectedBooking] = useState<PendingBookingItem | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
  };

  const handleQuickApprove = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    const target = bookings.find((b) => b.id === bookingId);
    setSelectedBooking(null);
    if (target) {
      setActionSuccessMsg(`Đã duyệt đơn ${target.code} thành công!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleQuickReject = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    const target = bookings.find((b) => b.id === bookingId);
    setSelectedBooking(null);
    if (target) {
      setActionSuccessMsg(`Đã từ chối đơn ${target.code}.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="flex items-center justify-between rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/15 px-4 py-3 text-sm font-semibold text-[#004b1e] shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#006e2f]" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="rounded p-1 hover:bg-[#22c55e]/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Grid: 8 Cols Left (KPIs + Table) & 4 Cols Right (Schedule + Recent Activities) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column (8 cols on XL) */}
        <div className="flex flex-col gap-6 xl:col-span-8">
          {/* KPI Cards Row */}
          <section aria-label="Thống kê tổng quan" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Đơn chờ xác nhận */}
            <div className="flex flex-col justify-between rounded-xl border border-[#bccbb9] bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-[#575e70]">Đơn chờ xác nhận</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffdad6] text-[#ba1a1a]">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-(family-name:--font-manrope) text-3xl font-extrabold tracking-tight text-[#191c1d]">
                  {bookings.length > 0 ? bookings.length + 8 : 12}
                </span>
                <span className="mb-1 flex items-center text-xs font-semibold text-[#ba1a1a]">
                  <ArrowUp className="h-3.5 w-3.5" />
                  +3
                </span>
              </div>
            </div>

            {/* KPI 2: Đơn đã xác nhận hôm nay */}
            <div className="flex flex-col justify-between rounded-xl border border-[#bccbb9] bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-[#575e70]">Đơn đã xác nhận hôm nay</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#006e2f]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-(family-name:--font-manrope) text-3xl font-extrabold tracking-tight text-[#191c1d]">
                  45
                </span>
                <span className="mb-1 flex items-center text-xs font-semibold text-[#006e2f]">
                  <ArrowUp className="h-3.5 w-3.5" />
                  +12%
                </span>
              </div>
            </div>

            {/* KPI 3: Sân đang hoạt động */}
            <div className="flex flex-col justify-between rounded-xl border border-[#bccbb9] bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-[#575e70]">Sân đang hoạt động</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9dff5] text-[#575e70]">
                  <Trophy className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="font-(family-name:--font-manrope) text-3xl font-extrabold tracking-tight text-[#191c1d]">
                  8
                </span>
                <span className="font-(family-name:--font-manrope) text-xl font-bold text-[#575e70]">
                  /10
                </span>
              </div>
            </div>

            {/* KPI 4: Người dùng đang HĐ */}
            <div className="flex flex-col justify-between rounded-xl border border-[#bccbb9] bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-[#575e70]">Người dùng đang HĐ</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dce2f3] text-[#585f6c]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-end">
                <span className="font-(family-name:--font-manrope) text-3xl font-extrabold tracking-tight text-[#191c1d]">
                  1.2k
                </span>
              </div>
            </div>
          </section>

          {/* Pending Bookings Table */}
          <section className="flex flex-col overflow-hidden rounded-xl border border-[#bccbb9] bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-[#bccbb9] bg-[#f8f9fa] px-6 py-4">
              <h3 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                Đơn đặt sân cần xử lý
              </h3>
              <Link
                href="/admin/bookings"
                className="group inline-flex items-center gap-1 text-sm font-semibold text-[#006e2f] transition-colors hover:text-[#004b1e]"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#bccbb9] bg-[#f3f4f5] text-xs font-semibold text-[#575e70]">
                    <th className="px-6 py-3.5">Mã đơn</th>
                    <th className="px-6 py-3.5">Khách hàng</th>
                    <th className="px-6 py-3.5">Sân</th>
                    <th className="px-6 py-3.5">Thời gian</th>
                    <th className="px-6 py-3.5">Tổng tiền</th>
                    <th className="px-6 py-3.5">Trạng thái</th>
                    <th className="px-6 py-3.5 text-center">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bccbb9]/50 text-xs sm:text-sm text-[#191c1d]">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-[#575e70]">
                        Không có đơn đặt sân nào đang chờ duyệt.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="transition-colors hover:bg-[#f8f9fa]/80"
                      >
                        <td className="px-6 py-4 font-bold text-[#191c1d]">
                          {booking.code}
                        </td>
                        <td className="px-6 py-4 font-medium text-[#191c1d]">
                          {booking.customerName}
                        </td>
                        <td className="px-6 py-4 text-[#575e70]">
                          <span className="font-semibold text-[#191c1d]">{booking.fieldName}</span>{' '}
                          <span>({booking.fieldType})</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#191c1d]">{booking.dateLabel}</span>
                            <span className="text-xs text-[#575e70]">{booking.timeSlot}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#006e2f]">
                          {formatVND(booking.finalPrice)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-[#ffdad6] px-2.5 py-1 text-xs font-semibold text-[#93000a]">
                            {booking.statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(booking)}
                            className="rounded-lg p-1.5 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols on XL) */}
        <div className="flex flex-col gap-6 xl:col-span-4">
          {/* Today's Schedule */}
          <section className="rounded-xl border border-[#bccbb9] bg-white p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="mb-4 flex items-center justify-between border-b border-[#bccbb9] pb-3">
              <h3 className="font-(family-name:--font-manrope) text-base font-bold text-[#191c1d]">
                Lịch sân hôm nay
              </h3>
              <button
                type="button"
                className="rounded-lg p-1 text-[#575e70] hover:bg-[#e7e8e9] hover:text-[#191c1d]"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <div className="relative ml-2 space-y-4 border-l-2 border-[#bccbb9] pl-4">
              {TODAY_SCHEDULE.map((item) => (
                <div key={item.id} className="relative">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${item.isPending ? 'bg-[#6d7b6c]' : 'bg-[#006e2f]'
                      }`}
                  />

                  {/* Card content */}
                  <div
                    className={`rounded-lg border p-3 transition-colors ${item.isPending
                      ? 'border-[#bccbb9]/60 bg-[#f8f9fa] opacity-80'
                      : 'border-[#bccbb9] bg-[#f3f4f5]'
                      }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#191c1d]">
                        {item.timeSlot}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.isPending
                          ? 'bg-[#e1e3e4] text-[#575e70]'
                          : 'bg-[#22c55e]/20 text-[#006e2f]'
                          }`}
                      >
                        {item.courtName}
                      </span>
                    </div>
                    <p className="text-xs text-[#575e70]">{item.customerName}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="flex-1 rounded-xl border border-[#bccbb9] bg-white p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="mb-4 border-b border-[#bccbb9] pb-3">
              <h3 className="font-(family-name:--font-manrope) text-base font-bold text-[#191c1d]">
                Hoạt động gần đây
              </h3>
            </div>

            <ul className="space-y-4">
              {RECENT_ACTIVITIES.map((activity) => {
                let iconEl = <PlusCircle className="h-4 w-4" />;
                let badgeStyle = 'bg-[#22c55e]/20 text-[#006e2f]';

                if (activity.type === 'CANCEL_BOOKING') {
                  iconEl = <XCircle className="h-4 w-4" />;
                  badgeStyle = 'bg-[#ffdad6] text-[#ba1a1a]';
                } else if (activity.type === 'CONFIRM_BOOKING') {
                  iconEl = <CheckCircle2 className="h-4 w-4" />;
                  badgeStyle = 'bg-[#d9dff5] text-[#575e70]';
                } else if (activity.type === 'NEW_USER') {
                  iconEl = <UserPlus className="h-4 w-4" />;
                  badgeStyle = 'bg-[#dce2f3] text-[#585f6c]';
                }

                return (
                  <li key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${badgeStyle}`}
                    >
                      {iconEl}
                    </div>
                    <div className="flex-1 text-xs">
                      {activity.type === 'CONFIRM_BOOKING' ? (
                        <p className="text-[#191c1d]">
                          {activity.title}{' '}
                          <span className="font-bold">{activity.subject}</span>
                        </p>
                      ) : activity.type === 'NEW_USER' ? (
                        <p className="text-[#191c1d]">
                          <span className="font-bold">{activity.subject}</span>{' '}
                          {activity.title}
                        </p>
                      ) : (
                        <p className="text-[#191c1d]">
                          <span className="font-bold">{activity.subject}</span>{' '}
                          {activity.title}
                        </p>
                      )}
                      <span className="text-[11px] text-[#575e70]">
                        {activity.timeAgo}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      {/* Quick View Modal for Pending Booking */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#bccbb9]/60 pb-3">
              <div>
                <span className="text-xs font-semibold text-[#575e70]">Chi tiết đơn đặt sân</span>
                <h4 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                  {selectedBooking.code}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg p-1 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#575e70]">Khách hàng:</span>
                <span className="font-semibold text-[#191c1d]">{selectedBooking.customerName}</span>
              </div>
              {selectedBooking.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Số điện thoại:</span>
                  <span className="font-medium text-[#191c1d]">{selectedBooking.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#575e70]">Sân bóng:</span>
                <span className="font-semibold text-[#191c1d]">
                  {selectedBooking.fieldName} ({selectedBooking.fieldType})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#575e70]">Thời gian:</span>
                <span className="font-semibold text-[#191c1d]">
                  {selectedBooking.dateLabel}, {selectedBooking.timeSlot}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#bccbb9]/40 pt-2">
                <span className="text-[#575e70]">Tổng thanh toán:</span>
                <span className="text-base font-bold text-[#006e2f]">
                  {formatVND(selectedBooking.finalPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#575e70]">Trạng thái:</span>
                <span className="inline-flex items-center rounded-full bg-[#ffdad6] px-2.5 py-0.5 text-xs font-semibold text-[#93000a]">
                  {selectedBooking.statusLabel}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => handleQuickReject(selectedBooking.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/40 px-4 py-2.5 text-xs font-bold text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]"
              >
                <X className="h-4 w-4" />
                <span>Từ chối</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickApprove(selectedBooking.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#006e2f] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#004b1e]"
              >
                <Check className="h-4 w-4" />
                <span>Xác nhận đơn</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
