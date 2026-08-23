'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  ShieldCheck,
  Eye,
  Plus,
} from 'lucide-react';

// Types aligned with database/init.sql
export interface ScheduleCourt {
  id: string;
  name: string;
  type: string; // 'Sân 5' | 'Sân 7' | 'Sân 11'
}

export interface ScheduleBookingItem {
  id: string;
  code: string;
  courtId: string;
  customerName: string;
  customerPhone?: string;
  startHour: number; // e.g. 7 for 07:00, 17.5 for 17:30
  durationHours: number; // e.g. 1.5 for 90 mins, 2 for 120 mins
  timeDisplay: string; // '07:00 - 08:30'
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED';
}

const COURTS: ScheduleCourt[] = [
  { id: 'c-1', name: 'Sân 5 - A1', type: 'Sân 5' },
  { id: 'c-2', name: 'Sân 5 - A2', type: 'Sân 5' },
  { id: 'c-3', name: 'Sân 7 - B1', type: 'Sân 7' },
];

const INITIAL_SCHEDULE_BOOKINGS: ScheduleBookingItem[] = [
  {
    id: 'bk-1023',
    code: '#DH-1023',
    courtId: 'c-1',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901 234 567',
    startHour: 7, // 07:00
    durationHours: 1.5, // 90 min -> 08:30
    timeDisplay: '07:00 - 08:30',
    status: 'COMPLETED',
  },
  {
    id: 'bk-1045',
    code: '#DH-1045',
    courtId: 'c-1',
    customerName: 'FC Sài Gòn',
    customerPhone: '0912 345 678',
    startHour: 17.5, // 17:30
    durationHours: 1.5, // 19:00
    timeDisplay: '17:30 - 19:00',
    status: 'CONFIRMED',
  },
  {
    id: 'bk-1050',
    code: '#DH-1050',
    courtId: 'c-2',
    customerName: 'Trần Bình',
    customerPhone: '0987 654 321',
    startHour: 18, // 18:00
    durationHours: 2, // 20:00
    timeDisplay: '18:00 - 20:00',
    status: 'PENDING',
  },
  {
    id: 'bk-1040',
    code: '#DH-1040',
    courtId: 'c-3',
    customerName: 'Công ty Tech VN - Giao hữu',
    customerPhone: '0934 567 890',
    startHour: 16, // 16:00
    durationHours: 2, // 18:00
    timeDisplay: '16:00 - 18:00',
    status: 'CONFIRMED',
  },
];

// Hours range 06:00 to 22:00 (17 hours)
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => 6 + i); // [6, 7, ..., 22]
const HOUR_ROW_HEIGHT = 64; // px per hour

export default function AdminSchedulePage() {
  const [selectedCourtFilter, setSelectedCourtFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('2023-10-15');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [bookings, setBookings] = useState<ScheduleBookingItem[]>(INITIAL_SCHEDULE_BOOKINGS);

  // Selected booking for quick inspection modal
  const [selectedBooking, setSelectedBooking] = useState<ScheduleBookingItem | null>(null);

  // Format date display
  const dateFormatted = useMemo(() => {
    return '15 Tháng 10, 2023';
  }, [selectedDate]);

  // Filtered courts
  const displayCourts = useMemo(() => {
    if (selectedCourtFilter === 'all') return COURTS;
    return COURTS.filter((c) => c.id === selectedCourtFilter);
  }, [selectedCourtFilter]);

  const handlePrevDay = () => {
    // Simulating date change
  };

  const handleNextDay = () => {
    // Simulating date change
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      {/* Controls & Filters Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#bccbb9] bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        {/* Left: Field & Date Selection */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Sân Selection */}
          <div className="relative">
            <select
              value={selectedCourtFilter}
              onChange={(e) => setSelectedCourtFilter(e.target.value)}
              className="appearance-none rounded-lg border border-[#bccbb9] bg-[#f3f4f5] py-2 pl-4 pr-10 text-xs sm:text-sm font-semibold text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
            >
              <option value="all">Tất cả sân (Cơ sở Quận 7)</option>
              <option value="c-1">Sân 5 người - A1</option>
              <option value="c-2">Sân 5 người - A2</option>
              <option value="c-3">Sân 7 người - B1</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
          </div>

          {/* Date Selection */}
          <div className="flex items-center rounded-lg border border-[#bccbb9] bg-[#f3f4f5] p-1 shadow-sm">
            <button
              type="button"
              onClick={handlePrevDay}
              className="rounded-md p-1 text-[#575e70] transition-colors hover:bg-white hover:text-[#006e2f]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs sm:text-sm font-semibold text-[#191c1d]">
              <CalendarIcon className="h-4 w-4 text-[#006e2f]" />
              <span>{dateFormatted}</span>
            </div>
            <button
              type="button"
              onClick={handleNextDay}
              className="rounded-md p-1 text-[#575e70] transition-colors hover:bg-white hover:text-[#006e2f]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: View Toggle Mode */}
        <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto">
          <div className="flex rounded-lg border border-[#bccbb9] bg-[#f3f4f5] p-1">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`rounded-md px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-[#006e2f] shadow-sm'
                  : 'text-[#575e70] hover:text-[#191c1d]'
              }`}
            >
              Ngày
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`rounded-md px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-[#006e2f] shadow-sm'
                  : 'text-[#575e70] hover:text-[#191c1d]'
              }`}
            >
              Tuần
            </button>
          </div>
        </div>
      </div>

      {/* Legend (Chú thích trạng thái) */}
      <div className="flex flex-wrap items-center gap-6 px-2 text-xs sm:text-sm text-[#575e70]">
        <span className="font-semibold text-[#191c1d]">Trạng thái:</span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-[#bccbb9] bg-[#f3f4f5]" />
          <span>Còn trống</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-[#eab308] bg-[#fef08a]" />
          <span className="text-[#854d0e] font-medium">Chờ xác nhận</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-[#22c55e] bg-[#bbf7d0]" />
          <span className="text-[#166534] font-medium">Đã xác nhận</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-[#3b82f6] bg-[#bfdbfe]" />
          <span className="text-[#1e40af] font-medium">Hoàn thành</span>
        </div>
      </div>

      {/* Calendar Timeline Canvas */}
      <div className="flex h-[620px] flex-col overflow-hidden rounded-2xl border border-[#bccbb9] bg-white shadow-sm">
        {/* Header: Sân */}
        <div className="sticky top-0 z-20 flex border-b border-[#bccbb9] bg-[#f8f9fa]">
          <div className="flex w-20 shrink-0 items-end justify-end border-r border-[#bccbb9] p-2 pb-3">
            <span className="text-xs font-bold text-[#575e70]">Giờ</span>
          </div>
          <div
            className="grid flex-1 divide-x divide-[#bccbb9]"
            style={{
              gridTemplateColumns: `repeat(${displayCourts.length}, minmax(0, 1fr))`,
            }}
          >
            {displayCourts.map((court) => (
              <div key={court.id} className="py-3 px-4 text-center">
                <span className="font-(family-name:--font-manrope) text-sm sm:text-base font-bold text-[#191c1d]">
                  {court.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Body (Scrollable) */}
        <div className="relative flex flex-1 overflow-y-auto">
          {/* Time Column (Left) */}
          <div className="flex w-20 shrink-0 flex-col border-r border-[#bccbb9] bg-[#f8f9fa]">
            {TIME_SLOTS.map((hour) => (
              <div
                key={hour}
                style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                className="relative"
              >
                <span className="absolute -top-2.5 right-2 text-xs font-semibold text-[#575e70]">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Grid Horizontal Lines Background */}
          <div className="pointer-events-none absolute inset-0 left-20 flex flex-col opacity-60">
            {TIME_SLOTS.map((hour) => (
              <div
                key={hour}
                style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                className="w-full border-t border-[#bccbb9]/60"
              />
            ))}
          </div>

          {/* Courts Grid Columns */}
          <div
            className="relative grid flex-1 divide-x divide-[#bccbb9]"
            style={{
              gridTemplateColumns: `repeat(${displayCourts.length}, minmax(0, 1fr))`,
            }}
          >
            {displayCourts.map((court) => {
              const courtBookings = bookings.filter((b) => b.courtId === court.id);

              return (
                <div
                  key={court.id}
                  style={{ height: `${TIME_SLOTS.length * HOUR_ROW_HEIGHT}px` }}
                  className="relative w-full"
                >
                  {courtBookings.map((b) => {
                    const topOffset = (b.startHour - 6) * HOUR_ROW_HEIGHT;
                    const blockHeight = b.durationHours * HOUR_ROW_HEIGHT;

                    // Colors by status
                    let bgClass = 'bg-[#bfdbfe] border-[#3b82f6] text-[#1e3a8a]';
                    let titleColor = 'text-[#1e40af]';
                    let icon = <CheckCircle2 className="h-4 w-4 text-[#1e3a8a]" />;

                    if (b.status === 'CONFIRMED') {
                      bgClass = 'bg-[#bbf7d0] border-[#22c55e] text-[#14532d]';
                      titleColor = 'text-[#166534]';
                      icon = <ShieldCheck className="h-4 w-4 text-[#166534]" />;
                    } else if (b.status === 'PENDING') {
                      bgClass = 'bg-[#fef08a] border-[#eab308] text-[#713f12]';
                      titleColor = 'text-[#854d0e]';
                      icon = <Clock className="h-4 w-4 text-[#854d0e]" />;
                    }

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        style={{
                          top: `${topOffset}px`,
                          height: `${blockHeight}px`,
                        }}
                        className={`absolute left-1.5 right-1.5 rounded-lg border p-2.5 shadow-sm transition-all hover:shadow-md cursor-pointer flex flex-col justify-between ${bgClass} z-10`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-[11px] font-bold tracking-tight">
                              {b.code}
                            </span>
                            {icon}
                          </div>
                          <h4
                            className={`mt-1 line-clamp-1 text-xs font-bold leading-tight ${titleColor}`}
                          >
                            {b.customerName}
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold">
                          {b.timeDisplay}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Booking Modal on Click */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#bccbb9]/60 pb-3">
              <div>
                <span className="text-xs font-semibold text-[#575e70]">
                  Thông tin lịch đặt sân
                </span>
                <h4 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                  Đơn {selectedBooking.code}
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

            <div className="my-4 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-[#bccbb9]/40 pb-2">
                <span className="text-[#575e70]">Khách hàng:</span>
                <span className="font-bold text-[#191c1d]">
                  {selectedBooking.customerName}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#bccbb9]/40 pb-2">
                <span className="text-[#575e70]">Số điện thoại:</span>
                <span className="font-medium text-[#191c1d]">
                  {selectedBooking.customerPhone || '0901 234 567'}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#bccbb9]/40 pb-2">
                <span className="text-[#575e70]">Khung giờ:</span>
                <span className="font-bold text-[#006e2f]">
                  {selectedBooking.timeDisplay}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#575e70]">Trạng thái:</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                    selectedBooking.status === 'CONFIRMED'
                      ? 'bg-[#22c55e]/20 text-[#004b1e]'
                      : selectedBooking.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedBooking.status === 'CONFIRMED'
                    ? 'Đã xác nhận'
                    : selectedBooking.status === 'PENDING'
                      ? 'Chờ xác nhận'
                      : 'Hoàn thành'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-xl border border-[#bccbb9] px-4 py-2 text-xs font-semibold text-[#575e70] hover:bg-[#e7e8e9]"
              >
                Đóng
              </button>
              <Link
                href={`/admin/bookings/${selectedBooking.code.replace('#', '').toLowerCase()}`}
                className="flex items-center gap-1.5 rounded-xl bg-[#006e2f] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#004b1e]"
              >
                <Eye className="h-4 w-4" />
                <span>Xem chi tiết đơn</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
