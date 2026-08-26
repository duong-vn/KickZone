/* eslint-disable @next/next/no-img-element */
'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
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
import { cn, formatFieldTypeName } from '@/lib/utils';
import {
  ApiError,
  createBooking,
  fetchAvailability,
  fetchFieldById,
  validateVoucher,
} from '@/lib/api';
import {
  businessDateKey,
  durationMinutes,
  formatBusinessDate,
  formatBusinessTime,
  getContiguousAvailableSlots,
  parseBusinessInterval,
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
  const interval = parseBusinessInterval(startTime, endTime);
  const validDraft = Boolean(fieldId && interval);

  const fieldQuery = useQuery({
    queryKey: ['field', fieldId],
    queryFn: () => fetchFieldById(fieldId),
    enabled: authReady && validDraft,
    retry: false,
  });

  const date = interval ? businessDateKey(interval.start) : '';

  const availabilityQuery = useQuery({
    queryKey: ['availability', fieldId, date],
    queryFn: () => fetchAvailability(fieldId, date),
    enabled: authReady && validDraft && Boolean(date),
    retry: false,
  });

  const field = fieldQuery.data?.data;
  const availableSlots = availabilityQuery.data?.data.slots ?? [];
  const selectedSlots = interval
    ? getContiguousAvailableSlots(availableSlots, startTime, endTime)
    : [];
  const isSelectionValid =
    availabilityQuery.data?.data.date === date && selectedSlots.length > 0;
  const originalPrice = isSelectionValid
    ? selectedSlots.reduce((sum, slot) => sum + slot.price, 0)
    : 0;

  const voucherParam = (
    params.get('voucher') ??
    params.get('voucherCode') ??
    ''
  ).trim();

  const [voucherCode, setVoucherCode] = useState(voucherParam);
  const [voucher, setVoucher] = useState<{
    code: string;
    discountAmount: number;
    finalPrice: number;
    startTime: string;
    endTime: string;
    originalPrice: number;
  } | null>(null);
  const [isVoucherLoading, setVoucherLoading] = useState(false);
  const autoAppliedRef = useRef(false);

  const activeVoucher =
    voucher?.startTime === startTime &&
    voucher.endTime === endTime &&
    voucher.originalPrice === originalPrice
      ? voucher
      : null;

  const createMutation = useMutation({
    mutationFn: () =>
      createBooking({
        fieldId,
        startTime,
        endTime,
        voucherCode: activeVoucher?.code,
      }),
    onSuccess: ({ data }) => {
      toast.success(`Đã tạo yêu cầu đặt sân #${data.code}.`);
      router.push(`/bookings/${data.id}`);
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
      void queryClient.invalidateQueries({
        queryKey: ['availability', fieldId, date],
      });
    },
    onError: (error: ApiError) => {
      if (error.code === 'BOOKING_OVERLAP') {
        setVoucher(null);
        void queryClient.invalidateQueries({
          queryKey: ['availability', fieldId, date],
        });
        toast.error(
          'Khung giờ vừa có người đặt. Vui lòng quay lại chọn giờ khác.',
        );
      } else toast.error(error.message);
    },
  });

  const applyVoucher = useCallback(
    async (codeToApply?: string) => {
      const code = (codeToApply ?? voucherCode).trim().toUpperCase();
      if (!code) return toast.error('Vui lòng nhập mã voucher.');
      if (!isSelectionValid || originalPrice <= 0) {
        return toast.error('Khung giờ đã chọn không còn khả dụng.');
      }
      setVoucherLoading(true);
      try {
        const response = await validateVoucher({
          fieldId,
          startTime,
          endTime,
          code,
          originalPrice,
        });
        const result =
          (
            response as {
              data?: {
                code?: string;
                discountAmount?: number;
                finalPrice?: number;
                valid?: boolean;
                message?: string;
              };
            }
          )?.data ||
          (response as {
            code?: string;
            discountAmount?: number;
            finalPrice?: number;
            valid?: boolean;
            message?: string;
          });
        if (
          result &&
          result.valid !== false &&
          (result.code || result.discountAmount !== undefined)
        ) {
          const effectiveCode = result.code || code;
          const effectiveDiscount = result.discountAmount ?? 0;
          const effectiveFinalPrice =
            result.finalPrice ?? Math.max(0, originalPrice - effectiveDiscount);
          setVoucher({
            code: effectiveCode,
            discountAmount: effectiveDiscount,
            finalPrice: effectiveFinalPrice,
            startTime,
            endTime,
            originalPrice,
          });
          toast.success(result.message || 'Áp dụng mã giảm giá thành công!');
        } else {
          setVoucher(null);
          toast.error(result?.message || 'Voucher không hợp lệ.');
        }
      } catch (error) {
        setVoucher(null);
        toast.error(
          error instanceof ApiError ? error.message : 'Voucher không hợp lệ.',
        );
      } finally {
        setVoucherLoading(false);
      }
    },
    [endTime, fieldId, isSelectionValid, originalPrice, startTime, voucherCode],
  );

  useEffect(() => {
    if (
      voucherParam &&
      !autoAppliedRef.current &&
      fieldQuery.data &&
      availabilityQuery.isSuccess &&
      isSelectionValid &&
      originalPrice > 0
    ) {
      autoAppliedRef.current = true;
      void applyVoucher(voucherParam);
    }
  }, [
    voucherParam,
    fieldQuery.data,
    availabilityQuery.data,
    availabilityQuery.isSuccess,
    isSelectionValid,
    originalPrice,
    applyVoucher,
  ]);

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
  const total = activeVoucher?.finalPrice ?? originalPrice;

  const handleCreateBooking = async () => {
    const freshAvailability = await availabilityQuery.refetch();
    const freshSlots = freshAvailability.data?.data.slots ?? [];
    if (!getContiguousAvailableSlots(freshSlots, startTime, endTime).length) {
      setVoucher(null);
      toast.error('Khung giờ không còn khả dụng. Vui lòng chọn lại.');
      return;
    }
    createMutation.mutate();
  };

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
                {formatFieldTypeName(field.type)}
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
                disabled={Boolean(activeVoucher)}
                onChange={(event) => {
                  setVoucherCode(event.target.value);
                  setVoucher(null);
                }}
                placeholder="Nhập mã voucher (vd: KICKZONE50, KZ10)"
                className={cn(
                  'flex-1 rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] px-3 py-2 text-xs uppercase outline-none focus:border-[#006e2f]',
                  activeVoucher &&
                    'bg-gray-100 text-gray-500 cursor-not-allowed',
                )}
              />
              {activeVoucher ? (
                <Button
                  type="button"
                  onClick={() => {
                    setVoucher(null);
                    setVoucherCode('');
                    toast.info('Đã bỏ áp dụng mã giảm giá.');
                  }}
                  variant="outline"
                  className="rounded-xl border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 hover:text-[#ba1a1a] text-xs font-bold"
                >
                  Bỏ áp dụng
                </Button>
              ) : (
                <Button
                  onClick={() => void applyVoucher()}
                  disabled={isVoucherLoading || !isSelectionValid}
                  className="rounded-xl bg-[#006e2f] text-xs font-bold"
                >
                  {isVoucherLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                </Button>
              )}
            </div>
            {activeVoucher && (
              <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#006e2f]">
                <CheckCircle2 className="h-4 w-4" />
                Giảm {activeVoucher.discountAmount.toLocaleString('vi-VN')}đ
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
              {activeVoucher && (
                <div className="flex justify-between text-[#006e2f]">
                  <span>Voucher</span>
                  <b>
                    -{activeVoucher.discountAmount.toLocaleString('vi-VN')}đ
                  </b>
                </div>
              )}
              <div className="flex justify-between border-t border-[#bccbb9]/40 pt-3 text-sm">
                <b>Tổng giá</b>
                <b className="text-xl text-[#006e2f]">
                  {total.toLocaleString('vi-VN')}đ
                </b>
              </div>
            </div>
            {!isSelectionValid && (
              <p className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                Khung giờ không còn khả dụng hoặc dữ liệu đặt sân không hợp lệ.
              </p>
            )}
            <Button
              onClick={() => void handleCreateBooking()}
              disabled={
                createMutation.isPending ||
                availabilityQuery.isFetching ||
                !isSelectionValid
              }
              className="mt-6 w-full rounded-xl bg-[#006e2f] py-6 text-base font-bold hover:bg-[#005321] cursor-pointer"
            >
              {createMutation.isPending || availabilityQuery.isFetching
                ? 'Đang kiểm tra lịch...'
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
