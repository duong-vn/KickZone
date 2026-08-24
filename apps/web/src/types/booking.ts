export type BookingStatus =
  'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export interface Booking {
  id: string;
  code: string;
  field: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    type: { id: string; name: string } | null;
    primaryImagePath: string | null;
  };
  voucher: { code: string } | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  cancellationReason: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingItem {
  id: string;
  code: string;
  userId?: string;
  fieldId?: string;
  fieldName?: string;
  fieldAddress?: string;
  fieldType?: string;
  fieldImage?: string;
  courtName?: string;
  date?: string;
  dateDisplay?: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  pricePerHour?: number;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  voucherCode?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  hostPhone?: string;
  cancellationReason?: string | null;
  rejectionReason?: string | null;
  field?: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    type: { id: string; name: string } | null;
    primaryImagePath: string | null;
  };
  voucher?: { code: string } | null;
}

export type NewBooking = Omit<
  BookingItem,
  'id' | 'code' | 'status' | 'createdAt' | 'updatedAt'
>;

export interface CreateBookingRequest {
  fieldId: string;
  startTime: string;
  endTime: string;
  voucherCode?: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

export interface VoucherPreview {
  code: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}
