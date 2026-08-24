/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock3,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cancelBooking, getStoredBookings } from '@/data/mock-bookings';
import type { BookingItem, BookingStatus } from '@/types/booking';

const TABS: { label: string; value: 'ALL' | BookingStatus }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
  { label: 'Bị từ chối', value: 'REJECTED' },
];

function getStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Chờ xác nhận',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <Clock3 className="w-3.5 h-3.5 text-amber-600" />,
      };
    case 'CONFIRMED':
      return {
        label: 'Đã xác nhận',
        bg: 'bg-[#22c55e]/15 text-[#006e2f] border-[#22c55e]/30',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#006e2f]" />,
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />,
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
      };
    case 'REJECTED':
      return {
        label: 'Bị từ chối',
        bg: 'bg-red-50 text-red-700 border-red-200',
        icon: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: null,
      };
  }
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | BookingStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Cancel Modal state
  const [cancellingBooking, setCancellingBooking] =
    useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelTriggerRef = useRef<HTMLButtonElement>(null);

  const closeCancelDialog = () => {
    setCancellingBooking(null);
    requestAnimationFrame(() => cancelTriggerRef.current?.focus());
  };

  const refreshBookings = () => {
    setBookings(getStoredBookings());
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBookings(getStoredBookings());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!cancellingBooking) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCancelDialog();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancellingBooking]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchTab = activeTab === 'ALL' || b.status === activeTab;
      const matchQuery =
        !searchQuery.trim() ||
        b.fieldName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.fieldAddress.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchQuery;
    });
  }, [bookings, activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredBookings.length / limit) || 1;

  const currentPage = Math.min(page, totalPages);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredBookings.slice(start, start + limit);
  }, [currentPage, filteredBookings, limit]);

  const handleOpenCancelModal = (booking: BookingItem) => {
    setCancellingBooking(booking);
    setCancelReason('');
  };

  const handleConfirmCancel = () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);

    setTimeout(() => {
      const success = cancelBooking(cancellingBooking.id, cancelReason);
      if (success) {
        toast.success(
          `Đã hủy đơn đặt sân #${cancellingBooking.code} thành công.`,
        );
        refreshBookings();
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

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen pb-16 font-sans">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#bccbb9]/40 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1d] font-['Manrope']">
                Đơn đặt sân của tôi
              </h1>
              <p className="text-xs text-[#575e70] mt-1">
                Quản lý, tra cứu và theo dõi trạng thái các lượt đặt sân bóng đá
                của bạn.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#575e70]" />
              <input
                id="booking-search"
                type="text"
                aria-label="Tìm đơn đặt sân"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo tên sân, mã đơn..."
                className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#191c1d] outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pt-6 pb-1 no-scrollbar">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              const count =
                tab.value === 'ALL'
                  ? bookings.length
                  : bookings.filter((b) => b.status === tab.value).length;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setActiveTab(tab.value);
                    setPage(1);
                  }}
                  aria-pressed={isActive}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#006e2f] text-white shadow-sm'
                      : 'bg-[#f8f9fa] text-[#575e70] border border-[#bccbb9]/40 hover:border-[#006e2f]/40 hover:text-[#006e2f]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#edeeef] text-[#575e70]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bookings List Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#bccbb9]/40 p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#006e2f]/10 text-[#006e2f] flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#191c1d] font-['Manrope']">
              Không tìm thấy đơn đặt sân nào
            </h3>
            <p className="text-xs text-[#575e70] max-w-sm mx-auto">
              {searchQuery
                ? `Không có kết quả phù hợp với từ khóa "${searchQuery}".`
                : 'Bạn chưa có đơn đặt sân nào trong danh mục này.'}
            </p>
            <Link href="/fields">
              <Button className="mt-2 bg-[#006e2f] hover:bg-[#005321] text-white text-xs font-bold px-6 py-2 rounded-xl">
                Khám phá sân ngay
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBookings.map((b) => {
              const badge = getStatusBadge(b.status);
              const isPending = b.status === 'PENDING';
              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-[#bccbb9]/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
                >
                  {/* Card Header & Image */}
                  <div className="h-44 relative bg-slate-100 overflow-hidden">
                    <img
                      src={b.fieldImage}
                      alt={b.fieldName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shadow-sm backdrop-blur-md ${badge.bg}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-bold text-base text-[#191c1d] font-['Manrope'] line-clamp-1">
                          {b.fieldName}
                        </h3>
                        <span className="text-xs font-bold text-[#575e70] bg-[#f8f9fa] border border-[#bccbb9]/40 px-2 py-0.5 rounded-lg shrink-0 ml-2">
                          #{b.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[#575e70] text-xs mb-3">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#006e2f]" />
                        <span className="truncate">{b.fieldAddress}</span>
                      </div>

                      {/* Details specs */}
                      <div className="space-y-1.5 bg-[#f8f9fa] p-3 rounded-xl border border-[#bccbb9]/30 text-xs text-[#191c1d]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#006e2f] shrink-0" />
                          <span className="font-semibold">{b.dateDisplay}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#006e2f] shrink-0" />
                          <span>
                            {b.startTime} - {b.endTime} ({b.durationMinutes}{' '}
                            phút)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action Buttons */}
                    <div className="pt-3 border-t border-[#bccbb9]/30">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] text-[#575e70]">
                          Tổng tiền:
                        </span>
                        <span className="font-extrabold text-base text-[#006e2f] font-['Manrope']">
                          {b.finalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/bookings/${b.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full text-xs font-semibold border-[#bccbb9]/60 hover:bg-[#006e2f]/5 hover:text-[#006e2f] hover:border-[#006e2f] rounded-xl py-2"
                          >
                            Xem chi tiết
                          </Button>
                        </Link>

                        {isPending && (
                          <Button
                            ref={cancelTriggerRef}
                            onClick={() => handleOpenCancelModal(b)}
                            className="text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl py-2 px-3"
                          >
                            Hủy đơn
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-10 pb-6">
            <button
              type="button"
              aria-label="Trang trước"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 rounded-lg border border-[#bccbb9]/60 flex items-center justify-center text-[#575e70] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const num = idx + 1;
              return (
                <button
                  key={num}
                  type="button"
                  aria-label={`Trang ${num}`}
                  aria-current={currentPage === num ? 'page' : undefined}
                  onClick={() => setPage(num)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    currentPage === num
                      ? 'bg-[#006e2f] text-white shadow-sm'
                      : 'border border-[#bccbb9]/60 text-[#575e70] hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              );
            })}

            <button
              type="button"
              aria-label="Trang sau"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 rounded-lg border border-[#bccbb9]/60 flex items-center justify-center text-[#575e70] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ==========================================
          POPUP MODAL: HỦY ĐƠN ĐẶT SÂN
      ========================================== */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#bccbb9]/40 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center pb-4 border-b border-[#bccbb9]/30">
              <h3
                id="cancel-booking-title"
                className="text-lg font-bold text-[#191c1d] font-['Manrope'] flex items-center gap-2"
              >
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

              {/* Booking Summary Box */}
              <div className="p-3.5 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/40 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Sân bóng:</span>
                  <span className="font-bold text-[#191c1d]">
                    {cancellingBooking.fieldName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Mã đơn:</span>
                  <span className="font-bold text-[#006e2f]">
                    #{cancellingBooking.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Ngày đá:</span>
                  <span className="font-medium text-[#191c1d]">
                    {cancellingBooking.dateDisplay}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Khung giờ:</span>
                  <span className="font-medium text-[#191c1d]">
                    {cancellingBooking.startTime} - {cancellingBooking.endTime}
                  </span>
                </div>
              </div>

              {/* Reason Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="cancel-reason"
                  className="block text-xs font-bold text-[#191c1d]"
                >
                  Lý do hủy đơn (Không bắt buộc)
                </label>
                <textarea
                  id="cancel-reason"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn (Ví dụ: Đội bận đột xuất, đổi giờ đá...)"
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
