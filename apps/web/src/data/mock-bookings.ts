import { z } from 'zod';

import type { BookingItem, NewBooking } from '@/types/booking';

export type { BookingItem, BookingStatus, NewBooking } from '@/types/booking';

export const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: 'b1',
    code: 'KZ-8921',
    userId: 'mock-user',
    fieldId: '1',
    fieldName: 'Sân bóng đá Chảo Lửa',
    fieldAddress: '30 Phan Thúc Duyện, Phường 4, Tân Bình, TP.HCM',
    fieldType: 'Sân 7 người',
    fieldImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDrDOm7rj2skKxqydXGm_2fCgpc8cOSpWpfQNWUjSyk-4a8dJ67OgaVYU9_8gXoZ7zVsNGiHktsLNrqgaBE1jMnGFe72lXAoL0bQmZNUNz0h8Wq87FFOo9oVZ2a87dzJkPll6s7TwgQcznmgYmfIyimnqqxY8RK6lLhDcZ4Bit1ySrjYbD52BLS0WIM6cOxPrR_ocu92EJjPiaknq_yREXKh7BKesXc5k_Se9YStukY_4DUzkvKvmPf1Q',
    courtName: 'Sân 7 - B1 (Chuẩn thi đấu)',
    date: '2026-08-26',
    dateDisplay: 'Thứ 4, 26/08/2026',
    startTime: '18:00',
    endTime: '19:30',
    durationMinutes: 90,
    pricePerHour: 300000,
    originalPrice: 450000,
    discountAmount: 0,
    finalPrice: 450000,
    status: 'PENDING',
    createdAt: '2026-08-24T07:30:00.000Z',
    updatedAt: '2026-08-24T07:30:00.000Z',
    hostPhone: '0908 123 456',
  },
  {
    id: 'b2',
    code: 'KZ-8905',
    userId: 'mock-user',
    fieldId: '1',
    fieldName: 'Sân bóng đá Chảo Lửa',
    fieldAddress: '30 Phan Thúc Duyện, Phường 4, Tân Bình, TP.HCM',
    fieldType: 'Sân 7 người',
    fieldImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCNj8R-dy2eQ3C0qQ9BTahTxdBHtyXaHNCamcxVPLywhugL4bL5yFMugTEG6UjY3_6rS-fJOIxx2WtEG2QzN3R1FC5vgL5sWukKjuP-6D9yhOJBNKioi02uBY7H5acWo3ZgCqJ_GeiCI7V8QZwORd0y9jHZ_uIeUQCwi3R6fRFobsdALxKOpvks3GKNMQavdoeihFtQzORO-gFH3rfCAh850pA_4SwPMoO31oJBjs8kyDHdbOnnppZwJw',
    courtName: 'Sân 7 - B2 (Đèn LED cao cấp)',
    date: '2026-08-28',
    dateDisplay: 'Thứ 6, 28/08/2026',
    startTime: '20:00',
    endTime: '21:30',
    durationMinutes: 90,
    pricePerHour: 350000,
    originalPrice: 525000,
    discountAmount: 50000,
    finalPrice: 475000,
    voucherCode: 'KICKZONE50',
    status: 'CONFIRMED',
    createdAt: '2026-08-23T03:15:00.000Z',
    updatedAt: '2026-08-23T03:15:00.000Z',
    hostPhone: '0908 123 456',
  },
  {
    id: 'b3',
    code: 'KZ-8750',
    userId: 'mock-user',
    fieldId: '3',
    fieldName: 'Sân ĐH Tôn Đức Thắng',
    fieldAddress: 'Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7, TP.HCM',
    fieldType: 'Sân 11 người',
    fieldImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA2xE5yic2QHVvAqARF7Bnyi4HqzWmPfrZDHikx8s3unwe_Ge_sVVJ0ClvSMNaoPL8Fe-1xO9NnM19thd8s-h7uSOUkSSCu1gODikd4Gd-P_mza95dVWCZlhwbFlXdhAiY5m1ljnfxxqwx1loSCGMvEs4WOOG9fu5HhvxQR-37aqtHQ76ihT-Yb35-_2J4oT3iJWU8aoPUzGn9eso_QXWawiSKb436K4Lartu7XiFxnF4I08vv9MXyrOA',
    courtName: 'Sân 11 - Sân Đại',
    date: '2026-08-15',
    dateDisplay: 'Thứ 7, 15/08/2026',
    startTime: '19:00',
    endTime: '21:00',
    durationMinutes: 120,
    pricePerHour: 800000,
    originalPrice: 1600000,
    discountAmount: 100000,
    finalPrice: 1500000,
    voucherCode: 'KZPRO10',
    status: 'COMPLETED',
    createdAt: '2026-08-10T02:00:00.000Z',
    updatedAt: '2026-08-10T02:00:00.000Z',
    hostPhone: '0912 345 678',
  },
  {
    id: 'b4',
    code: 'KZ-8612',
    userId: 'mock-user',
    fieldId: '2',
    fieldName: 'Sân bóng K34',
    fieldAddress: 'Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP.HCM',
    fieldType: 'Sân 7 người',
    fieldImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC3Rq8ne4IOVVio5VQy3uaUSlBYmkmgetmT20pt5-fgTOOZgnCBxzUc9RzETSFMsbKADKJZSwChjnHmm_sr-7aKTnl8wkNAZtEcwYF__8UJUJdAzeUDOurOC6k1kWsYiPQVdp31h24McPQ5-4rzObUdgsrTNpsJAA_-3KuLkN342DGPvl8jzGzZshku4eDc86lF7BM8ybPOYP5yojP7TGV8RI_HQAqk0TL_BHfbvXa8h3PlqTTqPEOIVA',
    courtName: 'Sân 7 - K1',
    date: '2026-08-10',
    dateDisplay: 'Thứ 2, 10/08/2026',
    startTime: '17:30',
    endTime: '19:00',
    durationMinutes: 90,
    pricePerHour: 300000,
    originalPrice: 450000,
    discountAmount: 0,
    finalPrice: 450000,
    status: 'CANCELLED',
    createdAt: '2026-08-08T01:20:00.000Z',
    updatedAt: '2026-08-08T01:20:00.000Z',
    cancellationReason: 'Đội bạn bận đột xuất không đủ người thi đấu.',
    hostPhone: '0933 987 654',
  },
  {
    id: 'b5',
    code: 'KZ-8501',
    userId: 'mock-user',
    fieldId: '4',
    fieldName: 'Sân bóng mini Lan Anh',
    fieldAddress: 'Cách Mạng Tháng 8, Quận 10, TP.HCM',
    fieldType: 'Sân 5 người',
    fieldImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDrDOm7rj2skKxqydXGm_2fCgpc8cOSpWpfQNWUjSyk-4a8dJ67OgaVYU9_8gXoZ7zVsNGiHktsLNrqgaBE1jMnGFe72lXAoL0bQmZNUNz0h8Wq87FFOo9oVZ2a87dzJkPll6s7TwgQcznmgYmfIyimnqqxY8RK6lLhDcZ4Bit1ySrjYbD52BLS0WIM6cOxPrR_ocu92EJjPiaknq_yREXKh7BKesXc5k_Se9YStukY_4DUzkvKvmPf1Q',
    courtName: 'Sân 5 - L2',
    date: '2026-08-05',
    dateDisplay: 'Thứ 4, 05/08/2026',
    startTime: '18:00',
    endTime: '19:30',
    durationMinutes: 90,
    pricePerHour: 280000,
    originalPrice: 420000,
    discountAmount: 0,
    finalPrice: 420000,
    status: 'REJECTED',
    createdAt: '2026-08-04T04:00:00.000Z',
    updatedAt: '2026-08-04T04:00:00.000Z',
    rejectionReason: 'Sân đang bảo dưỡng đột xuất hệ thống dàn đèn.',
    hostPhone: '0944 555 666',
  },
];

const LOCAL_STORAGE_KEY = 'kickzone:bookings:v1';

const bookingSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  userId: z.string().min(1),
  fieldId: z.string().min(1),
  fieldName: z.string().min(1),
  fieldAddress: z.string().min(1),
  fieldType: z.string().min(1),
  fieldImage: z.string(),
  courtName: z.string().min(1),
  date: z.string().min(1),
  dateDisplay: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().positive(),
  pricePerHour: z.number().int().positive(),
  originalPrice: z.number().int().nonnegative(),
  discountAmount: z.number().int().nonnegative(),
  finalPrice: z.number().int().nonnegative(),
  voucherId: z.string().min(1).optional(),
  voucherCode: z.string().min(1).optional(),
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'REJECTED',
  ]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  cancellationReason: z.string().min(1).optional(),
  rejectionReason: z.string().min(1).optional(),
  hostPhone: z.string().min(1).optional(),
});

const storedBookingsSchema = z.array(bookingSchema);

function cloneInitialBookings(): BookingItem[] {
  return structuredClone(INITIAL_BOOKINGS);
}

function writeBookings(bookings: BookingItem[]): boolean {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookings));
    return true;
  } catch {
    return false;
  }
}

export function getStoredBookings(): BookingItem[] {
  if (typeof window === 'undefined') return cloneInitialBookings();

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initialBookings = cloneInitialBookings();
      return writeBookings(initialBookings) ? initialBookings : [];
    }

    const parsed = storedBookingsSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;

    const initialBookings = cloneInitialBookings();
    return writeBookings(initialBookings) ? initialBookings : [];
  } catch {
    return [];
  }
}

export function saveStoredBookings(bookings: BookingItem[]): boolean {
  if (typeof window === 'undefined') return false;
  if (!storedBookingsSchema.safeParse(bookings).success) return false;
  return writeBookings(bookings);
}

export function getBookingById(idOrCode: string): BookingItem | undefined {
  const list = getStoredBookings();
  return list.find(
    (booking) =>
      booking.id === idOrCode ||
      booking.code === idOrCode ||
      booking.code.toLowerCase() === idOrCode.toLowerCase(),
  );
}

export function cancelBooking(id: string, reason?: string): boolean {
  const list = getStoredBookings();
  const booking = list.find((item) => item.id === id);
  if (!booking || booking.status !== 'PENDING') return false;

  const updatedBooking: BookingItem = {
    ...booking,
    status: 'CANCELLED',
    cancellationReason: reason?.trim() || 'Người dùng hủy đơn',
    updatedAt: new Date().toISOString(),
  };

  return saveStoredBookings(
    list.map((item) => (item.id === id ? updatedBooking : item)),
  );
}

function createBookingCode(bookings: BookingItem[]): string {
  let code = '';

  do {
    code = `KZ-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  } while (bookings.some((booking) => booking.code === code));

  return code;
}

export function createNewBooking(item: NewBooking): BookingItem | null {
  const list = getStoredBookings();
  const now = new Date().toISOString();
  const newBooking: BookingItem = {
    ...item,
    id: crypto.randomUUID(),
    code: createBookingCode(list),
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  return saveStoredBookings([newBooking, ...list]) ? newBooking : null;
}
