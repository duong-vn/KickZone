'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAdminBookings,
  approveAdminBooking,
  rejectAdminBooking,
} from '@/lib/api';
import { formatBusinessTime, getBusinessParts } from '@/lib/booking-time';
import {
  AdminFilterBar,
  adminFilterControlClass,
} from '@/components/admin/admin-filter-bar';
import {
  Search,
  Calendar,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

// Types mapping directly to KickZone database schema (init.sql)
export type BookingStatus =
  'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface AdminBookingItem {
  id: string;
  code: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    avatarUrl?: string;
  };
  field: {
    id: string;
    name: string;
    zone?: string;
    fieldType: string; // '5-a-side' | '7-a-side' | '11-a-side'
  };
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  status: BookingStatus;
  createdAt: string; // YYYY-MM-DD
  rejectionReason?: string;
  cancellationReason?: string;
}

const START_TIME_OPTIONS = [
  { label: 'Tất cả giờ bắt đầu', value: '' },
  { label: '05:00', value: '05:00' },
  { label: '05:30', value: '05:30' },
  { label: '06:00', value: '06:00' },
  { label: '06:30', value: '06:30' },
  { label: '07:00', value: '07:00' },
  { label: '07:30', value: '07:30' },
  { label: '08:00', value: '08:00' },
  { label: '08:30', value: '08:30' },
  { label: '09:00', value: '09:00' },
  { label: '09:30', value: '09:30' },
  { label: '10:00', value: '10:00' },
  { label: '10:30', value: '10:30' },
  { label: '11:00', value: '11:00' },
  { label: '11:30', value: '11:30' },
  { label: '12:00', value: '12:00' },
  { label: '12:30', value: '12:30' },
  { label: '13:00', value: '13:00' },
  { label: '13:30', value: '13:30' },
  { label: '14:00', value: '14:00' },
  { label: '14:30', value: '14:30' },
  { label: '15:00', value: '15:00' },
  { label: '15:30', value: '15:30' },
  { label: '16:00', value: '16:00' },
  { label: '16:30', value: '16:30' },
  { label: '17:00', value: '17:00' },
  { label: '17:30', value: '17:30' },
  { label: '18:00', value: '18:00' },
  { label: '18:30', value: '18:30' },
  { label: '19:00', value: '19:00' },
  { label: '19:30', value: '19:30' },
  { label: '20:00', value: '20:00' },
  { label: '20:30', value: '20:30' },
  { label: '21:00', value: '21:00' },
  { label: '21:30', value: '21:30' },
  { label: '22:00', value: '22:00' },
  { label: '22:30', value: '22:30' },
  { label: '23:00', value: '23:00' },
];

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [startTimeFilter, setStartTimeFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: [
      'admin-bookings',
      searchQuery,
      statusFilter,
      bookingDateFilter,
      currentPage,
      pageSize,
    ],
    queryFn: () =>
      fetchAdminBookings({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        from: bookingDateFilter
          ? new Date(`${bookingDateFilter}T00:00:00+07:00`).toISOString()
          : undefined,
        to: bookingDateFilter
          ? new Date(`${bookingDateFilter}T23:59:59.999+07:00`).toISOString()
          : undefined,
        page: currentPage,
        limit: pageSize,
      }),
    retry: false,
  });

  const bookings: AdminBookingItem[] = useMemo(() => {
    if (apiResponse?.data) {
      return apiResponse.data.map(
        (item: {
          id: string;
          code: string;
          userId: string;
          customerName: string;
          customerPhone: string;
          customerEmail: string;
          customerAvatar?: string;
          fieldId: string;
          fieldName: string;
          fieldTypeLabel?: string;
          bookingDate: string;
          startTime?: string;
          endTime?: string;
          originalPrice: number;
          discountAmount: number;
          finalPrice: number;
          status: BookingStatus;
          createdAt?: string;
          rejectionReason?: string;
          cancellationReason?: string;
        }) => ({
          id: item.id,
          code: item.code,
          user: {
            id: item.userId,
            fullName: item.customerName,
            phone: item.customerPhone,
            email: item.customerEmail,
            avatarUrl: item.customerAvatar,
          },
          field: {
            id: item.fieldId,
            name: item.fieldName,
            fieldType: item.fieldTypeLabel || 'Sân bóng',
          },
          bookingDate: item.startTime
            ? getBusinessParts(item.startTime).dateKey
            : item.bookingDate,
          startTime: item.startTime
            ? formatBusinessTime(item.startTime)
            : '00:00',
          endTime: item.endTime ? formatBusinessTime(item.endTime) : '00:00',
          originalPrice: item.originalPrice,
          discountAmount: item.discountAmount,
          finalPrice: item.finalPrice,
          status: item.status,
          createdAt: item.createdAt
            ? getBusinessParts(item.createdAt).dateKey
            : '',
          rejectionReason: item.rejectionReason,
          cancellationReason: item.cancellationReason,
        }),
      );
    }
    return [];
  }, [apiResponse]);

  const filteredBookings = useMemo(() => {
    if (!startTimeFilter) return bookings;
    return bookings.filter((b) => b.startTime === startTimeFilter);
  }, [bookings, startTimeFilter]);

  const bookingSummary = useMemo(
    () => ({
      total: apiResponse?.meta?.total ?? bookings.length,
      pending: bookings.filter((item) => item.status === 'PENDING').length,
      confirmed: bookings.filter((item) => item.status === 'CONFIRMED').length,
      completed: bookings.filter((item) => item.status === 'COMPLETED').length,
    }),
    [apiResponse?.meta?.total, bookings],
  );

  const totalRecords = apiResponse?.meta?.total ?? filteredBookings.length ?? 0;
  const totalPages =
    apiResponse?.meta?.totalPages ??
    Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Selected booking for detailed view/actions
  const [selectedBooking, setSelectedBooking] =
    useState<AdminBookingItem | null>(null);
  const [rejectingBooking, setRejectingBooking] =
    useState<AdminBookingItem | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
  };

  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const showToast = (msg: string) => {
    if (/^(Lỗi|Không thể|Có lỗi)/.test(msg)) toast.error(msg);
    else if (/^(Vui lòng|Cảnh báo)/.test(msg)) toast.warning(msg);
    else toast.success(msg);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setBookingDateFilter('');
    setStartTimeFilter('');
    setCurrentPage(1);
  };

  // Helper for generating page numbers
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [
        1,
        '...',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  // Quick Approve Booking
  const handleApprove = async (bookingId: string) => {
    try {
      await approveAdminBooking(bookingId);
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      showToast(`Đã duyệt thành công đơn đặt sân!`);
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) =>
          prev ? { ...prev, status: 'CONFIRMED' } : null,
        );
      }
    } catch (err) {
      showToast(`Lỗi khi duyệt đơn: ${(err as Error).message}`);
    }
  };

  // Quick Reject Booking
  const handleConfirmReject = async () => {
    if (!rejectingBooking) return;
    const reason = rejectReasonInput.trim() || 'Admin từ chối yêu cầu đặt sân';

    try {
      await rejectAdminBooking(rejectingBooking.id, reason);
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      showToast(`Đã từ chối đơn ${rejectingBooking.code}.`);
      if (selectedBooking?.id === rejectingBooking.id) {
        setSelectedBooking((prev) =>
          prev
            ? { ...prev, status: 'REJECTED', rejectionReason: reason }
            : null,
        );
      }
      setRejectingBooking(null);
      setRejectReasonInput('');
    } catch (err) {
      showToast(`Lỗi khi từ chối đơn: ${(err as Error).message}`);
    }
  };

  // Status Badge Component
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
    <div className="w-full space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-[#006e2f]">Vận hành</p>
          <h1 className="font-(family-name:--font-manrope) text-2xl font-extrabold tracking-tight text-[#191c1d]">
            Quản lý đơn đặt sân
          </h1>
          <p className="mt-1 text-sm text-[#575e70]">
            Theo dõi, xác nhận và xử lý toàn bộ đơn đặt sân.
          </p>
        </div>
      </section>

      <section
        aria-label="Tổng quan đơn đặt sân"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: 'Tổng đơn',
            value: bookingSummary.total,
            icon: CalendarDays,
            tone: 'bg-[#dce2f3] text-[#585f6c]',
          },
          {
            label: 'Chờ xác nhận trên trang',
            value: bookingSummary.pending,
            icon: Clock,
            tone: 'bg-[#fff1d6] text-[#8a4f00]',
          },
          {
            label: 'Đã xác nhận trên trang',
            value: bookingSummary.confirmed,
            icon: CheckCircle2,
            tone: 'bg-[#dcfce7] text-[#006e2f]',
          },
          {
            label: 'Hoàn thành trên trang',
            value: bookingSummary.completed,
            icon: XCircle,
            tone: 'bg-[#e7e8e9] text-[#575e70]',
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-[#bccbb9] bg-white p-4 shadow-[0_2px_5px_rgba(0,0,0,0.04)]"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#575e70]">{label}</p>
              <p className="font-(family-name:--font-manrope) text-xl font-extrabold text-[#191c1d]">
                {value}
              </p>
            </div>
          </div>
        ))}
      </section>

      <AdminFilterBar className="md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_180px_190px_210px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã đơn, khách hàng hoặc sân..."
            className={`${adminFilterControlClass} pl-9`}
            aria-label="Tìm kiếm đơn đặt sân"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`${adminFilterControlClass} appearance-none pr-10`}
            aria-label="Lọc trạng thái đơn"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="REJECTED">Bị từ chối</option>
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[#575e70]" />
        </div>

        <div
          onClick={(event) => {
            const input = event.currentTarget.querySelector(
              'input[type="date"]',
            ) as HTMLInputElement;
            if ('showPicker' in HTMLInputElement.prototype) input.showPicker();
            else input.focus();
          }}
          className={`${adminFilterControlClass} relative flex cursor-pointer select-none items-center justify-between pl-9 pr-3`}
        >
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
          <span
            className={bookingDateFilter ? 'font-medium' : 'text-[#8a9188]'}
          >
            {bookingDateFilter
              ? formatDateVN(bookingDateFilter)
              : 'Tất cả ngày đặt'}
          </span>
          {bookingDateFilter && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setBookingDateFilter('');
                setCurrentPage(1);
              }}
              className="z-10 rounded p-1 text-[#575e70] hover:bg-[#e7e8e9]"
              aria-label="Xóa ngày lọc"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <input
            type="date"
            value={bookingDateFilter}
            onChange={(e) => {
              setBookingDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Lọc ngày đặt"
          />
        </div>

        <div className="relative">
          <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
          <select
            value={startTimeFilter}
            onChange={(e) => {
              setStartTimeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`${adminFilterControlClass} appearance-none pl-9 pr-10`}
            aria-label="Lọc thời gian bắt đầu"
          >
            {START_TIME_OPTIONS.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[#575e70]" />
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#bccbb9] bg-white px-4 text-sm font-semibold text-[#575e70] transition hover:border-[#8ca18c] hover:bg-[#f3f4f5]"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Đặt lại</span>
        </button>
      </AdminFilterBar>

      {/* Table Section */}
      <section className="flex flex-col overflow-hidden rounded-xl border border-[#bccbb9] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left whitespace-nowrap text-sm">
            <thead className="border-b border-[#bccbb9] bg-[#f3f4f5] text-xs font-semibold text-[#575e70]">
              <tr>
                <th className="px-4 py-3.5">Mã đơn</th>
                <th className="px-4 py-3.5">Khách hàng</th>
                <th className="px-4 py-3.5">Sân</th>
                <th className="px-4 py-3.5">Ngày đặt / Khung giờ</th>
                <th className="px-4 py-3.5">Tổng tiền</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bccbb9]/50 text-xs sm:text-sm text-[#191c1d]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-[#575e70]"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#006e2f] border-t-transparent" />
                      <span>Đang tải danh sách đơn đặt sân...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-[#575e70]"
                  >
                    Không tìm thấy đơn đặt sân nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="group transition-colors hover:bg-[#f8f9fa]"
                  >
                    {/* Mã đơn */}
                    <td className="px-4 py-3.5 font-bold text-[#006e2f]">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="hover:underline"
                      >
                        {booking.code}
                      </Link>
                    </td>

                    {/* Khách hàng */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {booking.user.avatarUrl ? (
                          <img
                            src={booking.user.avatarUrl}
                            alt={booking.user.fullName}
                            className="h-8 w-8 shrink-0 rounded-full border border-[#bccbb9] object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dce2f3] text-xs font-bold text-[#151c27]">
                            {booking.user.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#191c1d]">
                            {booking.user.fullName}
                          </p>
                          <p className="text-[11px] text-[#575e70]">
                            {booking.user.phone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Sân */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[#191c1d]">
                        {booking.field.name}
                        {booking.field.zone && (
                          <span className="text-[#575e70]">
                            {' '}
                            - {booking.field.zone}
                          </span>
                        )}
                      </p>
                      <span className="text-[11px] text-[#575e70]">
                        ({booking.field.fieldType})
                      </span>
                    </td>

                    {/* Ngày đặt / Khung giờ */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-[#191c1d]">
                          {formatDateVN(booking.bookingDate)}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-[#575e70]">
                          <Clock className="h-3 w-3" />
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>
                    </td>

                    {/* Tổng tiền */}
                    <td className="px-4 py-3.5 font-bold text-[#191c1d]">
                      {formatVND(booking.finalPrice)}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3.5">
                      {renderStatusBadge(booking.status)}
                    </td>

                    {/* Hành động (Chỉ giữ lại icon Xem chi tiết) */}
                    <td className="px-4 py-3.5 text-center">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-[#575e70] transition-colors hover:bg-[#006e2f]/10 hover:text-[#006e2f]"
                        title="Xem chi tiết đơn"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#bccbb9] bg-white px-4 py-3.5 sm:flex-row sm:px-6">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#575e70]">
            <span>
              {totalRecords === 0
                ? 'Không có đơn nào'
                : `Hiển thị ${startRecord} - ${endRecord} của ${totalRecords} đơn`}
            </span>
            <div className="flex items-center gap-1.5 border-l border-[#bccbb9]/60 pl-3">
              <span className="text-xs text-[#575e70]">Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-[#bccbb9] bg-[#f8f9fa] px-2 py-1 text-xs font-semibold text-[#191c1d] transition-colors focus:border-[#006e2f] focus:outline-none"
              >
                <option value={5}>5 đơn / trang</option>
                <option value={10}>10 đơn / trang</option>
                <option value={20}>20 đơn / trang</option>
                <option value={50}>50 đơn / trang</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-[#575e70] transition-colors hover:bg-[#e7e8e9] disabled:opacity-40 disabled:pointer-events-none"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map((pageNum, idx) =>
              pageNum === '...' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-8 w-8 items-center justify-center text-xs text-[#575e70]"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => setCurrentPage(Number(pageNum))}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-[#006e2f] text-white shadow-sm'
                      : 'border border-[#bccbb9] text-[#575e70] hover:bg-[#e7e8e9]'
                  }`}
                >
                  {pageNum}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-[#575e70] transition-colors hover:bg-[#e7e8e9] disabled:opacity-40 disabled:pointer-events-none"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#bccbb9]/60 pb-3">
              <div>
                <span className="text-xs font-semibold text-[#575e70]">
                  Chi tiết đơn đặt sân
                </span>
                <h4 className="font-(family-name:--font-manrope) text-xl font-extrabold text-[#006e2f]">
                  {selectedBooking.code}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg p-1.5 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-4 text-xs sm:text-sm">
              {/* Customer Box */}
              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-3.5">
                <p className="mb-2.5 font-bold text-[#191c1d]">
                  Thông tin khách hàng
                </p>
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#bccbb9]/40">
                  {selectedBooking.user.avatarUrl ? (
                    <img
                      src={selectedBooking.user.avatarUrl}
                      alt={selectedBooking.user.fullName}
                      className="h-10 w-10 shrink-0 rounded-full border border-[#bccbb9] object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dce2f3] text-sm font-bold text-[#151c27]">
                      {selectedBooking.user.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-[#191c1d] truncate">
                      {selectedBooking.user.fullName}
                    </p>
                    <p className="text-xs text-[#575e70] truncate">
                      {selectedBooking.user.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 text-[#575e70]">
                  <div className="flex justify-between">
                    <span>Số điện thoại:</span>
                    <span className="font-medium text-[#191c1d]">
                      {selectedBooking.user.phone || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Court & Time */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Sân đặt:</span>
                  <span className="font-semibold text-[#191c1d]">
                    {selectedBooking.field.name} (
                    {selectedBooking.field.fieldType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Thời gian đá:</span>
                  <span className="font-semibold text-[#191c1d]">
                    {formatDateVN(selectedBooking.bookingDate)},{' '}
                    {selectedBooking.startTime} - {selectedBooking.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Ngày tạo đơn:</span>
                  <span className="text-[#191c1d]">
                    {formatDateVN(selectedBooking.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Trạng thái:</span>
                  <div>{renderStatusBadge(selectedBooking.status)}</div>
                </div>
              </div>

              {/* Price Details */}
              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-3.5 space-y-1.5">
                <div className="flex justify-between text-[#575e70]">
                  <span>Giá gốc:</span>
                  <span>{formatVND(selectedBooking.originalPrice)}</span>
                </div>
                {selectedBooking.discountAmount > 0 && (
                  <div className="flex justify-between text-[#ba1a1a]">
                    <span>Giảm giá (Voucher):</span>
                    <span>-{formatVND(selectedBooking.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#bccbb9]/40 pt-2 text-sm font-bold text-[#191c1d]">
                  <span>Tổng thanh toán:</span>
                  <span className="text-base font-extrabold text-[#006e2f]">
                    {formatVND(selectedBooking.finalPrice)}
                  </span>
                </div>
              </div>

              {/* Reason notice if rejected or cancelled */}
              {(selectedBooking.rejectionReason ||
                selectedBooking.cancellationReason) && (
                <div className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/30 p-3 text-xs text-[#93000a]">
                  <p className="font-bold">
                    {selectedBooking.status === 'REJECTED'
                      ? 'Lý do từ chối:'
                      : 'Lý do hủy đơn:'}
                  </p>
                  <p className="mt-1">
                    {selectedBooking.rejectionReason ||
                      selectedBooking.cancellationReason}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons inside modal if PENDING */}
            {selectedBooking.status === 'PENDING' && (
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingBooking(selectedBooking);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/40 px-4 py-2.5 text-xs font-bold text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]"
                >
                  <X className="h-4 w-4" />
                  <span>Từ chối đơn</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(selectedBooking.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#006e2f] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#004b1e]"
                >
                  <Check className="h-4 w-4" />
                  <span>Xác nhận duyệt</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Confirmation Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#191c1d]/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#bccbb9]/60 pb-3 text-[#ba1a1a]">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h4 className="font-(family-name:--font-manrope) text-lg font-bold">
                Từ chối đơn {rejectingBooking.code}
              </h4>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-[#575e70]">
              Bạn có chắc chắn muốn từ chối yêu cầu đặt sân của khách hàng{' '}
              <strong className="text-[#191c1d]">
                {rejectingBooking.user.fullName}
              </strong>
              ?
            </p>

            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold text-[#191c1d]">
                Lý do từ chối (Gửi thông báo tới khách hàng):
              </label>
              <textarea
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Ví dụ: Sân trùng lịch sự kiện, đang bảo dưỡng cỏ..."
                rows={3}
                className="w-full rounded-xl border border-[#bccbb9] p-3 text-xs sm:text-sm text-[#191c1d] focus:border-[#ba1a1a] focus:outline-none focus:ring-1 focus:ring-[#ba1a1a]"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="rounded-xl border border-[#bccbb9] px-4 py-2 text-xs font-semibold text-[#575e70] hover:bg-[#e7e8e9]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="rounded-xl bg-[#ba1a1a] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#93000a]"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
