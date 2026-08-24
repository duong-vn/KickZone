/* eslint-disable @next/next/no-img-element */
'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Shield,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  ApiError,
  createBooking,
  fetchAvailability,
  fetchFieldById,
  validateVoucher,
} from '@/lib/api';
import {
  formatBusinessDate,
  formatBusinessTime,
  durationMinutes,
} from '@/lib/booking-time';
import { useRequireAuth } from '@/hooks/use-require-auth';

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const authReady = useRequireAuth();

  const fieldId = params.get('fieldId') ?? '';
  const startTime = params.get('startTime') ?? '';
  const endTime = params.get('endTime') ?? '';
  const validDraft = Boolean(
    fieldId &&
    startTime &&
    endTime &&
    !Number.isNaN(new Date(startTime).getTime()) &&
    !Number.isNaN(new Date(endTime).getTime()),
  );

  const fieldQuery = useQuery({
    queryKey: ['field', fieldId],
    queryFn: () => fetchFieldById(fieldId),
    enabled: authReady && validDraft,
    retry: false,
  });

  const date = startTime
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(startTime))
    : '';

  const availabilityQuery = useQuery({
    queryKey: ['availability', fieldId, date],
    queryFn: () => fetchAvailability(fieldId, date),
    enabled: authReady && validDraft && Boolean(date),
    retry: false,
  });

  const field = fieldQuery.data?.data;
  const availableSlots = availabilityQuery.data?.data.slots ?? [];
  const selectedSlots = availableSlots.filter(
    (slot) =>
      new Date(slot.startTime) >= new Date(startTime) &&
      new Date(slot.endTime) <= new Date(endTime),
  );
  const originalPrice = selectedSlots.reduce(
    (sum, slot) => sum + slot.price,
    0,
  );

  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState<{
    code: string;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);
  const [isVoucherLoading, setVoucherLoading] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      createBooking({
        fieldId,
        startTime,
        endTime,
        voucherCode: voucher?.code,
      }),
    onSuccess: async ({ data }) => {
      await queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
      await queryClient.invalidateQueries({
        queryKey: ['availability', fieldId, date],
      });
      toast.success(`Đã tạo yêu cầu đặt sân #${data.code}.`);
      router.push(`/bookings/${data.id}`);
    },
    onError: (error: ApiError) => {
      if (error.code === 'BOOKING_OVERLAP') {
        void queryClient.invalidateQueries({
          queryKey: ['availability', fieldId, date],
        });
        toast.error(
          'Khung giờ vừa có người đặt. Vui lòng quay lại chọn giờ khác.',
        );
      } else toast.error(error.message);
    },
  });

  const applyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return toast.error('Vui lòng nhập mã voucher.');
    setVoucherLoading(true);
    try {
      const response = await validateVoucher({
        fieldId,
        startTime,
        endTime,
        code,
        originalPrice: originalPrice || field?.basePricePerHour || 0,
      });
      setVoucher({
        code: response.data.code,
        discountAmount: response.data.discountAmount,
        finalPrice: response.data.finalPrice,
      });
      toast.success('Đã kiểm tra voucher trên server.');
    } catch (error) {
      setVoucher(null);
      toast.error(
        error instanceof ApiError ? error.message : 'Voucher không hợp lệ.',
      );
    } finally {
      setVoucherLoading(false);
    }
  };

  if (!authReady) return <State message="Đang kiểm tra đăng nhập..." />;
  if (!validDraft)
    return (
      <State
        message="Thông tin đặt sân không hợp lệ. Hãy chọn lại sân và khung giờ."
        error
      />
    );
  if (fieldQuery.isLoading || availabilityQuery.isLoading)
    return <State message="Đang tải thông tin đặt sân..." />;
  if (fieldQuery.isError || availabilityQuery.isError || !field)
    return <State message="Không thể tải thông tin đặt sân." error />;

  const firstImage = Array.isArray(field.images) ? field.images[0] : null;
  const image =
    typeof firstImage === 'string'
      ? firstImage
      : typeof firstImage === 'object' && firstImage !== null
        ? (firstImage.storagePath ?? firstImage.storage_path ?? null)
        : (field.image ?? field.primary_image_url ?? null);

  const duration = durationMinutes(startTime, endTime);
  const total = voucher?.finalPrice ?? originalPrice;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16 text-[#191c1d] font-sans">
      <div className="border-b border-[#bccbb9]/40 bg-white py-5 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-[#575e70]">
            <Link href="/fields" className="hover:text-[#006e2f]">
              Tìm sân
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-[#191c1d]">
              Xác nhận đặt sân
            </span>
          </nav>
          <h1 className="mt-2 text-2xl font-extrabold font-['Manrope']">
            Xác nhận thông tin đặt sân
          </h1>
        </div>
      </div>
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-12 lg:px-8">
        <section className="space-y-6 lg:col-span-8">
          <div className="flex gap-5 rounded-2xl border border-[#bccbb9]/40 bg-white p-5 shadow-sm">
            <div className="h-28 w-40 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              {image?.startsWith('http') && (
                <img
                  src={image}
                  alt={field.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">{field.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-xs text-[#575e70]">
                <MapPin className="h-3.5 w-3.5 text-[#006e2f] shrink-0" />
                {field.address}
              </p>
              <span className="mt-2 inline-block rounded-full bg-[#006e2f]/10 px-2.5 py-1 text-xs font-bold text-[#006e2f]">
                {typeof field.type === 'string'
                  ? field.type
                  : (field.type?.name ?? 'Sân bóng')}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#bccbb9]/40 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 border-b border-[#bccbb9]/30 pb-3 font-bold text-sm">
              <Clock className="h-4 w-4 text-[#006e2f]" />
              Thời gian thi đấu
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Info
                icon={<Calendar className="w-4 h-4" />}
                label="Ngày"
                value={formatBusinessDate(startTime)}
              />
              <Info
                icon={<Clock className="w-4 h-4" />}
                label="Khung giờ"
                value={`${formatBusinessTime(startTime)} - ${formatBusinessTime(endTime)}`}
              />
              <Info
                icon={<Clock className="w-4 h-4" />}
                label="Thời lượng"
                value={`${duration} phút`}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-[#bccbb9]/40 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 border-b border-[#bccbb9]/30 pb-3 font-bold text-sm">
              <Tag className="h-4 w-4 text-[#006e2f]" />
              Mã ưu đãi / Voucher
            </h3>
            <div className="flex gap-2">
              <input
                value={voucherCode}
                onChange={(event) => {
                  setVoucherCode(event.target.value);
                  setVoucher(null);
                }}
                placeholder="Nhập mã voucher (vd: KICKZONE50, KZ10)"
                className="flex-1 rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] px-3 py-2 text-xs uppercase outline-none focus:border-[#006e2f]"
              />
              <Button
                onClick={applyVoucher}
                disabled={isVoucherLoading}
                className="rounded-xl bg-[#006e2f] text-xs font-bold"
              >
                {isVoucherLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
              </Button>
            </div>
            {voucher && (
              <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#006e2f]">
                <CheckCircle2 className="h-4 w-4" />
                Giảm {voucher.discountAmount.toLocaleString('vi-VN')}đ
              </p>
            )}
          </div>
        </section>
        <aside className="lg:col-span-4">
          <div className="sticky top-6 rounded-2xl border border-[#bccbb9]/50 bg-white p-6 shadow-xl">
            <h3 className="mb-4 border-b border-[#bccbb9]/30 pb-3 text-lg font-bold">
              Chi tiết giá
            </h3>
            <div className="space-y-3 text-xs text-[#575e70]">
              <div className="flex justify-between">
                <span>Giá thuê sân</span>
                <b className="text-[#191c1d]">
                  {originalPrice.toLocaleString('vi-VN')}đ
                </b>
              </div>
              {voucher && (
                <div className="flex justify-between text-[#006e2f]">
                  <span>Voucher</span>
                  <b>-{voucher.discountAmount.toLocaleString('vi-VN')}đ</b>
                </div>
              )}
              <div className="flex justify-between border-t border-[#bccbb9]/40 pt-3 text-sm">
                <b>Tổng giá</b>
                <b className="text-xl text-[#006e2f]">
                  {total.toLocaleString('vi-VN')}đ
                </b>
              </div>
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !selectedSlots.length}
              className="mt-6 w-full rounded-xl bg-[#006e2f] py-6 text-base font-bold hover:bg-[#005321] cursor-pointer"
            >
              {createMutation.isPending
                ? 'Đang gửi yêu cầu...'
                : 'Xác nhận & Gửi yêu cầu'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mt-2 w-full rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Quay lại
            </Button>
            <p className="mt-4 flex items-center gap-1 text-[11px] text-[#575e70]">
              <Shield className="h-3.5 w-3.5 text-[#006e2f] shrink-0" />
              Giá sẽ được xác nhận lại khi tạo booking.
            </p>
          </div>
        </aside>
      </main>
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
      <span className="block text-[11px] text-[#575e70]">{label}</span>
      <span className="mt-1 flex items-center gap-1 text-sm font-bold">
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<State message="Đang tải thông tin đặt sân..." />}>
      <CheckoutContent />
    </Suspense>
  );
}
