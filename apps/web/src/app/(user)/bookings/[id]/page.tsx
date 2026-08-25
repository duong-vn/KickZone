'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Tag,
  AlertTriangle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ApiError, cancelBooking, fetchBooking } from '@/lib/api';
import {
  formatBusinessDate,
  formatBusinessTime,
  durationMinutes,
} from '@/lib/booking-time';
import { useRequireAuth } from '@/hooks/use-require-auth';
import type { BookingStatus } from '@/types/booking';
import { formatFieldTypeName } from '@/lib/utils';

const labels: Record<BookingStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Bị từ chối',
};

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const authReady = useRequireAuth();
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const [modal, setModal] = useState(false);

  const query = useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBooking(id),
    enabled: authReady,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: () => cancelBooking(id, { reason }),
    onSuccess: async () => {
      setModal(false);
      toast.success('Đã hủy đơn đặt sân.');
      await client.invalidateQueries({ queryKey: ['booking', id] });
      await client.invalidateQueries({ queryKey: ['bookings', 'me'] });
      await client.invalidateQueries({ queryKey: ['availability'] });
      await client.invalidateQueries({ queryKey: ['fields'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
      void client.invalidateQueries({ queryKey: ['booking', id] });
    },
  });

  if (!authReady || query.isLoading)
    return <State message="Đang tải đơn đặt sân..." />;
  if (query.isError || !query.data?.data)
    return (
      <State
        message="Không tìm thấy đơn hoặc bạn không có quyền truy cập."
        error
      />
    );

  const booking = query.data.data;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16 text-[#191c1d]">
      <header className="border-b border-[#bccbb9]/40 bg-white py-6 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/bookings"
            className="flex items-center gap-1 text-xs text-[#006e2f]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Đơn đặt sân của tôi
          </Link>
          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-extrabold font-['Manrope']">
              Chi tiết #{booking.code}
            </h1>
            <span className="rounded-full bg-[#006e2f]/10 px-4 py-1.5 text-xs font-bold text-[#006e2f]">
              {labels[booking.status]}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#575e70]">
            Đặt lúc {formatBusinessDate(booking.createdAt)}{' '}
            {formatBusinessTime(booking.createdAt)}
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-12 lg:px-8">
        <section className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-[#bccbb9]/40 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-sm">Thông tin sân bóng</h2>
            <h3 className="text-lg font-bold">{booking.field.name}</h3>
            <p className="mt-2 flex items-center gap-1 text-xs text-[#575e70]">
              <MapPin className="h-4 w-4 text-[#006e2f]" />
              {booking.field.address}
            </p>
            <span className="mt-3 inline-block rounded-full bg-[#006e2f]/10 px-2.5 py-1 text-xs font-semibold text-[#006e2f]">
              {formatFieldTypeName(booking.field.type)}
            </span>
          </div>

          <div className="rounded-2xl border border-[#bccbb9]/40 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-sm">Thông tin thời gian</h2>
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <Info
                icon={<Calendar className="w-4 h-4" />}
                label="Ngày"
                value={formatBusinessDate(booking.startTime)}
              />
              <Info
                icon={<Clock className="w-4 h-4" />}
                label="Bắt đầu"
                value={formatBusinessTime(booking.startTime)}
              />
              <Info
                icon={<Clock className="w-4 h-4" />}
                label="Kết thúc"
                value={formatBusinessTime(booking.endTime)}
              />
              <Info
                icon={<Clock className="w-4 h-4" />}
                label="Thời lượng"
                value={`${durationMinutes(booking.startTime, booking.endTime)} phút`}
              />
            </div>
          </div>

          {(booking.cancellationReason || booking.rejectionReason) && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              {booking.cancellationReason || booking.rejectionReason}
            </div>
          )}
        </section>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-[#bccbb9]/50 bg-white p-6 shadow-sm">
            <h2 className="mb-4 border-b border-[#bccbb9]/30 pb-3 font-bold text-sm">
              Chi tiết giá
            </h2>
            <div className="space-y-3 text-xs text-[#575e70]">
              <div className="flex justify-between">
                <span>Giá thuê sân</span>
                <b className="text-[#191c1d]">
                  {booking.originalPrice.toLocaleString('vi-VN')}đ
                </b>
              </div>
              {booking.voucher && (
                <div className="flex justify-between text-[#006e2f]">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    {booking.voucher.code}
                  </span>
                  <b>-{booking.discountAmount.toLocaleString('vi-VN')}đ</b>
                </div>
              )}
              <div className="flex justify-between border-t border-[#bccbb9]/30 pt-3 text-sm">
                <b>Tổng giá</b>
                <b className="text-xl text-[#006e2f]">
                  {booking.finalPrice.toLocaleString('vi-VN')}đ
                </b>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#bccbb9]/50 bg-white p-6 shadow-sm">
            {booking.status === 'PENDING' && (
              <Button
                onClick={() => setModal(true)}
                className="w-full rounded-xl bg-rose-600 text-xs text-white hover:bg-rose-700 font-bold"
              >
                Hủy đơn đặt sân
              </Button>
            )}
            <Link href={`/fields/${booking.field.id}`} className="mt-2 block">
              <Button
                variant="outline"
                className="w-full rounded-xl text-xs font-semibold"
              >
                Đặt lại sân này
              </Button>
            </Link>
          </div>
        </aside>
      </main>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-4 border-b border-[#bccbb9]/30">
              <h3
                id="cancel-booking-detail-title"
                className="text-lg font-bold text-[#191c1d] font-['Manrope'] flex items-center gap-2"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Xác nhận hủy đơn đặt sân
              </h3>
              <button
                type="button"
                aria-label="Đóng hộp thoại hủy đơn"
                onClick={() => setModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#575e70]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-[#575e70]">
                Bạn có chắc chắn muốn hủy đơn đặt sân này không? Khung giờ thi
                đấu sẽ được giải phóng ngay sau khi hủy.
              </p>

              <div className="p-3.5 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/40 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Sân bóng:</span>
                  <span className="font-bold text-[#191c1d]">
                    {booking.field.name}
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
                    {formatBusinessDate(booking.startTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Khung giờ:</span>
                  <span className="font-medium text-[#191c1d]">
                    {formatBusinessTime(booking.startTime)} -{' '}
                    {formatBusinessTime(booking.endTime)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="detail-cancel-reason"
                  className="block text-xs font-bold text-[#191c1d]"
                >
                  Lý do hủy đơn (Không bắt buộc)
                </label>
                <textarea
                  id="detail-cancel-reason"
                  rows={3}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn..."
                  className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl p-3 text-xs text-[#191c1d] outline-none focus:border-[#006e2f]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setModal(false)}
                className="flex-1 text-xs font-semibold"
              >
                Quay lại
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 bg-rose-600 text-xs text-white hover:bg-rose-700 font-bold"
              >
                {mutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#f8f9fa] p-3">
      <span className="block text-[#575e70]">{label}</span>
      <span className="mt-1 flex items-center gap-1 font-bold">
        <span className="text-[#006e2f]">{icon}</span>
        {value}
      </span>
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
