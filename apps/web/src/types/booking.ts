export type BookingStatus =
  'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export type BookingItem = Booking;
export type NewBooking = Booking;

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
