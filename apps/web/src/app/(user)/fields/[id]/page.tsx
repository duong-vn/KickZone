'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, MapPin, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { fetchAvailability, fetchFieldById } from '@/lib/api';
import { nextBusinessDates } from '@/lib/booking-time';

export default function FieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: fieldId } = use(params);
  const router = useRouter();
  const dates = useMemo(() => nextBusinessDates(), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.iso ?? '');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const fieldQuery = useQuery({
    queryKey: ['field', fieldId],
    queryFn: () => fetchFieldById(fieldId),
    retry: false,
  });
  const availabilityQuery = useQuery({
    queryKey: ['availability', fieldId, selectedDate],
    queryFn: () => fetchAvailability(fieldId, selectedDate),
    enabled: Boolean(selectedDate),
    retry: false,
  });
  const field = fieldQuery.data?.data;
  const slots = availabilityQuery.data?.data.slots ?? [];
  const selected = slots.filter((slot) =>
    selectedSlots.includes(slot.startTime),
  );
  const originalPrice = selected.reduce((total, slot) => total + slot.price, 0);

  const toggleSlot = (startTime: string) => {
    const index = slots.findIndex((slot) => slot.startTime === startTime);
    const selectedIndexes = selectedSlots
      .map((value) => slots.findIndex((slot) => slot.startTime === value))
      .filter((value) => value >= 0);
    const min = Math.min(...selectedIndexes);
    const max = Math.max(...selectedIndexes);
    if (selectedSlots.includes(startTime)) {
      if (selectedSlots.length > 1 && index !== min && index !== max)
        return toast.error('Chỉ có thể bỏ chọn khung giờ ở đầu hoặc cuối dải.');
      setSelectedSlots((current) =>
        current.filter((value) => value !== startTime),
      );
      return;
    }
    if (selectedSlots.length > 0 && index !== min - 1 && index !== max + 1)
      return toast.error('Vui lòng chọn các khung giờ liền nhau.');
    setSelectedSlots((current) => [...current, startTime]);
  };

  const proceed = () => {
    if (!selected.length)
      return toast.error('Vui lòng chọn ít nhất một khung giờ.');
    const ordered = [...selected].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
    router.push(
      `/checkout?${new URLSearchParams({ fieldId, startTime: ordered[0].startTime, endTime: ordered[ordered.length - 1].endTime }).toString()}`,
    );
  };

  if (fieldQuery.isLoading)
    return <State message="Đang tải thông tin sân..." />;
  if (fieldQuery.isError || !field)
    return <State message="Không tìm thấy sân hoặc máy chủ đang lỗi." error />;
  const image = field.images.find((item) => item.isPrimary)?.storagePath;
  const imageIsUrl =
    image?.startsWith('http://') || image?.startsWith('https://');

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16 text-[#191c1d]">
      <header className="border-b border-[#bccbb9]/40 bg-white py-6 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-2 text-xs text-[#575e70]">
            <Link href="/fields">Tìm sân</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-[#191c1d]">{field.name}</span>
          </nav>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{field.name}</h1>
          <div className="mt-2 flex items-center gap-1 text-sm text-[#575e70]">
            <MapPin className="h-4 w-4 text-[#006e2f]" />
            {field.address}
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-12 lg:px-8">
        <section className="space-y-6 lg:col-span-8">
          <div className="h-72 overflow-hidden rounded-2xl border border-[#bccbb9]/40 bg-slate-200">
            {imageIsUrl ? (
              <img
                src={image}
                alt={field.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#575e70]">
                Chưa có ảnh sân
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-[#bccbb9]/40 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-bold">Giới thiệu sân</h2>
            <p className="text-sm leading-6 text-[#575e70]">
              {field.description || 'Thông tin sân đang được cập nhật.'}
            </p>
          </div>
        </section>
        <aside className="lg:col-span-4">
          <div className="sticky top-6 space-y-5 rounded-2xl border border-[#bccbb9]/50 bg-white p-6 shadow-xl">
            <div className="flex items-end justify-between border-b border-[#bccbb9]/40 pb-4">
              <div>
                <span className="text-xs text-[#575e70]">Giá từ</span>
                <div className="text-2xl font-extrabold text-[#006e2f]">
                  {field.basePricePerHour.toLocaleString('vi-VN')}đ
                  <span className="text-xs font-normal text-[#575e70]">
                    /giờ
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#006e2f]/10 px-2.5 py-1 text-xs font-bold text-[#006e2f]">
                {field.type?.name ?? 'Sân bóng'}
              </span>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider">
                1. Chọn ngày đá
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {dates.map((date) => (
                  <button
                    key={date.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date.iso);
                      setSelectedSlots([]);
                    }}
                    className={`rounded-xl border px-1 py-2 text-center text-xs ${selectedDate === date.iso ? 'border-[#006e2f] bg-[#006e2f] font-bold text-white' : 'border-[#bccbb9]/40 bg-[#f8f9fa] text-[#575e70]'}`}
                  >
                    <span className="block text-[10px]">{date.dayName}</span>
                    {date.dayFormatted}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider">
                2. Chọn khung giờ 30 phút
              </label>
              {availabilityQuery.isLoading ? (
                <p className="text-xs text-[#575e70]">Đang tải lịch sân...</p>
              ) : availabilityQuery.isError ? (
                <p className="text-xs text-red-700">
                  Không thể tải availability.
                </p>
              ) : slots.length === 0 ? (
                <p className="rounded-xl bg-[#f8f9fa] p-4 text-xs text-[#575e70]">
                  Sân đóng cửa trong ngày này.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {slots.map((slot) => {
                    const time = new Intl.DateTimeFormat('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }).format(new Date(slot.startTime));
                    const disabled = !slot.available;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleSlot(slot.startTime)}
                        className={`rounded-lg px-1 py-1.5 text-xs font-semibold ${disabled ? 'cursor-not-allowed bg-[#edeeef] text-[#575e70]/50 line-through' : selectedSlots.includes(slot.startTime) ? 'bg-[#006e2f] text-white' : 'border border-[#bccbb9]/50 bg-white hover:border-[#006e2f]'}`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-[#bccbb9]/40 bg-[#f8f9fa] p-4 text-xs">
              <div className="flex justify-between text-[#575e70]">
                <span>Tạm tính</span>
                <b className="text-[#191c1d]">
                  {originalPrice.toLocaleString('vi-VN')}đ
                </b>
              </div>
              <div className="mt-2 flex justify-between border-t border-[#bccbb9]/40 pt-2">
                <span className="font-bold">Tổng giá</span>
                <b className="text-xl text-[#006e2f]">
                  {originalPrice.toLocaleString('vi-VN')}đ
                </b>
              </div>
            </div>
            <Button
              onClick={proceed}
              disabled={!selected.length}
              className="w-full rounded-xl bg-[#006e2f] py-6 text-base font-bold hover:bg-[#005321]"
            >
              Đặt sân ngay
            </Button>
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#575e70]">
              <Shield className="h-3.5 w-3.5 text-[#006e2f]" /> Giá và
              availability được xác nhận lại trên server
            </div>
          </div>
        </aside>
      </main>
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
