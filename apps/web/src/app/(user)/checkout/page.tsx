/* eslint-disable @next/next/no-img-element */
'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Phone,
  User,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createNewBooking } from '@/data/mock-bookings';

interface CheckoutDraft {
  fieldId: string;
  fieldName: string;
  fieldAddress: string;
  fieldType: string;
  courtName: string;
  date: string;
  dateDisplay: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  pricePerHour: number;
  fieldImage: string;
  initialVoucher: string;
}

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function getMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function parseCheckoutDraft(searchParams: URLSearchParams): CheckoutDraft | null {
  const fieldId = searchParams.get('fieldId')?.trim() ?? '';
  const fieldName = searchParams.get('fieldName')?.trim() ?? '';
  const fieldAddress = searchParams.get('fieldAddress')?.trim() ?? '';
  const fieldType = searchParams.get('fieldType')?.trim() ?? '';
  const courtName = searchParams.get('courtName')?.trim() ?? '';
  const date = searchParams.get('date')?.trim() ?? '';
  const dateDisplay = searchParams.get('dateDisplay')?.trim() ?? '';
  const startTime = searchParams.get('startTime')?.trim() ?? '';
  const endTime = searchParams.get('endTime')?.trim() ?? '';
  const durationHours = Number(searchParams.get('durationHours'));
  const pricePerHour = Number(searchParams.get('pricePerHour'));
  const fieldImage = searchParams.get('fieldImage')?.trim() ?? '';
  const initialVoucher = searchParams.get('voucher')?.trim().toUpperCase() ?? '';
  const durationMinutes = durationHours * 60;

  if (
    !fieldId ||
    !fieldName ||
    !fieldAddress ||
    !fieldType ||
    !courtName ||
    !date ||
    !dateDisplay ||
    !TIME_PATTERN.test(startTime) ||
    !TIME_PATTERN.test(endTime) ||
    !Number.isFinite(durationHours) ||
    durationHours <= 0 ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes % 30 !== 0 ||
    !Number.isFinite(pricePerHour) ||
    !Number.isInteger(pricePerHour) ||
    pricePerHour <= 0 ||
    getMinutes(endTime) <= getMinutes(startTime) ||
    getMinutes(endTime) - getMinutes(startTime) !== durationMinutes
  ) {
    return null;
  }

  return {
    fieldId,
    fieldName,
    fieldAddress,
    fieldType,
    courtName,
    date,
    dateDisplay,
    startTime,
    endTime,
    durationHours,
    pricePerHour,
    fieldImage,
    initialVoucher,
  };
}

function getVoucherDiscount(code: string, originalPrice: number): number | null {
  if (code === 'KICKZONE50' || code === 'KZ50') return 50000;
  if (code === 'KZ10' || code === 'KZPRO10') return Math.round(originalPrice * 0.1);
  return null;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draft = useMemo(
    () => parseCheckoutDraft(searchParams),
    [searchParams],
  );

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [voucherCode, setVoucherCode] = useState(draft?.initialVoucher ?? '');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!draft) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-[#bccbb9]/40 bg-white p-8 text-center space-y-4">
          <h1 className="text-lg font-bold text-[#191c1d]">Thông tin đặt sân không hợp lệ</h1>
          <p className="text-xs text-[#575e70]">Hãy chọn lại sân và khung giờ trước khi tiếp tục.</p>
          <Button onClick={() => router.back()} className="bg-[#006e2f] hover:bg-[#005321] text-white">Quay lại chọn sân</Button>
        </div>
      </div>
    );
  }

  const {
    fieldId,
    fieldName,
    fieldAddress,
    fieldType,
    courtName,
    date,
    dateDisplay,
    startTime,
    endTime,
    durationHours,
    pricePerHour,
    fieldImage,
  } = draft;
  const originalPrice = Math.round(durationHours * pricePerHour);
  const discountAmount = Math.min(appliedVoucher?.discount ?? 0, originalPrice);
  const finalPrice = originalPrice - discountAmount;

  const handleApplyVoucher = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = voucherCode.trim().toUpperCase();
    if (!clean) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    const discount = getVoucherDiscount(clean, originalPrice);
    if (discount === null) {
      setAppliedVoucher(null);
      toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      return;
    }

    const cappedDiscount = Math.min(discount, originalPrice);
    setAppliedVoucher({ code: clean, discount: cappedDiscount });
    toast.success(
      `Đã áp dụng mã ${clean} (-${cappedDiscount.toLocaleString('vi-VN')}đ)!`,
    );
  };

  const handleSubmitBooking = () => {
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên người đặt.');
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newBooking = createNewBooking({
        userId: 'mock-user',
        fieldId,
        fieldName,
        fieldAddress,
        fieldType,
        fieldImage,
        courtName,
        date,
        dateDisplay,
        startTime,
        endTime,
        durationMinutes: Math.round(durationHours * 60),
        pricePerHour,
        originalPrice,
        discountAmount,
        finalPrice,
        voucherCode: appliedVoucher?.code,
        hostPhone: '0908 123 456',
      });

      if (!newBooking) {
        toast.error('Không thể lưu yêu cầu đặt sân. Vui lòng thử lại.');
        return;
      }

      toast.success(
        `Đã tạo yêu cầu đặt sân #${newBooking.code}. Chờ chủ sân xác nhận.`,
      );
      router.push(`/bookings/${newBooking.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen pb-16 font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-[#bccbb9]/40 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-[#575e70] mb-2">
            <Link href="/" className="hover:text-[#006e2f] transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/fields/${fieldId}`}
              className="hover:text-[#006e2f] transition-colors"
            >
              {fieldName}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#191c1d] font-semibold">
              Xác nhận đặt sân
            </span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1d] font-['Manrope']">
            Xác nhận thông tin đặt sân
          </h1>
          <p className="text-xs text-[#575e70] mt-1">
            Vui lòng kiểm tra lại thông tin trận đấu trước khi hoàn tất yêu cầu
            đặt sân.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Field info & booking form */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* 1. Card thông tin sân bóng */}
            <div className="bg-white rounded-2xl border border-[#bccbb9]/40 shadow-sm p-5 flex flex-col sm:flex-row gap-5 items-center">
              <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={fieldImage}
                  alt={fieldName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 w-full">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#22c55e]/15 text-[#006e2f] border border-[#22c55e]/30 mb-2">
                  {fieldType} • {courtName}
                </span>
                <h2 className="text-lg font-bold text-[#191c1d] font-['Manrope'] mb-1">
                  {fieldName}
                </h2>
                <div className="flex items-start gap-1.5 text-xs text-[#575e70]">
                  <MapPin className="w-4 h-4 text-[#006e2f] shrink-0 mt-0.5" />
                  <span>{fieldAddress}</span>
                </div>
              </div>
            </div>

            {/* 2. Card thời gian thi đấu */}
            <div className="bg-white rounded-2xl border border-[#bccbb9]/40 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-[#191c1d] font-['Manrope'] pb-3 border-b border-[#bccbb9]/30 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#006e2f]" />
                Thời gian thi đấu đã chọn
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#bccbb9]/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#006e2f]/10 text-[#006e2f] flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#575e70] block">
                      Ngày thi đấu
                    </span>
                    <span className="font-bold text-xs text-[#191c1d]">
                      {dateDisplay}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#bccbb9]/30 flex items-center gap-3 sm:col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-[#006e2f]/10 text-[#006e2f] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] text-[#575e70] block">
                        Giờ bắt đầu
                      </span>
                      <span className="font-bold text-sm text-[#191c1d]">
                        {startTime}
                      </span>
                    </div>
                    <div className="flex-1 mx-4 relative flex items-center justify-center">
                      <div className="w-full h-0.5 bg-[#bccbb9]/60" />
                      <span className="absolute bg-[#f8f9fa] px-2 text-[11px] font-bold text-[#006e2f]">
                        {durationHours} giờ
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#575e70] block">
                        Giờ kết thúc
                      </span>
                      <span className="font-bold text-sm text-[#191c1d]">
                        {endTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Card thông tin người đặt */}
            <div className="bg-white rounded-2xl border border-[#bccbb9]/40 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-[#191c1d] font-['Manrope'] pb-3 border-b border-[#bccbb9]/30 flex items-center gap-2">
                <User className="w-4 h-4 text-[#006e2f]" />
                Thông tin người đặt sân
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="booking-full-name"
                    className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5"
                  >
                    Họ và tên người đại diện *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#575e70]" />
                    <input
                      id="booking-full-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#191c1d] font-medium outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="booking-phone"
                    className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5"
                  >
                    Số điện thoại nhận tin nhắn xác nhận *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#575e70]" />
                    <input
                      id="booking-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="09xx xxx xxx..."
                      className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#191c1d] font-medium outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Card mã giảm giá */}
            <div className="bg-white rounded-2xl border border-[#bccbb9]/40 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-[#191c1d] font-['Manrope'] pb-3 border-b border-[#bccbb9]/30 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#006e2f]" />
                Mã ưu đãi / Voucher
              </h3>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <label htmlFor="checkout-voucher-code" className="sr-only">
                    Mã ưu đãi
                  </label>
                  <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#575e70]" />
                  <input
                    id="checkout-voucher-code"
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Nhập mã ưu đãi (Ví dụ: KICKZONE50, KZPRO10)..."
                    className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl pl-10 pr-3.5 py-2.5 text-xs uppercase font-bold text-[#191c1d] outline-none focus:border-[#006e2f]"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleApplyVoucher}
                  className="bg-[#006e2f] hover:bg-[#005321] text-white text-xs font-bold px-5 rounded-xl"
                >
                  Áp dụng
                </Button>
              </div>

              {appliedVoucher && (
                <div className="p-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#006e2f] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã áp dụng mã {appliedVoucher.code}
                  </span>
                  <span className="font-bold text-[#006e2f]">
                    -{appliedVoucher.discount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Sticky Summary & Submit */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-6 bg-white rounded-2xl p-6 border border-[#bccbb9]/50 shadow-xl space-y-5">
              <h3 className="text-lg font-bold text-[#191c1d] font-['Manrope'] pb-3 border-b border-[#bccbb9]/30">
                Tóm tắt đơn đặt sân
              </h3>

              <div className="space-y-2.5 text-xs text-[#575e70]">
                <div className="flex justify-between">
                  <span>Giá thuê sân:</span>
                  <span className="font-medium">
                    {pricePerHour.toLocaleString('vi-VN')}đ / giờ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Thời lượng thi đấu:</span>
                  <span className="font-bold text-[#191c1d]">
                    {durationHours} giờ ({durationHours * 60} phút)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tạm tính tiền sân:</span>
                  <span className="font-bold text-[#191c1d]">
                    {originalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-[#006e2f] font-semibold">
                    <span>Giảm giá voucher:</span>
                    <span>
                      -{appliedVoucher.discount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí dịch vụ & đèn chiếu sáng:</span>
                  <span className="text-[#006e2f] font-semibold">
                    Miễn phí (0đ)
                  </span>
                </div>

                <div className="pt-3 border-t border-[#bccbb9]/40 flex justify-between items-end">
                  <div>
                    <span className="text-xs font-bold text-[#191c1d] uppercase">
                      Tổng thanh toán:
                    </span>
                    <span className="text-[10px] text-[#575e70] block">
                      (Đã bao gồm VAT)
                    </span>
                  </div>
                  <span className="text-2xl font-extrabold text-[#006e2f] font-['Manrope']">
                    {finalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleSubmitBooking}
                  disabled={isSubmitting}
                  className="w-full py-6 rounded-xl text-base font-bold bg-[#006e2f] hover:bg-[#005321] text-white shadow-lg shadow-[#006e2f]/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Đang gửi yêu cầu...'
                    : 'Xác nhận & Gửi yêu cầu'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full py-5 rounded-xl text-xs font-semibold border-[#bccbb9]/60 text-[#575e70] hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại chỉnh sửa
                </Button>
              </div>

              <div className="p-3.5 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/30 space-y-1.5 text-[11px] text-[#575e70]">
                <div className="flex items-center gap-1.5 text-[#006e2f] font-bold">
                  <Shield className="w-4 h-4" /> Cam kết KickZone
                </div>
                <p>
                  Đơn đặt sẽ được tạo dưới trạng thái <b>PENDING</b>. Quản trị
                  viên sẽ duyệt lịch và bạn có thể hủy đơn bất kỳ lúc nào khi
                  chưa được xác nhận.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[#006e2f]">
          Đang tải thông tin đặt sân...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
