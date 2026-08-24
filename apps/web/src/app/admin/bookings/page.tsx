'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
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
  CheckCircle,
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

// Initial mock data reflecting typical database entries from init.sql
const INITIAL_BOOKINGS: AdminBookingItem[] = [
  {
    id: 'bk-1',
    code: '#KZ-8092',
    user: {
      id: 'u-1',
      fullName: 'Nguyễn Văn A',
      phone: '0901234567',
      email: 'nguyenvana@gmail.com',
    },
    field: {
      id: 'f-1',
      name: 'Sân 7A',
      zone: 'Zone 1',
      fieldType: '7-a-side',
    },
    bookingDate: '2023-10-24',
    startTime: '18:00',
    endTime: '19:30',
    originalPrice: 450000,
    discountAmount: 0,
    finalPrice: 450000,
    status: 'PENDING',
    createdAt: '2023-10-23',
  },
  {
    id: 'bk-2',
    code: '#KZ-8091',
    user: {
      id: 'u-2',
      fullName: 'Trần Thị B',
      phone: '0912345678',
      email: 'tranthib@gmail.com',
    },
    field: {
      id: 'f-2',
      name: 'Sân 5B',
      zone: 'Zone 2',
      fieldType: '5-a-side',
    },
    bookingDate: '2023-10-24',
    startTime: '19:30',
    endTime: '21:00',
    originalPrice: 350000,
    discountAmount: 50000,
    finalPrice: 300000,
    status: 'CONFIRMED',
    createdAt: '2023-10-23',
  },
  {
    id: 'bk-3',
    code: '#KZ-8090',
    user: {
      id: 'u-3',
      fullName: 'Lê Văn C',
      phone: '0987654321',
      email: 'levanc@gmail.com',
    },
    field: {
      id: 'f-3',
      name: 'Sân 11A',
      zone: 'Zone Main',
      fieldType: '11-a-side',
    },
    bookingDate: '2023-10-23',
    startTime: '16:00',
    endTime: '18:00',
    originalPrice: 1200000,
    discountAmount: 0,
    finalPrice: 1200000,
    status: 'COMPLETED',
    createdAt: '2023-10-22',
  },
  {
    id: 'bk-4',
    code: '#KZ-8089',
    user: {
      id: 'u-4',
      fullName: 'Phạm Minh D',
      phone: '0933112233',
      email: 'phamminhd@gmail.com',
    },
    field: {
      id: 'f-4',
      name: 'Sân 5A',
      zone: 'Zone 1',
      fieldType: '5-a-side',
    },
    bookingDate: '2023-10-25',
    startTime: '17:00',
    endTime: '18:30',
    originalPrice: 300000,
    discountAmount: 0,
    finalPrice: 300000,
    status: 'CANCELLED',
    createdAt: '2023-10-23',
    cancellationReason: 'Khách hàng có việc bận đột xuất',
  },
  {
    id: 'bk-5',
    code: '#KZ-8088',
    user: {
      id: 'u-5',
      fullName: 'Hoàng Quốc E',
      phone: '0944556677',
      email: 'hoangquoce@gmail.com',
    },
    field: {
      id: 'f-5',
      name: 'Sân 7B',
      zone: 'Zone 2',
      fieldType: '7-a-side',
    },
    bookingDate: '2023-10-25',
    startTime: '20:00',
    endTime: '21:30',
    originalPrice: 450000,
    discountAmount: 0,
    finalPrice: 450000,
    status: 'PENDING',
    createdAt: '2023-10-23',
  },
  {
    id: 'bk-6',
    code: '#KZ-8087',
    user: {
      id: 'u-6',
      fullName: 'Vũ Thị F',
      phone: '0977889900',
      email: 'vuthif@gmail.com',
    },
    field: {
      id: 'f-6',
      name: 'Sân 5C',
      zone: 'Zone 3',
      fieldType: '5-a-side',
    },
    bookingDate: '2023-10-22',
    startTime: '19:00',
    endTime: '20:30',
    originalPrice: 350000,
    discountAmount: 0,
    finalPrice: 350000,
    status: 'REJECTED',
    createdAt: '2023-10-21',
    rejectionReason: 'Sân đang bảo dưỡng cỏ nhân tạo',
  },
];

export default function AdminBookingsPage() {
  // State for data and filtering
  const [bookings, setBookings] =
    useState<AdminBookingItem[]>(INITIAL_BOOKINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Selected booking for detailed view/actions
  const [selectedBooking, setSelectedBooking] =
    useState<AdminBookingItem | null>(null);
  const [rejectingBooking, setRejectingBooking] =
    useState<AdminBookingItem | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
  };

  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      // Search text matches code, customer name, customer phone, or field name
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesName = item.user.fullName.toLowerCase().includes(q);
        const matchesPhone = item.user.phone.includes(q);
        const matchesField = item.field.name.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesPhone && !matchesField) {
          return false;
        }
      }

      // Status filter
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }

      // Booking date filter
      if (bookingDateFilter && item.bookingDate !== bookingDateFilter) {
        return false;
      }

      // Created date filter
      if (createdDateFilter && item.createdAt !== createdDateFilter) {
        return false;
      }

      return true;
    });
  }, [
    bookings,
    searchQuery,
    statusFilter,
    bookingDateFilter,
    createdDateFilter,
  ]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setBookingDateFilter('');
    setCreatedDateFilter('');
    setCurrentPage(1);
  };

  // Quick Approve Booking
  const handleApprove = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b)),
    );
    const target = bookings.find((b) => b.id === bookingId);
    if (target) {
      showToast(`Đã duyệt thành công đơn ${target.code}!`);
    }
    if (selectedBooking?.id === bookingId) {
      setSelectedBooking((prev) =>
        prev ? { ...prev, status: 'CONFIRMED' } : null,
      );
    }
  };

  // Quick Reject Booking
  const handleConfirmReject = () => {
    if (!rejectingBooking) return;
    const reason = rejectReasonInput.trim() || 'Admin từ chối yêu cầu đặt sân';

    setBookings((prev) =>
      prev.map((b) =>
        b.id === rejectingBooking.id
          ? { ...b, status: 'REJECTED', rejectionReason: reason }
          : b,
      ),
    );
    showToast(`Đã từ chối đơn ${rejectingBooking.code}.`);
    if (selectedBooking?.id === rejectingBooking.id) {
      setSelectedBooking((prev) =>
        prev ? { ...prev, status: 'REJECTED', rejectionReason: reason } : null,
      );
    }
    setRejectingBooking(null);
    setRejectReasonInput('');
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
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/15 px-4 py-3 text-sm font-semibold text-[#004b1e] shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#006e2f]" />
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

      {/* Filters Section (Glassmorphism Card) */}
      <section
        aria-label="Bộ lọc tìm kiếm"
        className="rounded-xl border border-[#bccbb9] bg-white/80 p-6 shadow-sm backdrop-blur-sm"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#575e70]">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#575e70]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã đơn / khách hàng / sân"
                className="w-full rounded-lg border border-[#bccbb9] bg-[#f8f9fa] py-2 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
              />
            </div>
          </div>

          {/* Status Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#575e70]">
              Trạng thái
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#bccbb9] bg-[#f8f9fa] py-2 pl-3 pr-8 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
              >
                <option value="">Tất cả</option>
                <option value="PENDING">Chờ xác nhận</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="REJECTED">Bị từ chối</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-3 h-4 w-4 rotate-90 text-[#575e70]" />
            </div>
          </div>

          {/* Booking Date Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#575e70]">
              Khoảng ngày đặt
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-[#575e70]" />
              <input
                type="date"
                value={bookingDateFilter}
                onChange={(e) => setBookingDateFilter(e.target.value)}
                className="w-full rounded-lg border border-[#bccbb9] bg-[#f8f9fa] py-2 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
              />
            </div>
          </div>

          {/* Created Date Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#575e70]">
              Khoảng ngày tạo
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-[#575e70]" />
              <input
                type="date"
                value={createdDateFilter}
                onChange={(e) => setCreatedDateFilter(e.target.value)}
                className="w-full rounded-lg border border-[#bccbb9] bg-[#f8f9fa] py-2 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
              />
            </div>
          </div>
        </div>

        {/* Filter Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-3 border-t border-[#bccbb9]/40 pt-4">
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 rounded-lg border border-[#bccbb9] px-4 py-2 text-xs sm:text-sm font-semibold text-[#575e70] transition-colors hover:bg-[#e7e8e9]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Xóa bộ lọc</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-[#006e2f] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#004b1e]"
          >
            <Filter className="h-4 w-4" />
            <span>Lọc kết quả</span>
          </button>
        </div>
      </section>

      {/* Table Section */}
      <section className="flex flex-col overflow-hidden rounded-xl border border-[#bccbb9] bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left whitespace-nowrap text-sm">
            <thead className="border-b border-[#bccbb9] bg-[#f3f4f5] text-xs font-semibold uppercase tracking-wider text-[#575e70]">
              <tr>
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Sân</th>
                <th className="px-6 py-4">Ngày đặt / Khung giờ</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bccbb9]/50 text-xs sm:text-sm text-[#191c1d]">
              {filteredBookings.length === 0 ? (
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
                    <td className="px-6 py-4 font-bold text-[#006e2f]">
                      {booking.code}
                    </td>

                    {/* Khách hàng */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dce2f3] font-bold text-[#151c27]">
                          {booking.user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#191c1d]">
                            {booking.user.fullName}
                          </p>
                          <p className="text-xs text-[#575e70]">
                            {booking.user.phone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Sân */}
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-[#191c1d]">
                          {formatDateVN(booking.bookingDate)}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-[#575e70]">
                          <Clock className="h-3.5 w-3.5" />
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>
                    </td>

                    {/* Tổng tiền */}
                    <td className="px-6 py-4 font-bold text-[#191c1d]">
                      {formatVND(booking.finalPrice)}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4">
                      {renderStatusBadge(booking.status)}
                    </td>

                    {/* Hành động */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                        {booking.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(booking.id)}
                              className="rounded-lg p-1.5 text-[#006e2f] transition-colors hover:bg-[#22c55e]/20"
                              title="Duyệt đơn"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingBooking(booking)}
                              className="rounded-lg p-1.5 text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]"
                              title="Từ chối đơn"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        <Link
                          href={`/admin/bookings/${booking.code.replace('#', '').toLowerCase()}`}
                          className="rounded-lg p-1.5 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#191c1d]"
                          title="Xem chi tiết đơn"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#bccbb9] bg-white px-6 py-4 sm:flex-row">
          <span className="text-xs sm:text-sm text-[#575e70]">
            Hiển thị 1 - {filteredBookings.length} của 124 đơn
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-[#575e70] transition-colors hover:bg-[#e7e8e9] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#006e2f] text-xs font-bold text-white"
            >
              1
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-xs font-semibold text-[#575e70] transition-colors hover:bg-[#e7e8e9]"
            >
              2
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-xs font-semibold text-[#575e70] transition-colors hover:bg-[#e7e8e9]"
            >
              3
            </button>
            <span className="flex h-8 w-8 items-center justify-center text-xs text-[#575e70]">
              ...
            </span>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-xs font-semibold text-[#575e70] transition-colors hover:bg-[#e7e8e9]"
            >
              13
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-[#575e70] transition-colors hover:bg-[#e7e8e9]"
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
                <p className="mb-2 font-bold text-[#191c1d]">
                  Thông tin khách hàng
                </p>
                <div className="space-y-1.5 text-[#575e70]">
                  <div className="flex justify-between">
                    <span>Họ và tên:</span>
                    <span className="font-semibold text-[#191c1d]">
                      {selectedBooking.user.fullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số điện thoại:</span>
                    <span className="font-medium text-[#191c1d]">
                      {selectedBooking.user.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium text-[#191c1d]">
                      {selectedBooking.user.email}
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
