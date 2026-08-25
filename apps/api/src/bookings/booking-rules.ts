import { BadRequestException } from '@nestjs/common';
import { discount_type } from '../generated/prisma/enums.js';

export const BUSINESS_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const OFFSET_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface BookingInterval {
  start: Date;
  end: Date;
  localDate: string;
  weekday: number;
}

export interface TimeWindow {
  openMinutes: number;
  closeMinutes: number;
}

export interface PriceRuleInput {
  day_of_week: number | null;
  start_time: Date;
  end_time: Date;
  price_per_hour: number;
  effective_from: Date | null;
  effective_to: Date | null;
  priority: number;
  created_at: Date;
  id: string;
  is_active: boolean;
}

export interface PriceSegment {
  start: Date;
  end: Date;
  price: number;
}

export interface VoucherInput {
  discount_type: discount_type;
  value: number;
  max_discount: number | null;
}

export function parseBookingInterval(
  startValue: string,
  endValue: string,
  now = new Date(),
): BookingInterval {
  if (!OFFSET_TIMESTAMP.test(startValue) || !OFFSET_TIMESTAMP.test(endValue)) {
    throw new BadRequestException({
      code: 'INVALID_BOOKING_TIME',
      message: 'Booking times must be ISO 8601 timestamps with an offset.',
    });
  }

  const start = new Date(startValue);
  const end = new Date(endValue);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    throw new BadRequestException({
      code: 'INVALID_BOOKING_TIME',
      message: 'Booking times are invalid.',
    });
  }

  const startParts = getBusinessDateParts(start);
  const endParts = getBusinessDateParts(end);
  if (
    start >= end ||
    start.getSeconds() !== 0 ||
    end.getSeconds() !== 0 ||
    start.getMilliseconds() !== 0 ||
    end.getMilliseconds() !== 0 ||
    startParts.minute % 30 !== 0 ||
    endParts.minute % 30 !== 0 ||
    startParts.date !== endParts.date
  ) {
    throw new BadRequestException({
      code: 'INVALID_BOOKING_TIME',
      message: 'Booking must use 30-minute intervals on one local date.',
    });
  }

  if (start <= now) {
    throw new BadRequestException({
      code: 'BOOKING_IN_PAST',
      message: 'Booking must start in the future.',
    });
  }

  return {
    start,
    end,
    localDate: startParts.date,
    weekday: startParts.weekday,
  };
}

export function parseAvailabilityDate(value: string): {
  date: string;
  weekday: number;
} {
  if (!DATE_PATTERN.test(value)) {
    throw new BadRequestException({
      code: 'INVALID_DATE',
      message: 'Date must use YYYY-MM-DD.',
    });
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException({
      code: 'INVALID_DATE',
      message: 'Date is invalid.',
    });
  }

  const today = getBusinessDateParts(new Date()).date;
  if (value < today) {
    throw new BadRequestException({
      code: 'INVALID_DATE',
      message: 'Date cannot be in the past.',
    });
  }

  return { date: value, weekday: date.getUTCDay() };
}

export function getBusinessDateParts(value: Date): {
  date: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(value);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value: partValue }) => [type, partValue]),
  );
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    weekday: weekdays[values.weekday] ?? 0,
  };
}

export function formatBusinessTime(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = getBusinessDateParts(date);
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

export function formatBusinessDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return getBusinessDateParts(date).date;
}

export function getSqlTimeMinutes(value: Date): number {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

export function isIntervalWithinWindow(
  interval: BookingInterval,
  window: TimeWindow,
): boolean {
  const start = getBusinessDateParts(interval.start);
  const end = getBusinessDateParts(interval.end);
  return (
    start.hour * 60 + start.minute >= window.openMinutes &&
    end.hour * 60 + end.minute <= window.closeMinutes
  );
}

export function makeLocalDateTime(date: string, minutes: number): Date {
  const hours = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return new Date(
    `${date}T${String(hours).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`,
  );
}

export function getSegments(
  interval: BookingInterval,
  rules: PriceRuleInput[],
  basePricePerHour: number,
): PriceSegment[] {
  const segmentCount =
    (interval.end.getTime() - interval.start.getTime()) / 1_800_000;

  return Array.from({ length: segmentCount }, (_, index) => {
    const segmentStart = new Date(interval.start.getTime() + index * 1_800_000);
    const segmentEnd = new Date(segmentStart.getTime() + 1_800_000);
    const parts = getBusinessDateParts(segmentStart);
    const matching = rules
      .filter((rule) => {
        const ruleStart = getSqlTimeMinutes(rule.start_time);
        const ruleEnd = getSqlTimeMinutes(rule.end_time);
        const effectiveFrom = rule.effective_from
          ? formatUtcDate(rule.effective_from)
          : null;
        const effectiveTo = rule.effective_to
          ? formatUtcDate(rule.effective_to)
          : null;
        return (
          rule.is_active &&
          (rule.day_of_week === null || rule.day_of_week === parts.weekday) &&
          (!effectiveFrom || parts.date >= effectiveFrom) &&
          (!effectiveTo || parts.date <= effectiveTo) &&
          parts.hour * 60 + parts.minute >= ruleStart &&
          parts.hour * 60 + parts.minute < ruleEnd
        );
      })
      .sort(
        (a, b) =>
          b.priority - a.priority ||
          b.created_at.getTime() - a.created_at.getTime() ||
          a.id.localeCompare(b.id),
      );
    const hourlyPrice = matching[0]?.price_per_hour ?? basePricePerHour;

    return { start: segmentStart, end: segmentEnd, price: hourlyPrice / 2 };
  });
}

export function calculateDiscount(
  voucher: VoucherInput,
  originalPrice: number,
): number {
  const rawDiscount =
    voucher.discount_type === discount_type.PERCENT
      ? Math.floor((originalPrice * voucher.value) / 100)
      : voucher.value;
  const cappedByRule =
    voucher.max_discount === null
      ? rawDiscount
      : Math.min(rawDiscount, voucher.max_discount);
  return Math.min(Math.max(0, cappedByRule), originalPrice);
}

export function formatUtcDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function isOverlapping(
  start: Date,
  end: Date,
  existingStart: Date,
  existingEnd: Date,
): boolean {
  return start < existingEnd && end > existingStart;
}

export function assertInsideOperatingHours(
  interval: BookingInterval,
  hours: {
    open_time: Date | null;
    close_time: Date | null;
    is_closed: boolean;
  },
): void {
  if (
    hours.is_closed ||
    hours.open_time === null ||
    hours.close_time === null ||
    !isIntervalWithinWindow(interval, {
      openMinutes: getSqlTimeMinutes(hours.open_time),
      closeMinutes: getSqlTimeMinutes(hours.close_time),
    })
  ) {
    throw new BadRequestException({
      code: 'BOOKING_OUTSIDE_OPERATING_HOURS',
      message: 'Booking is outside operating hours.',
    });
  }
}
