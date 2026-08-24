'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  AlertTriangle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ApiError, cancelBooking, fetchMyBookings } from '@/lib/api';
import {
  formatBusinessDate,
  formatBusinessTime,
  durationMinutes,
} from '@/lib/booking-time';
import { useRequireAuth } from '@/hooks/use-require-auth';
import type { BookingStatus } from '@/types/booking';

const TABS: Array<{ label: string; value?: BookingStatus }> = [
  { label: 'Tất cả' },
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
  { label: 'Bị từ chối', value: 'REJECTED' },
];

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Bị từ chối',
};

export default function MyBookingsPage() {
  const authReady = useRequireAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<BookingStatus | undefined>();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const query = useQuery({
    queryKey: ['bookings', 'me', { page, status, search }],
    queryFn: () =>
      fetchMyBookings({ page, limit: 6, status, search: search || undefined }),
    enabled: authReady,
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id, { reason }),
    onSuccess: async () => {
      setCancelTarget(null);
      setReason('');
      toast.success('Đã hủy đơn đặt sân thành công.');
      await queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['booking'] });
      await queryClient.invalidateQueries({ queryKey: ['availability'] });
      await queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
    },
  });

  if (!authReady || query.isLoading)
    return <State message="Đang tải đơn đặt sân..." />;
  if (query.isError)
    return (
      <State message="Không thể tải lịch sử đặt sân. Vui lòng thử lại." error />
    );

  const bookings = query.data?.data ?? [];
  const totalPages = query.data?.meta.totalPages ?? 1;
  const cancellingBooking = bookings.find((b) => b.id === cancelTarget);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16 text-[#191c1d] font-sans">
      <header className="border-b border-[#bccbb9]/40 bg-white py-6 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-extrabold font-['Manrope']">
              Đơn đặt sân của tôi
            </h1>
            <p className="mt-1 text-xs text-[#575e70]">
              Theo dõi lịch sử và trạng thái các đơn đặt sân của bạn.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <input
              aria-label="Tìm đơn đặt sân"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên sân, mã đơn..."
              className="w-full rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] px-3 py-2 text-xs outline-none focus:border-[#006e2f]"
            />
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pt-6 sm:px-6 lg:px-8">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                status === tab.value
                  ? 'bg-[#006e2f] text-white shadow-sm'
                  : 'border border-[#bccbb9]/40 bg-[#f8f9fa] text-[#575e70] hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-[#bccbb9]/40 bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-[#006e2f]" />
            <h2 className="mt-3 font-bold text-sm">Không có đơn đặt sân</h2>
            <p className="mt-1 text-xs text-[#575e70]">
              Thử bộ lọc khác hoặc khám phá sân mới ngay hôm nay.
            </p>
            <Link href="/fields">
              <Button className="mt-4 bg-[#006e2f] text-xs font-bold rounded-xl">
                Khám phá sân
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="flex flex-col justify-between rounded-2xl border border-[#bccbb9]/40 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-1 font-bold text-sm text-[#191c1d]">
                      {booking.field.name}
                    </h2>
                    <span className="rounded-lg bg-[#f8f9fa] border border-[#bccbb9]/40 px-2 py-1 text-[10px] font-bold text-[#006e2f]">
                      #{booking.code}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-1 truncate text-xs text-[#575e70]">
                    <MapPin className="h-3.5 w-3.5 text-[#006e2f] shrink-0" />
                    {booking.field.address}
                  </p>
                  <div className="mt-4 space-y-2 rounded-xl bg-[#f8f9fa] p-3 text-xs border border-[#bccbb9]/30">
                    <p className="flex items-center gap-2 text-[#191c1d]">
                      <Calendar className="h-3.5 w-3.5 text-[#006e2f]" />
                      {formatBusinessDate(booking.startTime)}
                    </p>
                    <p className="flex items-center gap-2 text-[#191c1d]">
                      <Clock className="h-3.5 w-3.5 text-[#006e2f]" />
                      {formatBusinessTime(booking.startTime)} -{' '}
                      {formatBusinessTime(booking.endTime)} (
                      {durationMinutes(booking.startTime, booking.endTime)}{' '}
                      phút)
                    </p>
                  </div>
                </div>
                <div className="mt-5 border-t border-[#bccbb9]/30 pt-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#575e70]">
                      {STATUS_LABELS[booking.status] || booking.status}
                    </span>
                    <b className="text-[#006e2f] text-sm">
                      {booking.finalPrice.toLocaleString('vi-VN')}đ
                    </b>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/bookings/${booking.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full rounded-xl text-xs font-semibold"
                      >
                        Xem chi tiết
                      </Button>
                    </Link>
                    {booking.status === 'PENDING' && (
                      <Button
                        onClick={() => {
                          setCancelTarget(booking.id);
                          setReason('');
                        }}
                        className="rounded-xl bg-rose-50 text-xs text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold"
                      >
                        Hủy
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-10">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-[#bccbb9]/60 p-2 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-[#575e70]">
              Trang {page}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-[#bccbb9]/60 p-2 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
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
                onClick={() => setCancelTarget(null)}
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

              {cancellingBooking && (
                <div className="p-3.5 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/40 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#575e70]">Sân bóng:</span>
                    <span className="font-bold text-[#191c1d]">
                      {cancellingBooking.field.name}
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
                      {formatBusinessDate(cancellingBooking.startTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#575e70]">Khung giờ:</span>
                    <span className="font-medium text-[#191c1d]">
                      {formatBusinessTime(cancellingBooking.startTime)} -{' '}
                      {formatBusinessTime(cancellingBooking.endTime)}
                    </span>
                  </div>
                </div>
              )}

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
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn (Ví dụ: Đội bận đột xuất, đổi giờ đá...)"
                  className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl p-3 text-xs text-[#191c1d] outline-none focus:border-[#006e2f]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCancelTarget(null)}
                className="flex-1 text-xs font-semibold"
              >
                Quay lại
              </Button>
              <Button
                onClick={() => cancelMutation.mutate(cancelTarget)}
                disabled={cancelMutation.isPending}
                className="flex-1 bg-rose-600 text-xs text-white hover:bg-rose-700 font-bold"
              >
                {cancelMutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function State({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[60vh] items-center justify-center text-sm ${error ? 'text-red-700' : 'text-[#575e70]'}`}
    >
      {message}
    </div>
  );
}
