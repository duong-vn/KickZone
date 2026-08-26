/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, use, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAdminBookingById,
  approveAdminBooking,
  rejectAdminBooking,
} from '@/lib/api';
import {
  formatBusinessDateOnly,
  formatBusinessTime,
  formatBusinessDateTime,
  durationMinutes,
} from '@/lib/booking-time';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Receipt,
  Ticket,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Layers,
  Ban,
} from 'lucide-react';

// Types aligned with database/init.sql
export type BookingStatus =
  'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface BookingDetailData {
  id: string;
  code: string;
  createdAt: string; // e.g. "14:30 - 24/10/2023"
  status: BookingStatus;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string;
  };
  field: {
    id: string;
    name: string;
    fieldType: string; // 'Sân 5 người'
    address: string;
    imageUrl: string;
  };
  bookingDate: string; // e.g. "26/10/2023"
  startTime: string; // "18:00"
  endTime: string; // "19:30"
  durationMinutes: number; // 90
  originalPrice: number; // 450000
  voucherCode?: string; // "KICK10"
  discountAmount: number; // 45000
  otherDiscount: number; // 0
  finalPrice: number; // 405000
  rejectionReason?: string;
  cancellationReason?: string;
}

export default function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;
  const queryClient = useQueryClient();

  const { data: apiBooking, isLoading } = useQuery({
    queryKey: ['admin-booking', bookingId],
    queryFn: () => fetchAdminBookingById(bookingId),
    retry: false,
  });

  const [localStatus, setLocalStatus] = useState<BookingStatus | null>(null);
  const [localRejectionReason, setLocalRejectionReason] = useState<
    string | null
  >(null);

  const booking: BookingDetailData | null = useMemo(() => {
    if (apiBooking) {
      return {
        id: apiBooking.id,
        code: apiBooking.code,
        createdAt: apiBooking.createdAt || '',
        status: localStatus || apiBooking.status,
        user: {
          id: apiBooking.user.id,
          fullName: apiBooking.user.fullName,
          email: apiBooking.user.email,
          phone: apiBooking.user.phone || '',
          avatarUrl:
            apiBooking.user.avatarUrl ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        },
        field: {
          id: apiBooking.field.id,
          name: apiBooking.field.name,
          fieldType: apiBooking.field.fieldType || 'Sân bóng',
          address: apiBooking.field.address,
          imageUrl:
            apiBooking.field.images?.[0] ||
            'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&auto=format&fit=crop&q=80',
        },
        bookingDate: apiBooking.startTime
          ? formatBusinessDateOnly(apiBooking.startTime)
          : apiBooking.bookingDate,
        startTime: apiBooking.startTime
          ? formatBusinessTime(apiBooking.startTime)
          : '00:00',
        endTime: apiBooking.endTime
          ? formatBusinessTime(apiBooking.endTime)
          : '00:00',
        durationMinutes:
          apiBooking.startTime && apiBooking.endTime
            ? durationMinutes(apiBooking.startTime, apiBooking.endTime)
            : 0,
        originalPrice: apiBooking.originalPrice,
        voucherCode: apiBooking.voucher?.code,
        discountAmount: apiBooking.discountAmount,
        otherDiscount: 0,
        finalPrice: apiBooking.finalPrice,
        rejectionReason: localRejectionReason || apiBooking.rejectionReason,
        cancellationReason: apiBooking.cancellationReason,
      };
    }
    return null;
  }, [apiBooking, localStatus, localRejectionReason]);

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  };

  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatDateTimeVN = (isoStr: string) => {
    if (!isoStr) return '';
    return formatBusinessDateTime(isoStr);
  };

  const showToast = (msg: string) => {
    if (/^(Lỗi|Không thể|Có lỗi)/.test(msg)) toast.error(msg);
    else if (/^(Vui lòng|Cảnh báo)/.test(msg)) toast.warning(msg);
    else toast.success(msg);
  };

  const handleConfirmApprove = async () => {
    if (!booking) return;
    setLocalStatus('CONFIRMED');
    setIsApproveModalOpen(false);
    try {
      await approveAdminBooking(bookingId);
      queryClient.invalidateQueries({ queryKey: ['admin-booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      showToast(`Đã duyệt đơn đặt sân ${booking.code} thành công!`);
    } catch (err) {
      showToast(`Lỗi khi duyệt đơn: ${(err as Error).message}`);
    }
  };

  const handleConfirmReject = async () => {
    if (!booking) return;
    const reason = rejectReasonInput.trim() || 'Admin từ chối yêu cầu đặt sân';
    setLocalStatus('REJECTED');
    setLocalRejectionReason(reason);
    setIsRejectModalOpen(false);
    try {
      await rejectAdminBooking(bookingId, reason);
      queryClient.invalidateQueries({ queryKey: ['admin-booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      showToast(`Đã từ chối đơn ${booking.code}.`);
    } catch (err) {
      showToast(`Lỗi khi từ chối đơn: ${(err as Error).message}`);
    }
  };

  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs sm:text-sm font-semibold text-amber-800">
            Chờ xác nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="rounded-full border border-[#006e2f]/20 bg-[#22c55e]/20 px-3 py-1 text-xs sm:text-sm font-semibold text-[#004b1e]">
            Đã xác nhận
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="rounded-full border border-[#bccbb9] bg-[#e1e3e4] px-3 py-1 text-xs sm:text-sm font-semibold text-[#575e70]">
            Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="rounded-full border border-[#ba1a1a]/20 bg-[#ffdad6] px-3 py-1 text-xs sm:text-sm font-semibold text-[#93000a]">
            Đã hủy
          </span>
        );
      case 'REJECTED':
        return (
          <span className="rounded-full border border-[#ba1a1a]/20 bg-[#ffdad6] px-3 py-1 text-xs sm:text-sm font-semibold text-[#93000a]">
            Bị từ chối
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
            <div className="h-4 w-48 bg-slate-200 animate-pulse rounded" />
          </div>
          <div className="h-10 w-40 bg-slate-200 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-48 bg-slate-200 animate-pulse rounded-2xl" />
            <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-80 bg-slate-200 animate-pulse rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto w-full max-w-7xl py-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
          <Ban className="w-8 h-8" />
        </div>
        <h2 className="font-(family-name:--font-manrope) text-xl font-bold text-[#191c1d] mb-2">
          Không tìm thấy đơn đặt sân
        </h2>
        <p className="text-[#575e70] text-sm max-w-md mb-6">
          Đơn đặt sân không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006e2f] text-white font-bold hover:bg-[#004b1e] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="font-(family-name:--font-manrope) text-2xl font-extrabold text-[#191c1d]">
              Booking {booking.code}
            </h2>
            {renderStatusBadge(booking.status)}
          </div>
          <p className="flex items-center gap-1.5 text-xs sm:text-sm text-[#575e70]">
            <Clock className="h-4 w-4" />
            <span>Tạo lúc: {formatDateTimeVN(booking.createdAt)}</span>
          </p>
        </div>

        <Link
          href="/admin/bookings"
          className="flex items-center gap-2 rounded-lg border border-[#bccbb9] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#191c1d] shadow-sm transition-colors hover:bg-[#e7e8e9]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách</span>
        </Link>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Thông tin khách hàng */}
          <section className="flex flex-col gap-4 rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-(family-name:--font-manrope) text-base sm:text-lg font-bold text-[#191c1d]">
              <User className="h-5 w-5 text-[#006e2f]" />
              <span>Thông tin khách hàng</span>
            </h3>

            <div className="flex items-center gap-4 rounded-xl bg-[#f8f9fa] p-4 border border-[#bccbb9]/40">
              {booking.user.avatarUrl ? (
                <img
                  src={booking.user.avatarUrl}
                  alt={booking.user.fullName}
                  className="h-16 w-16 shrink-0 rounded-full border border-[#bccbb9] object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#dce2f3] text-xl font-bold text-[#151c27]">
                  {booking.user.fullName.charAt(0)}
                </div>
              )}
              <div className="flex-1 space-y-1">
                <p className="font-(family-name:--font-manrope) text-base sm:text-lg font-bold text-[#191c1d]">
                  {booking.user.fullName}
                </p>
                <div className="flex flex-col sm:flex-row sm:gap-6 text-xs sm:text-sm text-[#575e70]">
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-[#575e70]" />
                    <span>{booking.user.email}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-[#575e70]" />
                    <span>{booking.user.phone}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Thông tin sân */}
          <section className="flex flex-col gap-4 rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-(family-name:--font-manrope) text-base sm:text-lg font-bold text-[#191c1d]">
              <Layers className="h-5 w-5 text-[#006e2f]" />
              <span>Thông tin sân</span>
            </h3>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="sm:w-1/3">
                <img
                  src={booking.field.imageUrl}
                  alt={booking.field.name}
                  className="h-36 sm:h-full w-full rounded-xl border border-[#bccbb9] object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-2.5 p-2 sm:w-2/3">
                <h4 className="font-(family-name:--font-manrope) text-base sm:text-lg font-bold text-[#191c1d]">
                  {booking.field.name}
                </h4>
                <p className="flex items-start gap-1.5 text-xs sm:text-sm text-[#575e70]">
                  <MapPin className="h-4 w-4 shrink-0 text-[#006e2f] mt-0.5" />
                  <span>{booking.field.address}</span>
                </p>
                <p className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#006e2f]">
                  <Sparkles className="h-4 w-4" />
                  <span>{booking.field.fieldType}</span>
                </p>
              </div>
            </div>
          </section>

          {/* Thông tin đặt sân */}
          <section className="flex flex-col gap-4 rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-(family-name:--font-manrope) text-base sm:text-lg font-bold text-[#191c1d]">
              <Calendar className="h-5 w-5 text-[#006e2f]" />
              <span>Thông tin đặt sân</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-4 text-center">
                <p className="mb-1 text-xs font-semibold text-[#575e70]">
                  Ngày đá
                </p>
                <p className="font-(family-name:--font-manrope) text-base font-bold text-[#191c1d]">
                  {formatDateVN(booking.bookingDate)}
                </p>
              </div>

              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-4 text-center">
                <p className="mb-1 text-xs font-semibold text-[#575e70]">
                  Bắt đầu
                </p>
                <p className="font-(family-name:--font-manrope) text-base font-bold text-[#006e2f]">
                  {booking.startTime}
                </p>
              </div>

              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-4 text-center">
                <p className="mb-1 text-xs font-semibold text-[#575e70]">
                  Kết thúc
                </p>
                <p className="font-(family-name:--font-manrope) text-base font-bold text-[#ba1a1a]">
                  {booking.endTime}
                </p>
              </div>

              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-4 text-center">
                <p className="mb-1 text-xs font-semibold text-[#575e70]">
                  Thời lượng
                </p>
                <p className="font-(family-name:--font-manrope) text-base font-bold text-[#191c1d]">
                  {booking.durationMinutes} phút
                </p>
              </div>
            </div>
          </section>

          {/* Lý do từ chối hoặc hủy nếu có */}
          {(booking.rejectionReason || booking.cancellationReason) && (
            <div className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/30 p-4 text-xs sm:text-sm text-[#93000a]">
              <p className="font-bold">
                {booking.status === 'REJECTED'
                  ? 'Lý do từ chối:'
                  : 'Lý do hủy đơn:'}
              </p>
              <p className="mt-1">
                {booking.rejectionReason || booking.cancellationReason}
              </p>
            </div>
          )}
        </div>

        {/* Right Column (4 cols) - Chi phí & Hành động */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <section className="sticky top-[80px] flex flex-col gap-4 rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 border-b border-[#bccbb9]/60 pb-4 font-(family-name:--font-manrope) text-base sm:text-lg font-bold text-[#191c1d]">
              <Receipt className="h-5 w-5 text-[#006e2f]" />
              <span>Chi phí</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-[#575e70]">
              <div className="flex justify-between">
                <span>Giá thuê sân</span>
                <span className="font-medium text-[#191c1d]">
                  {formatVND(booking.originalPrice)}
                </span>
              </div>

              {booking.discountAmount > 0 && (
                <div className="flex justify-between font-semibold text-[#006e2f]">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="h-4 w-4" />
                    <span>Voucher ({booking.voucherCode})</span>
                  </span>
                  <span>- {formatVND(booking.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Giảm giá khác</span>
                <span className="font-medium text-[#191c1d]">
                  {formatVND(booking.otherDiscount)}
                </span>
              </div>
            </div>

            <div className="border-t border-[#bccbb9]/60 pt-4 mt-2 flex items-baseline justify-between">
              <span className="font-bold text-sm sm:text-base text-[#191c1d]">
                Tổng cộng
              </span>
              <span className="font-(family-name:--font-manrope) text-xl sm:text-2xl font-extrabold text-[#006e2f]">
                {formatVND(booking.finalPrice)}
              </span>
            </div>

            {/* Action Buttons if PENDING */}
            {booking.status === 'PENDING' && (
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006e2f] py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004b1e] active:scale-95"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Duyệt booking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ba1a1a]/50 bg-white py-3 px-4 text-xs sm:text-sm font-bold text-[#ba1a1a] shadow-sm transition-all hover:bg-[#ffdad6]/40 active:scale-95"
                >
                  <XCircle className="h-5 w-5" />
                  <span>Từ chối booking</span>
                </button>
              </div>
            )}

            {/* If Already Confirmed */}
            {booking.status === 'CONFIRMED' && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#22c55e]/15 p-3 text-xs sm:text-sm font-bold text-[#004b1e]">
                <ShieldCheck className="h-5 w-5 text-[#006e2f]" />
                <span>Đơn này đã được xác nhận</span>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Confirmation Modal: Duyệt Booking */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#006e2f]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="font-(family-name:--font-manrope) text-lg sm:text-xl font-bold text-[#191c1d] mb-2">
              Xác nhận duyệt booking?
            </h3>
            <p className="text-xs sm:text-sm text-[#575e70] mb-6 leading-relaxed">
              Hệ thống sẽ gửi thông báo xác nhận thành công đến khách hàng{' '}
              <strong className="text-[#191c1d]">
                {booking.user.fullName}
              </strong>{' '}
              cho đơn đặt sân{' '}
              <strong className="text-[#006e2f]">{booking.code}</strong>.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="w-1/2 rounded-xl border border-[#bccbb9] py-2.5 text-xs sm:text-sm font-semibold text-[#575e70] hover:bg-[#e7e8e9]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="w-1/2 rounded-xl bg-[#006e2f] py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#004b1e]"
              >
                Đồng ý duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal: Từ chối Booking */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#bccbb9]/60 pb-3 text-[#ba1a1a]">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h4 className="font-(family-name:--font-manrope) text-lg font-bold">
                Từ chối booking {booking.code}
              </h4>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-[#575e70]">
              Bạn có chắc chắn muốn từ chối yêu cầu đặt sân của khách hàng{' '}
              <strong className="text-[#191c1d]">
                {booking.user.fullName}
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
                placeholder="Ví dụ: Sân đang bảo dưỡng đột xuất, trùng lịch giải đấu..."
                rows={3}
                className="w-full rounded-xl border border-[#bccbb9] p-3 text-xs sm:text-sm text-[#191c1d] focus:border-[#ba1a1a] focus:outline-none focus:ring-1 focus:ring-[#ba1a1a]"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
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
