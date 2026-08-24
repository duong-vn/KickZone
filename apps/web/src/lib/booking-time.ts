const TIME_ZONE = 'Asia/Ho_Chi_Minh';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

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
