import axios, { AxiosError } from 'axios';
import { getSupabaseBrowserClient } from './supabase';
import type {
  Booking,
  BookingStatus,
  CancelBookingRequest,
  CreateBookingRequest,
  VoucherPreview,
} from '@/types/booking';
import type {
  AvailabilityResponse,
  FieldDetail,
  FieldsResponse,
  Paginated,
} from '@/types/field';

export interface ApiErrorShape {
  status: number;
  code: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor({ status, code, message }: ApiErrorShape) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

async function request<T>(
  method: 'get' | 'post' | 'patch',
  url: string,
  data?: unknown,
  params?: Record<string, string | number | boolean | undefined | null>,
  protectedRequest = false,
): Promise<T> {
  try {
    const headers: Record<string, string> = {};
    if (protectedRequest) {
      const { data: sessionData } =
        await getSupabaseBrowserClient().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token)
        throw new ApiError({
          status: 401,
          code: 'AUTH_REQUIRED',
          message: 'Vui lòng đăng nhập.',
        });
      headers.Authorization = `Bearer ${token}`;
    }
    const cleanParams: Record<string, string | number> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = typeof value === 'boolean' ? String(value) : value;
        }
      });
    }
    const response = await api.request<T>({
      method,
      url,
      data,
      params: cleanParams,
      headers,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const axiosError = error as AxiosError<{ code?: string; message?: string }>;
    throw new ApiError({
      status: axiosError.response?.status ?? 0,
      code: axiosError.response?.data?.code ?? 'NETWORK_ERROR',
      message:
        axiosError.response?.data?.message ?? 'Không thể kết nối máy chủ.',
    });
  }
}

export function fetchFields(
  params: Record<string, string | number | boolean | undefined | null>,
) {
  return request<FieldsResponse>('get', '/fields', undefined, params);
}

export function fetchFieldById(id: string) {
  return request<{ data: FieldDetail }>('get', `/fields/${id}`);
}

export function fetchAvailability(fieldId: string, date: string) {
  return request<{ data: AvailabilityResponse }>(
    'get',
    `/fields/${fieldId}/availability`,
    undefined,
    { date },
  );
}

export function validateVoucher(input: {
  fieldId: string;
  startTime: string;
  endTime: string;
  code: string;
}) {
  return request<{ data: VoucherPreview }>(
    'post',
    '/vouchers/validate',
    input,
    undefined,
    true,
  );
}

export function createBooking(input: CreateBookingRequest) {
  return request<{ data: Booking }>(
    'post',
    '/bookings',
    input,
    undefined,
    true,
  );
}

export function fetchMyBookings(params: {
  page: number;
  limit: number;
  status?: BookingStatus;
  search?: string;
}) {
  return request<Paginated<Booking>>(
    'get',
    '/bookings/me',
    undefined,
    params,
    true,
  );
}

export function fetchBooking(id: string) {
  return request<{ data: Booking }>(
    'get',
    `/bookings/${id}`,
    undefined,
    undefined,
    true,
  );
}

export function cancelBooking(id: string, input: CancelBookingRequest) {
  return request<{ data: Booking }>(
    'patch',
    `/bookings/${id}/cancel`,
    input,
    undefined,
    true,
  );
}
