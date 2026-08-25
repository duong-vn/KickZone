'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAdminDashboardStats,
  fetchAdminBookings,
  approveAdminBooking,
  rejectAdminBooking,
} from '@/lib/api';
import {
  Clock,
  CheckCircle2,
  Trophy,
  Users,
  Eye,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';

// Types mapping directly to KickZone database schema
type BookingStatus =
  'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

interface PendingBookingItem {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  fieldName: string;
  fieldType: string;
  dateLabel: string;
  timeSlot: string;
  finalPrice: number;
  status: BookingStatus;
}

import {
  formatBusinessTime,
  getBusinessParts,
} from '@/lib/booking-time';

function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatLocalTimeSlot(startTime?: string, endTime?: string): string {
  if (!startTime) return '00:00 - 00:00';
  const start = formatBusinessTime(startTime);
  const end = endTime ? formatBusinessTime(endTime) : start;
  return `${start} - ${end}`;
}

function getLocalDateString(dateInput: string | Date): string {
  return getBusinessParts(dateInput).dateKey;
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] =
    useState<PendingBookingItem | null>(null);

  // 1. Dashboard Stats Query (KPIs & Recent Activities)
  const { data: statsData } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => fetchAdminDashboardStats(),
    retry: false,
  });

  // 2. Pending Bookings Query (only PENDING status from bookings management)
  const { data: pendingResponse, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin-pending-bookings-dashboard'],
    queryFn: () => fetchAdminBookings({ status: 'PENDING', limit: 10 }),
    retry: false,
  });

  // Transform Pending Bookings
  const bookings: PendingBookingItem[] = useMemo(() => {
    if (pendingResponse?.data && pendingResponse.data.length > 0) {
      return pendingResponse.data.map(
        (b: {
          id: string;
          code: string;
          customerName: string;
          customerPhone?: string;
          customerEmail?: string;
          fieldName: string;
          fieldTypeLabel?: string;
          bookingDate?: string;
          startTime?: string;
          endTime?: string;
          finalPrice: number;
          status: BookingStatus;
        }) => ({
          id: b.id,
          code: b.code,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          fieldName: b.fieldName,
          fieldType: b.fieldTypeLabel || 'Sân bóng',
          dateLabel: formatDateVN(
            b.bookingDate ||
              (b.startTime ? getLocalDateString(b.startTime) : ''),
          ),
          timeSlot: formatLocalTimeSlot(b.startTime, b.endTime),
          finalPrice: b.finalPrice,
          status: b.status,
        }),
      );
    }
    return [];
  }, [pendingResponse]);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
  };

  const handleQuickApprove = async (bookingId: string) => {
    setSelectedBooking(null);
    try {
      await approveAdminBooking(bookingId);
      queryClient.invalidateQueries({
        queryKey: ['admin-pending-bookings-dashboard'],
      });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('Đã duyệt đơn đặt sân thành công!');
    } catch (err) {
      toast.error(`Lỗi duyệt đơn: ${(err as Error).message}`);
    }
  };

  const handleQuickReject = async (bookingId: string) => {
    setSelectedBooking(null);
    try {
      await rejectAdminBooking(bookingId, 'Admin từ chối');
      queryClient.invalidateQueries({
        queryKey: ['admin-pending-bookings-dashboard'],
      });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('Đã từ chối đơn đặt sân.');
    } catch (err) {
      toast.error(`Lỗi từ chối đơn: ${(err as Error).message}`);
    }
  };

  // Status Badge Component consistent with /admin/bookings
  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#585f6c]/20 bg-[#dce2f3] px-2.5 py-1 text-xs font-semibold text-[#151c27]">
            <span className="h-2 w-2 rounded-full bg-[#585f6c]" />
            Chờ xác nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#006e2f]/20 bg-[#22c55e]/20 px-2.5 py-1 text-xs font-semibold text-[#004b1e]">
            <span className="h-2 w-2 rounded-full bg-[#006e2f]" />
            Đã xác nhận
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bccbb9] bg-[#e1e3e4] px-2.5 py-1 text-xs font-semibold text-[#575e70]">
            <span className="h-2 w-2 rounded-full bg-[#575e70]" />
            Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ba1a1a]/20 bg-[#ffdad6] px-2.5 py-1 text-xs font-semibold text-[#93000a]">
            <span className="h-2 w-2 rounded-full bg-[#ba1a1a]" />
            Đã hủy
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ba1a1a]/20 bg-[#ffdad6] px-2.5 py-1 text-xs font-semibold text-[#93000a]">
            <span className="h-2 w-2 rounded-full bg-[#ba1a1a]" />
            Bị từ chối
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Row 1: KPI Cards (Full Width) */}
      <section
        aria-label="Thống kê tổng quan"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* KPI 1: Đơn chờ xác nhận */}
        <div className="flex flex-col justify-between rounded-xl border border-[#bccbb9] bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-[#575e70]">
              Đơn chờ xác nhận
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffdad6] text-[#ba1a1a]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <span className="font-(family-name:--font-manrope) text-3xl font-extrabold tracking-tight text-[#191c1d]">
              {statsData?.pendingBookingsCount ?? bookings.length}
            </span>
            <span className="mb-1 flex items-center text-xs font-semibold text-[#ba1a1a]">
              Cần duyệt
            </span>
          </div>
        </div>

        {/* KPI 2: Đơn đã xác nhận */}
        <div className="flex flex-col justify-between rounded-xl border border-[#bccbb9] bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-[#575e70]">
              Đơn đã xác nhận
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#006e2f]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <span className="font-(family-name:--font-manrope) text-3xl font-extrabold tracking-tight text-[#191c1d]">
              {statsData?.confirmedBookingsCount ?? 0}
            </span>
            <span className="mb-1 flex items-center text-xs font-semibold text-[#006e2f]">
              Hoạt động
            </span>
          </div>
        </div>

        {/* KPI 3: Sân đang hoạt động */}
        <div className="flex flex-col justify-between rounded-xl border border-[#bccbb9] bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-[#575e70]">
              Sân đang hoạt động
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9dff5] text-[#575e70]">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="font-(family-name:--font-manrope) text-3xl font-extrabold tracking-tight text-[#191c1d]">
              {statsData?.activeFieldsCount ?? 0}
            </span>
            <span className="font-(family-name:--font-manrope) text-sm font-semibold text-[#575e70] ml-1">
              sân
            </span>
          </div>
        </div>

        {/* KPI 4: Người dùng */}
        <div className="flex flex-col justify-between rounded-xl border border-[#bccbb9] bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-[#575e70]">
              Tổng người dùng
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dce2f3] text-[#585f6c]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end">
            <span className="font-(family-name:--font-manrope) text-3xl font-extrabold tracking-tight text-[#191c1d]">
              {statsData?.totalUsersCount ?? 0}
            </span>
            <span className="font-(family-name:--font-manrope) text-sm font-semibold text-[#575e70] ml-1">
              khách
            </span>
          </div>
        </div>
      </section>

      {/* Row 2: Card Đơn đặt sân cần xử lý (Full Width) */}
      <section className="w-full overflow-hidden rounded-xl border border-[#bccbb9] bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between border-b border-[#bccbb9] bg-[#f8f9fa] px-6 py-4">
          <div>
            <h3 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Đơn đặt sân cần xử lý
            </h3>
            <p className="text-xs text-[#575e70]">
              Danh sách các đơn đặt sân đang có trạng thái Chờ xác nhận
            </p>
          </div>
          <Link
            href="/admin/bookings?status=PENDING"
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
              {isLoadingPending ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-[#575e70]"
                  >
                    Đang tải danh sách đơn cần xử lý...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-[#575e70]"
                  >
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
                      <div>{booking.customerName}</div>
                      {booking.customerPhone && (
                        <div className="text-xs text-[#575e70]">
                          {booking.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#575e70]">
                      <span className="font-semibold text-[#191c1d]">
                        {booking.fieldName}
                      </span>{' '}
                      <span>({booking.fieldType})</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#191c1d]">
                          {booking.dateLabel}
                        </span>
                        <span className="text-xs text-[#575e70]">
                          {booking.timeSlot}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#006e2f]">
                      {formatVND(booking.finalPrice)}
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(booking.status)}
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

      {/* Quick View Modal for Pending Booking */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#bccbb9]/60 pb-3">
              <div>
                <span className="text-xs font-semibold text-[#575e70]">
                  Chi tiết đơn đặt sân
                </span>
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
                <span className="font-semibold text-[#191c1d]">
                  {selectedBooking.customerName}
                </span>
              </div>
              {selectedBooking.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Số điện thoại:</span>
                  <span className="font-medium text-[#191c1d]">
                    {selectedBooking.customerPhone}
                  </span>
                </div>
              )}
              {selectedBooking.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Email:</span>
                  <span className="font-medium text-[#191c1d]">
                    {selectedBooking.customerEmail}
                  </span>
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
              <div className="flex justify-between items-center">
                <span className="text-[#575e70]">Trạng thái:</span>
                <span>{renderStatusBadge(selectedBooking.status)}</span>
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
