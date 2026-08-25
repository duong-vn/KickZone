import type { AvailabilitySlot } from '@/types/field';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const HALF_HOUR_MS = 30 * 60 * 1000;
const OFFSET_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/;

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export interface BusinessInterval {
  start: Date;
  end: Date;
}

export function businessDateKey(value: Date): string {
  return dateFormatter.format(value);
}

export function nextBusinessDates(count = 7, from = new Date()) {
  const dates: Array<{ iso: string; dayName: string; dayFormatted: string }> =
    [];
  const cursor = new Date(from);
  for (let index = 0; index < count; index += 1) {
    const iso = businessDateKey(cursor);
    const dayName =
      index === 0
        ? 'Hôm nay'
        : index === 1
          ? 'Ngày mai'
          : new Intl.DateTimeFormat('vi-VN', {
              timeZone: TIME_ZONE,
              weekday: 'short',
            }).format(cursor);
    const dayFormatted = new Intl.DateTimeFormat('vi-VN', {
      timeZone: TIME_ZONE,
      day: '2-digit',
      month: '2-digit',
    }).format(cursor);
    dates.push({ iso, dayName, dayFormatted });
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function formatBusinessDate(value: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(typeof value === 'string' ? new Date(value) : value);
}

export function formatBusinessTime(value: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(typeof value === 'string' ? new Date(value) : value);
}

export function durationMinutes(start: string, end: string): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60_000,
  );
}

export function toBusinessIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

function parseOffsetTimestamp(value: string): Date | null {
  const match = OFFSET_TIMESTAMP.exec(value);
  if (!match) return null;

  const [year, month, day, hour, minute, second] = match
    .slice(1, 7)
    .map(Number);
  const offsetHour = Number(match[10] ?? 0);
  const offsetMinute = Number(match[11] ?? 0);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function parseBusinessInterval(
  startTime: string,
  endTime: string,
): BusinessInterval | null {
  const start = parseOffsetTimestamp(startTime);
  const end = parseOffsetTimestamp(endTime);
  if (!start || !end || start >= end) return null;

  if (
    start.getSeconds() !== 0 ||
    end.getSeconds() !== 0 ||
    start.getMilliseconds() !== 0 ||
    end.getMilliseconds() !== 0 ||
    start.getTime() % HALF_HOUR_MS !== 0 ||
    end.getTime() % HALF_HOUR_MS !== 0 ||
    businessDateKey(start) !== businessDateKey(end)
  ) {
    return null;
  }

  return { start, end };
}

export function getContiguousAvailableSlots(
  slots: readonly AvailabilitySlot[],
  startTime: string,
  endTime?: string,
): AvailabilitySlot[] {
  const start = parseOffsetTimestamp(startTime);
  const requested = endTime
    ? parseBusinessInterval(startTime, endTime)
    : null;
  if (!start || (endTime && !requested)) return [];

  const normalized = slots
    .map((slot) => ({ slot, interval: parseBusinessInterval(slot.startTime, slot.endTime) }))
    .filter(
      (entry): entry is { slot: AvailabilitySlot; interval: BusinessInterval } =>
        entry.interval !== null &&
        Number.isFinite(entry.slot.price) &&
        entry.slot.price >= 0,
    )
    .sort((a, b) => a.interval.start.getTime() - b.interval.start.getTime());
  const firstIndex = normalized.findIndex(
    (entry) => entry.interval.start.getTime() === start.getTime(),
  );
  if (firstIndex < 0) return [];

  const selected: AvailabilitySlot[] = [];
  let expectedStart = start.getTime();
  const requestedEnd = requested?.end.getTime();

  for (let index = firstIndex; index < normalized.length; index += 1) {
    const { slot, interval } = normalized[index];
    if (
      !slot.available ||
      interval.start.getTime() !== expectedStart ||
      businessDateKey(interval.start) !== businessDateKey(start)
    ) {
      break;
    }

    selected.push(slot);
    expectedStart = interval.end.getTime();

    if (requestedEnd !== undefined) {
      if (expectedStart === requestedEnd) return selected;
      if (expectedStart > requestedEnd) return [];
    }
  }

  return requestedEnd === undefined ? selected : [];
}
