/* eslint-disable @next/next/no-img-element */
'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Tag,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock3,
  X,
  ChevronRight,
  RotateCcw,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cancelBooking, getBookingById } from '@/data/mock-bookings';
import type { BookingItem, BookingStatus } from '@/types/booking';

function getStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Chờ xác nhận',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <Clock3 className="w-4 h-4 text-amber-600" />,
      };
    case 'CONFIRMED':
      return {
        label: 'Đã xác nhận',
        bg: 'bg-[#22c55e]/15 text-[#006e2f] border-[#22c55e]/30',
        icon: <CheckCircle2 className="w-4 h-4 text-[#006e2f]" />,
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <CheckCircle2 className="w-4 h-4 text-slate-500" />,
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <XCircle className="w-4 h-4 text-rose-500" />,
      };
    case 'REJECTED':
      return {
        label: 'Bị từ chối',
        bg: 'bg-red-50 text-red-700 border-red-200',
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: null,
      };
  }
}

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;

  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelTriggerRef = useRef<HTMLButtonElement>(null);

  const closeCancelDialog = () => {
    setIsCancelModalOpen(false);
    requestAnimationFrame(() => cancelTriggerRef.current?.focus());
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBooking(getBookingById(bookingId) ?? null);
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [bookingId]);

  useEffect(() => {
    if (!isCancelModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCancelDialog();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCancelModalOpen]);

  const badge = useMemo(
    () => (booking ? getStatusBadge(booking.status) : null),
    [booking],
  );

  const handleConfirmCancel = () => {
    if (!booking) return;
    setIsCancelling(true);

    setTimeout(() => {
      const success = cancelBooking(booking.id, cancelReason);
      if (success) {
        toast.success(`Đã hủy đơn đặt sân #${booking.code} thành công.`);
        const updated = getBookingById(bookingId);
        if (updated) setBooking(updated);
      } else {
        toast.error('Không thể hủy đơn đặt sân này.');
      }
      setIsCancelling(false);
      closeCancelDialog();
    }, 600);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-sm text-[#575e70]">
        Đang tải đơn đặt sân...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#bccbb9]/40 p-8 text-center max-w-md space-y-4">
          <h2 className="text-lg font-bold text-[#191c1d]">
            Không tìm thấy thông tin đơn đặt sân
          </h2>
          <p className="text-xs text-[#575e70]">
            Mã đơn đặt sân không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <Link href="/bookings">
            <Button className="bg-[#006e2f] hover:bg-[#005321] text-white text-xs font-bold px-6 rounded-xl">
              Quay lại danh sách đơn
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPending = booking.status === 'PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isCompleted = booking.status === 'COMPLETED';
  const isRejected = booking.status === 'REJECTED';

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen pb-16 font-sans">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#bccbb9]/40 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-[#575e70] mb-3">
            <Link href="/" className="hover:text-[#006e2f] transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href="/bookings"
              className="hover:text-[#006e2f] transition-colors"
            >
              Đơn đặt sân của tôi
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#191c1d] font-semibold">
              Chi tiết #{booking.code}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1d] font-['Manrope']">
                  Chi tiết Đơn đặt sân
                </h1>
                <span className="text-sm font-bold text-[#575e70] bg-[#f8f9fa] border border-[#bccbb9]/40 px-2.5 py-0.5 rounded-lg">
                  #{booking.code}
                </span>
              </div>
              <p className="text-xs text-[#575e70]">
                Đặt lúc {booking.createdAt}
              </p>
            </div>

            {badge && (
              <div
                className={`self-start sm:self-auto px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm ${badge.bg}`}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Details & Timeline */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Reason alert if cancelled/rejected */}
            {booking.status === 'CANCELLED' && booking.cancellationReason && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-0.5">Lý do hủy đơn:</h4>
                  <p>{booking.cancellationReason}</p>
                </div>
              </div>
            )}

            {booking.status === 'REJECTED' && booking.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-0.5">
                    Lý do từ chối từ chủ sân:
                  </h4>
                  <p>{booking.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* 1. Thông tin sân */}
            <div className="bg-white rounded-2xl border border-[#bccbb9]/40 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#bccbb9]/30">
                <h2 className="text-base font-bold text-[#191c1d] font-['Manrope']">
                  Thông tin sân bóng
                </h2>
              </div>
              <div className="p-5 flex flex-col sm:flex-row gap-5 items-center">
                <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={booking.fieldImage}
                    alt={booking.fieldName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <h3 className="text-lg font-bold text-[#191c1d] font-['Manrope']">
                    {booking.fieldName}
                  </h3>
                  <div className="flex items-start gap-1.5 text-xs text-[#575e70]">
                    <MapPin className="w-4 h-4 text-[#006e2f] shrink-0 mt-0.5" />
                    <span>{booking.fieldAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-xs text-[#006e2f] font-semibold">
                    <span className="bg-[#22c55e]/15 px-2.5 py-0.5 rounded-full border border-[#22c55e]/30">
                      {booking.fieldType}
                    </span>
                    <span>• {booking.courtName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Thông tin lịch thi đấu */}
            <div className="bg-white rounded-2xl border border-[#bccbb9]/40 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#bccbb9]/30">
                <h2 className="text-base font-bold text-[#191c1d] font-['Manrope']">
                  Thông tin đặt sân & Thời gian
                </h2>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/30">
                  <span className="text-[#575e70] block mb-1">
                    Ngày thi đấu
                  </span>
                  <span className="font-bold text-[#191c1d] text-sm">
                    {booking.dateDisplay}
                  </span>
                </div>
                <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/30">
                  <span className="text-[#575e70] block mb-1">Giờ bắt đầu</span>
                  <span className="font-bold text-[#191c1d] text-sm">
                    {booking.startTime}
                  </span>
                </div>
                <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/30">
                  <span className="text-[#575e70] block mb-1">
                    Giờ kết thúc
                  </span>
                  <span className="font-bold text-[#191c1d] text-sm">
                    {booking.endTime}
                  </span>
                </div>
                <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/30">
                  <span className="text-[#575e70] block mb-1">Thời lượng</span>
                  <span className="font-bold text-[#006e2f] text-sm">
                    {booking.durationMinutes} phút
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Tiến trình trạng thái (Timeline Tracker) */}
            <div className="bg-white rounded-2xl border border-[#bccbb9]/40 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#191c1d] font-['Manrope'] mb-6 pb-3 border-b border-[#bccbb9]/30">
                Tiến trình đơn đặt sân
              </h2>

              <div className="relative border-l-2 border-[#bccbb9]/40 ml-4 space-y-6 pb-2">
                {/* Step 1: Đã tạo đơn */}
                <div className="relative pl-6">
                  <div className="absolute w-4 h-4 rounded-full bg-[#006e2f] border-2 border-white -left-[9px] top-1 shadow-sm" />
                  <h4 className="font-bold text-xs text-[#191c1d]">
                    Đã tạo đơn đặt sân
                  </h4>
                  <p className="text-[11px] text-[#575e70]">
                    {booking.createdAt}
                  </p>
                </div>

                {/* Step 2: Chờ xác nhận */}
                <div className="relative pl-6">
                  <div
                    className={`absolute w-4 h-4 rounded-full border-2 border-white -left-[9px] top-1 shadow-sm ${
                      isPending
                        ? 'bg-amber-500'
                        : isConfirmed || isCompleted
                          ? 'bg-[#006e2f]'
                          : 'bg-slate-300'
                    }`}
                  />
                  <h4
                    className={`font-bold text-xs ${
                      isPending ? 'text-amber-700' : 'text-[#191c1d]'
                    }`}
                  >
                    Chờ duyệt lịch từ chủ sân
                  </h4>
                  <p className="text-[11px] text-[#575e70]">
                    {isPending
                      ? 'Ban quản lý đang kiểm tra khung giờ...'
                      : 'Đã hoàn tất bước kiểm tra'}
                  </p>
                </div>

                {/* Step 3: Đã xác nhận / Hoặc Hủy */}
                <div className="relative pl-6">
                  <div
                    className={`absolute w-4 h-4 rounded-full border-2 border-white -left-[9px] top-1 shadow-sm ${
                      isConfirmed
                        ? 'bg-[#006e2f]'
                        : isCompleted
                          ? 'bg-[#006e2f]'
                          : booking.status === 'CANCELLED'
                            ? 'bg-rose-500'
                            : isRejected
                              ? 'bg-red-500'
                              : 'bg-slate-200'
                    }`}
                  />
                  <h4
                    className={`font-bold text-xs ${
                      isConfirmed
                        ? 'text-[#006e2f]'
                        : booking.status === 'CANCELLED'
                          ? 'text-rose-700'
                          : isRejected
                            ? 'text-red-700'
                            : 'text-[#575e70]'
                    }`}
                  >
                    {booking.status === 'CANCELLED'
                      ? 'Đơn đã hủy'
                      : booking.status === 'REJECTED'
                        ? 'Đơn bị từ chối'
                        : 'Đã xác nhận giữ sân'}
                  </h4>
                  <p className="text-[11px] text-[#575e70]">
                    {isConfirmed
                      ? 'Lịch sân đã được khóa chắc chắn cho bạn.'
                      : isCompleted
                        ? 'Trận đấu đã diễn ra thành công.'
                        : booking.status === 'CANCELLED'
                          ? 'Đơn đã được hủy bỏ.'
                          : isRejected
                            ? 'Chủ sân đã từ chối yêu cầu này.'
                            : 'Dự kiến sau khi chủ sân duyệt'}
                  </p>
                </div>

                {/* Step 4: Hoàn thành */}
                <div className="relative pl-6">
                  <div
                    className={`absolute w-4 h-4 rounded-full border-2 border-white -left-[9px] top-1 shadow-sm ${
                      isCompleted ? 'bg-[#006e2f]' : 'bg-slate-200'
                    }`}
                  />
                  <h4
                    className={`font-bold text-xs ${
                      isCompleted ? 'text-[#006e2f]' : 'text-[#575e70]'
                    }`}
                  >
                    Hoàn thành trận đấu
                  </h4>
                  <p className="text-[11px] text-[#575e70]">
                    {isCompleted
                      ? 'Bạn đã hoàn tất trận đấu.'
                      : `Dự kiến: ${booking.endTime}, ${booking.dateDisplay}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Payment breakdown & Actions */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-2xl p-6 border border-[#bccbb9]/50 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#191c1d] font-['Manrope'] pb-3 border-b border-[#bccbb9]/30">
                Chi tiết thanh toán
              </h3>

              <div className="space-y-2 text-xs text-[#575e70]">
                <div className="flex justify-between">
                  <span>Tiền thuê sân ({booking.durationMinutes}p):</span>
                  <span className="font-bold text-[#191c1d]">
                    {booking.originalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-[#006e2f] font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Voucher (
                      {booking.voucherCode || 'Ưu đãi'}):
                    </span>
                    <span>
                      -{booking.discountAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Phí dịch vụ & chiếu sáng:</span>
                  <span className="text-[#006e2f] font-semibold">
                    Miễn phí (0đ)
                  </span>
                </div>

                <div className="pt-3 border-t border-[#bccbb9]/40 flex justify-between items-center">
                  <span className="font-extrabold text-sm text-[#191c1d]">
                    Tổng thanh toán:
                  </span>
                  <span className="text-xl font-extrabold text-[#006e2f] font-['Manrope']">
                    {booking.finalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Sidebar */}
            <div className="bg-white rounded-2xl p-6 border border-[#bccbb9]/50 shadow-sm space-y-3 text-center">
              <p className="text-xs text-[#575e70] mb-2">
                Nếu bạn cần hỗ trợ hoặc thay đổi lịch đá, vui lòng liên hệ ban
                quản lý sân.
              </p>

              {/* Contact Host Button */}
              <a
                href={`tel:${booking.hostPhone || '0908123456'}`}
                className="w-full block"
              >
                <Button
                  variant="outline"
                  className="w-full py-5 rounded-xl text-xs font-bold text-[#006e2f] border-[#006e2f] hover:bg-[#006e2f]/5 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Liên hệ Chủ sân (
                  {booking.hostPhone || '0908 123 456'})
                </Button>
              </a>

              {/* Cancel Button (Only if PENDING) */}
              {isPending && (
                <Button
                  ref={cancelTriggerRef}
                  onClick={() => {
                    setIsCancelModalOpen(true);
                    setCancelReason('');
                  }}
                  className="w-full py-5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                >
                  Hủy đơn đặt sân này
                </Button>
              )}

              {/* Review Button (If COMPLETED) */}
              {isCompleted && (
                <Link
                  href={`/fields/${booking.fieldId}`}
                  className="block w-full"
                >
                  <Button className="w-full py-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 fill-white" /> Đánh giá sân bóng
                  </Button>
                </Link>
              )}

              {/* Re-book */}
              <Link
                href={`/fields/${booking.fieldId}`}
                className="block w-full"
              >
                <Button
                  variant="ghost"
                  className="w-full py-4 text-xs font-semibold text-[#575e70] hover:text-[#006e2f] flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Đặt lại sân này
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          POPUP MODAL: HỦY ĐƠN ĐẶT SÂN
      ========================================== */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-detail-title"
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#bccbb9]/40 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center pb-4 border-b border-[#bccbb9]/30">
              <h3 id="cancel-booking-detail-title" className="text-lg font-bold text-[#191c1d] font-['Manrope'] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Xác nhận hủy đơn đặt sân
              </h3>
              <button
                type="button"
                aria-label="Đóng hộp thoại hủy đơn"
                onClick={closeCancelDialog}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#575e70]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-[#575e70]">
                Bạn có chắc chắn muốn hủy đơn đặt sân này không? Hành động này
                sẽ chuyển đơn sang trạng thái <b>CANCELLED</b> và giải phóng
                khung giờ thi đấu.
              </p>

              <div className="p-3.5 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/40 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Sân bóng:</span>
                  <span className="font-bold text-[#191c1d]">
                    {booking.fieldName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Mã đơn:</span>
                  <span className="font-bold text-[#006e2f]">
                    #{booking.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Ngày đá:</span>
                  <span className="font-medium text-[#191c1d]">
                    {booking.dateDisplay}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Khung giờ:</span>
                  <span className="font-medium text-[#191c1d]">
                    {booking.startTime} - {booking.endTime}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="detail-cancel-reason" className="block text-xs font-bold text-[#191c1d]">
                  Lý do hủy đơn (Không bắt buộc)
                </label>
                <textarea
                  id="detail-cancel-reason"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn..."
                  className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl p-3 text-xs text-[#191c1d] outline-none focus:border-[#006e2f]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={closeCancelDialog}
                className="flex-1 text-xs border-[#bccbb9]/60"
              >
                Quay lại
              </Button>
              <Button
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
