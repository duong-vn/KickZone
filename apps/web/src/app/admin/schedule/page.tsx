'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminFilterControlClass } from '@/components/admin/admin-filter-bar';
import { fetchAdminFields, fetchAdminBookingCalendar } from '@/lib/api';
import {
  formatBusinessTime,
  getBusinessParts,
  durationMinutes,
} from '@/lib/booking-time';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Calendar as CalendarIcon,
  X,
  User,
  Phone,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';

export type BookingStatus =
  'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface ScheduleCourt {
  id: string;
  name: string;
  type: string;
}

export interface CalendarDayItem {
  date: Date;
  dateString: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth?: boolean;
}

export interface ScheduleBookingItem {
  id: string;
  code: string;
  courtId: string;
  courtName: string;
  courtType?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAvatar?: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // ISO
  endTime: string; // ISO
  startHour: number; // 0..24
  durationHours: number;
  timeDisplay: string; // '18:00 - 19:30'
  status: BookingStatus;
  finalPrice?: number;
}

// 24 hours: 00:00 to 23:00 (1 hour per row)
const TIME_SLOTS_24H = Array.from({ length: 24 }, (_, i) => i);
const HOUR_ROW_HEIGHT = 60; // 60px per hour row

export default function AdminSchedulePage() {
  const [selectedCourtFilter, setSelectedCourtFilter] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month' | 'year'>(
    'week',
  );
  const [selectedBooking, setSelectedBooking] =
    useState<ScheduleBookingItem | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to 07:00 AM on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 7 * HOUR_ROW_HEIGHT - 10;
    }
  }, [viewMode]);

  // Current time marker position (in hours)
  const [currentTimeHours, setCurrentTimeHours] = useState<number>(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeHours(now.getHours() + now.getMinutes() / 60);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch fields for dropdown
  const { data: apiFields } = useQuery({
    queryKey: ['admin-fields-for-schedule'],
    queryFn: () => fetchAdminFields({ limit: 100 }),
    retry: false,
  });

  const courts: ScheduleCourt[] = useMemo(() => {
    if (apiFields?.data && apiFields.data.length > 0) {
      return apiFields.data.map(
        (f: { id: string; name: string; fieldTypeLabel?: string }) => ({
          id: f.id,
          name: f.name,
          type: f.fieldTypeLabel || 'Sân bóng',
        }),
      );
    }
    return [];
  }, [apiFields]);

  // Date input string for HTML5 datepicker
  const dateInputString = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  // Calculate Date Range based on viewMode
  const { fromISO, toISO, weekDays, titleDisplay } = useMemo<{
    fromISO: string;
    toISO: string;
    weekDays: CalendarDayItem[];
    titleDisplay: string;
  }>(() => {
    const d = new Date(currentDate);

    if (viewMode === 'day') {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const title = `${day} Tháng ${month}, ${year}`;

      return {
        fromISO: `${dateStr}T00:00:00+07:00`,
        toISO: `${dateStr}T23:59:59+07:00`,
        weekDays: [
          {
            date: new Date(d),
            dateString: dateStr,
            dayName: getWeekdayName(d.getDay()),
            dayNumber: d.getDate(),
            isToday: isSameDay(d, new Date()),
            isCurrentMonth: true,
          },
        ],
        titleDisplay: title,
      };
    }

    if (viewMode === 'week') {
      const dayOfWeek = d.getDay(); // 0 = Sun
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const days: CalendarDayItem[] = [];
      const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

      for (let i = 0; i < 7; i++) {
        const cur = new Date(startOfWeek);
        cur.setDate(startOfWeek.getDate() + i);
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const dayNum = String(cur.getDate()).padStart(2, '0');
        const curDateStr = `${y}-${m}-${dayNum}`;

        days.push({
          date: cur,
          dateString: curDateStr,
          dayName: dayLabels[i],
          dayNumber: cur.getDate(),
          isToday: isSameDay(cur, new Date()),
          isCurrentMonth: true,
        });
      }

      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const monthDisplay = `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
      const fromStr = days[0].dateString;
      const toStr = days[6].dateString;

      return {
        fromISO: `${fromStr}T00:00:00+07:00`,
        toISO: `${toStr}T23:59:59+07:00`,
        weekDays: days,
        titleDisplay: monthDisplay,
      };
    }

    if (viewMode === 'month') {
      const year = d.getFullYear();
      const month = d.getMonth();
      const firstDay = new Date(year, month, 1);
      const startDayOfWeek = firstDay.getDay();

      const calendarStart = new Date(firstDay);
      calendarStart.setDate(firstDay.getDate() - startDayOfWeek);

      const days: CalendarDayItem[] = [];
      const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

      for (let i = 0; i < 42; i++) {
        const cur = new Date(calendarStart);
        cur.setDate(calendarStart.getDate() + i);
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const dayNum = String(cur.getDate()).padStart(2, '0');

        days.push({
          date: cur,
          dateString: `${y}-${m}-${dayNum}`,
          dayName: dayLabels[cur.getDay()],
          dayNumber: cur.getDate(),
          isCurrentMonth: cur.getMonth() === month,
          isToday: isSameDay(cur, new Date()),
        });
      }

      const fromStr = days[0].dateString;
      const toStr = days[days.length - 1].dateString;

      return {
        fromISO: `${fromStr}T00:00:00+07:00`,
        toISO: `${toStr}T23:59:59+07:00`,
        weekDays: days,
        titleDisplay: `Tháng ${month + 1}, ${year}`,
      };
    }

    // Year mode
    const year = d.getFullYear();
    return {
      fromISO: `${year}-01-01T00:00:00+07:00`,
      toISO: `${year}-12-31T23:59:59+07:00`,
      weekDays: [],
      titleDisplay: `Năm ${year}`,
    };
  }, [currentDate, viewMode]);

  // Fetch Bookings Calendar data from API
  const { data: calendarData } = useQuery({
    queryKey: ['admin-schedule-calendar', fromISO, toISO, selectedCourtFilter],
    queryFn: () =>
      fetchAdminBookingCalendar({
        from: fromISO,
        to: toISO,
        fieldId:
          selectedCourtFilter !== 'all' ? selectedCourtFilter : undefined,
      }),
    retry: false,
  });

  // Transform Bookings data
  const bookings: ScheduleBookingItem[] = useMemo(() => {
    if (!calendarData || !Array.isArray(calendarData)) return [];

    return calendarData.map(
      (b: {
        id: string;
        code: string;
        fieldId: string;
        fieldName?: string;
        fieldTypeLabel?: string;
        customerName: string;
        customerPhone?: string;
        customerEmail?: string;
        customerAvatar?: string;
        startTime: string;
        endTime: string;
        status: BookingStatus;
        finalPrice?: number;
      }) => {
        const startParts = getBusinessParts(b.startTime);
        const startHour = startParts.hour + startParts.minute / 60;
        const duration = Math.max(
          durationMinutes(b.startTime, b.endTime) / 60,
          0.5,
        );

        return {
          id: b.id,
          code: b.code,
          courtId: b.fieldId,
          courtName: b.fieldName || 'Sân bóng',
          courtType: b.fieldTypeLabel,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          customerAvatar: b.customerAvatar,
          bookingDate: startParts.dateKey,
          startTime: b.startTime,
          endTime: b.endTime,
          startHour,
          durationHours: duration,
          timeDisplay: `${formatBusinessTime(b.startTime)} - ${formatBusinessTime(b.endTime)}`,
          status: b.status,
          finalPrice: b.finalPrice,
        };
      },
    );
  }, [calendarData]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'year') {
      d.setFullYear(d.getFullYear() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'year') {
      d.setFullYear(d.getFullYear() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatVND = (value?: number) => {
    if (value === undefined || value === null) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  };

  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatHourLabel = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] flex flex-col h-[calc(100vh-105px)] font-sans">
      {/* 1. GOOGLE CALENDAR HEADER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#dadce0] bg-white px-2">
        {/* Left: Today, < >, Month/Year */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-full border border-[#dadce0] px-5 py-2 text-sm font-medium text-[#3c4043] transition-colors hover:bg-[#f1f3f4] active:bg-[#e8eaed] shadow-2xs"
          >
            Hôm nay
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4] active:bg-[#e8eaed]"
              title="Trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4] active:bg-[#e8eaed]"
              title="Sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Interactive Date Title with Native Datepicker */}
          <label className="relative flex items-center gap-2 px-2 py-1 font-(family-name:--font-manrope) text-xl sm:text-2xl font-bold text-[#191c1d] cursor-pointer hover:bg-[#f1f3f4] rounded-xl transition-colors select-none">
            <span>{titleDisplay}</span>
            <input
              type="date"
              value={dateInputString}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  setCurrentDate(new Date(y, m - 1, d));
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Nhấn để chọn ngày"
            />
          </label>
        </div>

        {/* Right: Sân bóng Dropdown & View Mode Dropdown */}
        <div className="flex items-center gap-3">
          {/* Sân bóng Dropdown */}
          <div className="relative min-w-[220px]">
            <select
              value={selectedCourtFilter}
              onChange={(e) => setSelectedCourtFilter(e.target.value)}
              className={`${adminFilterControlClass} appearance-none pr-8 font-medium`}
            >
              <option value="all">Tất cả sân bóng</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name} ({court.type})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6368]" />
          </div>

          {/* View Mode Dropdown (Week ▾ / Day / Month / Year) */}
          <div className="relative min-w-[110px]">
            <select
              value={viewMode}
              onChange={(e) =>
                setViewMode(e.target.value as 'week' | 'day' | 'month' | 'year')
              }
              className={`${adminFilterControlClass} appearance-none pr-8 font-medium`}
            >
              <option value="week">Tuần</option>
              <option value="day">Ngày</option>
              <option value="month">Tháng</option>
              <option value="year">Năm</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#006e2f]" />
          </div>
        </div>
      </div>

      {/* 2. GOOGLE CALENDAR GRID BODY */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-[#dadce0] bg-white flex flex-col mt-2 shadow-xs">
        {/* VIEW 1: WEEK VIEW (Exact 7-day Google Calendar layout) */}
        {viewMode === 'week' && (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto relative flex flex-col"
          >
            {/* Top Day Header Row: SUN 23, MON 24, TUE 25... */}
            <div className="sticky top-0 z-20 grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-[#dadce0] bg-white shrink-0 shadow-2xs">
              {/* GMT Column */}
              <div className="border-r border-[#dadce0] p-2 text-center text-[10px] font-semibold text-[#70757a] flex items-end justify-center pb-2 bg-white">
                GMT+07
              </div>

              {/* 7 Days Columns */}
              {weekDays.map((day) => (
                <div
                  key={day.dateString}
                  className="py-2.5 text-center border-r border-[#dadce0] last:border-r-0 bg-white"
                >
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      day.isToday ? 'text-[#006e2f]' : 'text-[#70757a]'
                    }`}
                  >
                    {day.dayName}
                  </p>
                  <div className="mt-1 flex justify-center">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl font-normal transition-all ${
                        day.isToday
                          ? 'bg-[#006e2f] text-white font-semibold shadow-xs'
                          : 'text-[#3c4043]'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 24-Hour Grid */}
            <div className="relative">
              {TIME_SLOTS_24H.map((hour) => {
                const hourLabel = formatHourLabel(hour);

                return (
                  <div
                    key={`slot-week-${hour}`}
                    style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                    className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] relative group"
                  >
                    {/* Left Hour Label - No horizontal borders */}
                    <div className="border-r border-[#dadce0] pr-2 -mt-2 text-right text-[10px] font-medium text-[#70757a] select-none bg-transparent">
                      {hour > 0 ? hourLabel : ''}
                    </div>

                    {/* 7 Day Column Background Cells - Horizontal lines only here */}
                    {weekDays.map((day) => (
                      <div
                        key={`cell-${day.dateString}-${hour}`}
                        className="h-full border-r border-b border-[#dadce0] last:border-r-0 relative hover:bg-[#f1f3f4]/25"
                      />
                    ))}
                  </div>
                );
              })}

              {/* Red Current Time Line Indicator */}
              <div
                style={{ top: `${currentTimeHours * HOUR_ROW_HEIGHT}px` }}
                className="absolute inset-x-0 z-15 pointer-events-none grid grid-cols-[64px_repeat(7,minmax(0,1fr))]"
              >
                <div className="flex justify-end pr-1 items-center">
                  <span className="h-3 w-3 rounded-full bg-[#ea4335] shadow-xs" />
                </div>
                <div className="col-span-7 h-[2px] bg-[#ea4335] relative" />
              </div>

              {/* Event Blocks Layer */}
              <div className="absolute inset-0 grid grid-cols-[64px_repeat(7,minmax(0,1fr))] pointer-events-none">
                <div /> {/* Skip time column */}
                {weekDays.map((day) => {
                  const dayBookings = bookings.filter(
                    (b) => b.bookingDate === day.dateString,
                  );

                  return (
                    <div
                      key={`col-${day.dateString}`}
                      className="relative h-[1440px] px-1 pointer-events-auto border-r border-transparent last:border-r-0"
                    >
                      {dayBookings.map((b) => {
                        const topPx = b.startHour * HOUR_ROW_HEIGHT;
                        const heightPx = Math.max(
                          b.durationHours * HOUR_ROW_HEIGHT,
                          26,
                        );

                        return (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBooking(b)}
                            style={{
                              top: `${topPx + 1}px`,
                              height: `${heightPx - 3}px`,
                            }}
                            className={`absolute inset-x-1 z-10 cursor-pointer overflow-hidden rounded-lg border px-2.5 py-1 text-xs shadow-2xs transition-all hover:z-20 hover:scale-[1.01] hover:shadow-md ${getGoogleStatusStyle(
                              b.status,
                            )}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold truncate text-[11px]">
                                {b.customerName}
                              </span>
                              <span className="text-[10px] opacity-80 shrink-0 font-medium">
                                {b.timeDisplay}
                              </span>
                            </div>

                            {heightPx > 36 && (
                              <p className="truncate text-[10px] opacity-85 mt-0.5">
                                {b.courtName} • {b.code}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DAY VIEW */}
        {viewMode === 'day' && (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto relative flex flex-col"
          >
            {/* Day Header */}
            <div className="sticky top-0 z-20 grid grid-cols-[64px_1fr] border-b border-[#dadce0] bg-white shrink-0 shadow-2xs">
              <div className="border-r border-[#dadce0] p-2 text-center text-[10px] font-semibold text-[#70757a] flex items-end justify-center pb-2 bg-white">
                GMT+07
              </div>
              <div className="py-2.5 text-center bg-white">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#006e2f]">
                  {weekDays[0]?.dayName}
                </p>
                <div className="mt-1 flex justify-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#006e2f] text-white text-2xl font-bold shadow-xs">
                    {weekDays[0]?.dayNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* 24-Hour Grid */}
            <div className="relative">
              {TIME_SLOTS_24H.map((hour) => {
                const hourLabel = formatHourLabel(hour);

                return (
                  <div
                    key={`slot-day-${hour}`}
                    style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                    className="grid grid-cols-[64px_1fr] relative group"
                  >
                    {/* Left Hour Label - No horizontal borders */}
                    <div className="border-r border-[#dadce0] pr-2 -mt-2 text-right text-[10px] font-medium text-[#70757a] select-none bg-transparent">
                      {hour > 0 ? hourLabel : ''}
                    </div>
                    <div className="h-full border-b border-[#dadce0] relative hover:bg-[#f1f3f4]/25" />
                  </div>
                );
              })}

              {/* Day Event Blocks */}
              <div className="absolute inset-0 grid grid-cols-[64px_1fr] pointer-events-none">
                <div />
                <div className="relative h-[1440px] px-2 pointer-events-auto">
                  {bookings.map((b) => {
                    const topPx = b.startHour * HOUR_ROW_HEIGHT;
                    const heightPx = Math.max(
                      b.durationHours * HOUR_ROW_HEIGHT,
                      26,
                    );

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        style={{
                          top: `${topPx + 1}px`,
                          height: `${heightPx - 3}px`,
                        }}
                        className={`absolute inset-x-2 z-10 cursor-pointer overflow-hidden rounded-lg border px-3 py-1.5 text-xs shadow-2xs transition-all hover:z-20 hover:scale-[1.01] hover:shadow-md ${getGoogleStatusStyle(
                          b.status,
                        )}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold truncate text-xs">
                            {b.customerName}
                          </span>
                          <span className="text-[11px] opacity-80 shrink-0 font-medium">
                            {b.timeDisplay}
                          </span>
                        </div>
                        <p className="truncate text-xs opacity-85 mt-0.5">
                          {b.courtName} • Mã đơn: {b.code}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: MONTH VIEW */}
        {viewMode === 'month' && (
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="grid grid-cols-7 border-b border-[#dadce0] bg-white text-center text-xs font-bold text-[#70757a] py-2.5 shrink-0">
              <span>SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-[#dadce0] flex-1">
              {weekDays.map((day) => {
                const dayBookings = bookings.filter(
                  (b) => b.bookingDate === day.dateString,
                );

                return (
                  <div
                    key={day.dateString}
                    className={`min-h-[110px] p-2 transition-colors ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-[#f8f9fa]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          day.isToday
                            ? 'bg-[#006e2f] text-white'
                            : day.isCurrentMonth
                              ? 'text-[#3c4043]'
                              : 'text-[#70757a]/50'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {dayBookings.length > 0 && (
                        <span className="text-[10px] font-bold text-[#006e2f] bg-[#006e2f]/10 px-1.5 py-0.5 rounded-full">
                          {dayBookings.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[75px]">
                      {dayBookings.slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          className={`cursor-pointer truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold border transition-all hover:scale-[1.01] ${getGoogleStatusStyle(
                            b.status,
                          )}`}
                          title={`${b.code} - ${b.customerName} (${b.timeDisplay})`}
                        >
                          {b.timeDisplay.split(' - ')[0]} {b.customerName}
                        </div>
                      ))}

                      {dayBookings.length > 3 && (
                        <p className="text-[10px] font-bold text-[#70757a] pl-1">
                          +{dayBookings.length - 3} khác...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: YEAR VIEW */}
        {viewMode === 'year' && (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 bg-[#f8f9fa] overflow-y-auto">
            {Array.from({ length: 12 }, (_, monthIdx) => {
              const year = currentDate.getFullYear();
              const firstDay = new Date(year, monthIdx, 1);
              const totalDays = new Date(year, monthIdx + 1, 0).getDate();
              const startDay = firstDay.getDay();

              const monthBookings = bookings.filter((b) => {
                const parts = b.bookingDate.split('-');
                return (
                  parts.length === 3 &&
                  Number(parts[0]) === year &&
                  Number(parts[1]) === monthIdx + 1
                );
              });

              return (
                <div
                  key={`year-month-${monthIdx}`}
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(monthIdx);
                    setCurrentDate(d);
                    setViewMode('month');
                  }}
                  className="rounded-2xl border border-[#dadce0] bg-white p-4 shadow-xs hover:border-[#006e2f] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-[#dadce0]/60 pb-2">
                    <h4 className="font-bold text-sm text-[#3c4043] group-hover:text-[#006e2f]">
                      Tháng {monthIdx + 1}
                    </h4>
                    <span className="text-xs font-semibold text-[#70757a]">
                      {monthBookings.length} đơn
                    </span>
                  </div>

                  <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#70757a] mb-1">
                    <span>S</span>
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                    {Array.from({ length: startDay }).map((_, i) => (
                      <span key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: totalDays }).map((_, i) => {
                      const dayNum = i + 1;
                      const dStr = `${year}-${String(monthIdx + 1).padStart(
                        2,
                        '0',
                      )}-${String(dayNum).padStart(2, '0')}`;
                      const hasBooking = monthBookings.some(
                        (b) => b.bookingDate === dStr,
                      );
                      const isToday = isSameDay(
                        new Date(year, monthIdx, dayNum),
                        new Date(),
                      );

                      return (
                        <span
                          key={`day-${dayNum}`}
                          className={`rounded-full h-6 w-6 flex items-center justify-center font-medium ${
                            isToday
                              ? 'bg-[#006e2f] text-white font-bold'
                              : hasBooking
                                ? 'bg-[#006e2f]/15 text-[#004b1e] font-bold'
                                : 'text-[#3c4043]'
                          }`}
                        >
                          {dayNum}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Quick Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-[#dadce0] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#dadce0]/70 pb-3">
              <div>
                <span className="text-xs font-semibold text-[#70757a]">
                  Chi tiết đơn đặt sân
                </span>
                <h4 className="font-(family-name:--font-manrope) text-xl font-extrabold text-[#006e2f]">
                  {selectedBooking.code}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3.5 text-xs sm:text-sm">
              {/* Customer Info */}
              <div className="rounded-xl border border-[#dadce0]/70 bg-[#f8f9fa] p-3.5">
                <p className="mb-2 font-bold text-[#3c4043]">
                  Khách hàng đặt sân
                </p>
                <div className="flex items-center gap-3">
                  {selectedBooking.customerAvatar ? (
                    <img
                      src={selectedBooking.customerAvatar}
                      alt={selectedBooking.customerName}
                      className="h-10 w-10 shrink-0 rounded-full border border-[#dadce0] object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006e2f]/10 text-sm font-bold text-[#006e2f]">
                      {selectedBooking.customerName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-bold text-[#3c4043] truncate">
                      {selectedBooking.customerName}
                    </p>
                    <p className="text-xs text-[#70757a] truncate">
                      {selectedBooking.customerPhone ||
                        selectedBooking.customerEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time & Court */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#70757a]">Sân đặt:</span>
                  <span className="font-semibold text-[#3c4043]">
                    {selectedBooking.courtName}{' '}
                    {selectedBooking.courtType
                      ? `(${selectedBooking.courtType})`
                      : ''}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#70757a]">Ngày đá:</span>
                  <span className="font-semibold text-[#3c4043]">
                    {formatDateVN(selectedBooking.bookingDate)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#70757a]">Khung giờ:</span>
                  <span className="font-bold text-[#006e2f]">
                    {selectedBooking.timeDisplay}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#70757a]">Trạng thái:</span>
                  {renderStatusBadge(selectedBooking.status)}
                </div>

                {selectedBooking.finalPrice !== undefined && (
                  <div className="flex justify-between border-t border-[#dadce0]/70 pt-2">
                    <span className="text-[#70757a]">Tổng thanh toán:</span>
                    <span className="font-bold text-[#d93025]">
                      {formatVND(selectedBooking.finalPrice)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#dadce0]/70 pt-3">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-full border border-[#dadce0] px-4 py-2 text-xs font-semibold text-[#3c4043] hover:bg-[#f1f3f4]"
              >
                Đóng
              </button>

              <Link
                href={`/admin/bookings/${selectedBooking.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#006e2f] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#004b1e]"
              >
                <span>Xem chi tiết đơn</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getWeekdayName(dayIndex: number): string {
  const names = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];
  return names[dayIndex] || '';
}

// Clean Google Calendar style event pills
function getGoogleStatusStyle(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'border-[#f9ab00] bg-[#fef7e0] text-[#b06000]';
    case 'CONFIRMED':
      return 'border-[#34a853] bg-[#e6f4ea] text-[#137333]';
    case 'COMPLETED':
      return 'border-[#1a73e8] bg-[#e8f0fe] text-[#1967d2]';
    case 'REJECTED':
      return 'border-[#ea4335] bg-[#fce8e6] text-[#c5221f]';
    case 'CANCELLED':
      return 'border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]';
    default:
      return 'border-[#dadce0] bg-[#f8f9fa] text-[#3c4043]';
  }
}

function renderStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'PENDING':
      return (
        <span className="rounded-full border border-[#f9ab00]/40 bg-[#fef7e0] px-2.5 py-0.5 text-xs font-bold text-[#b06000]">
          Chờ xác nhận
        </span>
      );
    case 'CONFIRMED':
      return (
        <span className="rounded-full border border-[#34a853]/40 bg-[#e6f4ea] px-2.5 py-0.5 text-xs font-bold text-[#137333]">
          Đã xác nhận
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="rounded-full border border-[#1a73e8]/40 bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-bold text-[#1967d2]">
          Hoàn thành
        </span>
      );
    case 'REJECTED':
      return (
        <span className="rounded-full border border-[#ea4335]/40 bg-[#fce8e6] px-2.5 py-0.5 text-xs font-bold text-[#c5221f]">
          Từ chối
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="rounded-full border border-[#dadce0] bg-[#f1f3f4] px-2.5 py-0.5 text-xs font-bold text-[#5f6368]">
          Đã hủy
        </span>
      );
    default:
      return null;
  }
}
