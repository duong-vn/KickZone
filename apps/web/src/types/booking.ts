export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface BookingItem {
  id: string;
  code: string;
  userId: string;
  fieldId: string;
  fieldName: string;
  fieldAddress: string;
  fieldType: string;
  fieldImage: string;
  courtName: string;
  date: string;
  dateDisplay: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  pricePerHour: number;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  voucherId?: string;
  voucherCode?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  rejectionReason?: string;
  hostPhone?: string;
}

export type NewBooking = Omit<
  BookingItem,
  'id' | 'code' | 'createdAt' | 'updatedAt' | 'status'
>;
