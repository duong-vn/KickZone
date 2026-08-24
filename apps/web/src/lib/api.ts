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
  FavoritesResponse,
  ToggleFavoriteResponse,
} from '@/types/favorite';
import type {
  AvailabilityResponse,
  FieldDetail,
  FieldsResponse,
  FieldReviewsResponse,
  Paginated,
} from '@/types/field';

export interface ApiErrorShape {
  status: number;
  code?: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor({ status, code, message }: ApiErrorShape) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'API_ERROR';
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

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
      const token = await getAuthToken();
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

export async function fetchFieldById(
  id: string,
): Promise<{ data: FieldDetail }> {
  const res = await request<FieldDetail | { data: FieldDetail }>(
    'get',
    `/fields/${id}`,
  );
  if (res && typeof res === 'object' && 'data' in res && res.data) {
    return res as { data: FieldDetail };
  }
  return { data: res as FieldDetail };
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
  fieldId?: string;
  startTime?: string;
  endTime?: string;
  code: string;
  originalPrice?: number;
}) {
  return request<{ data: VoucherPreview }>(
    'post',
    '/vouchers/validate',
    input,
    undefined,
    false,
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

export const fetchFieldTypes = async () => {
  const res = await fetch(`${API_BASE_URL}/field-types`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new ApiError({ status: res.status, message: 'Lỗi tải loại sân' });
  }

  return res.json();
};

export async function toggleFavoriteField(
  fieldId: string,
): Promise<ToggleFavoriteResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  const res = await api.post<ToggleFavoriteResponse>(
    `/fields/${fieldId}/favorite`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return res.data;
}

export async function fetchFavoriteStatus(
  fieldId: string,
): Promise<{ is_favorite: boolean }> {
  const token = await getAuthToken();
  if (!token) {
    return { is_favorite: false };
  }

  try {
    const res = await api.get<{ is_favorite: boolean }>(
      `/fields/${fieldId}/favorite`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res.data;
  } catch {
    return { is_favorite: false };
  }
}

export async function fetchFavorites(params?: {
  page?: number;
  limit?: number;
}): Promise<FavoritesResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  const res = await api.get<FavoritesResponse>('/favorites', {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}

export const fetchFieldReviews = async (
  id: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<FieldReviewsResponse> => {
  return request<FieldReviewsResponse>(
    'get',
    `/fields/${id}/reviews`,
    undefined,
    params,
  );
};

export interface VoucherValidateResult {
  valid: boolean;
  message: string;
  code?: string;
  discountType?: 'PERCENT' | 'FIXED';
  discountValue?: number;
  discountAmount?: number;
  finalPrice?: number;
}

export const validateVoucherApi = async (
  code: string,
  originalPrice: number,
  fieldId?: string,
): Promise<VoucherValidateResult> => {
  try {
    const res = await api.post<VoucherValidateResult>('/vouchers/validate', {
      code,
      originalPrice,
      fieldId,
    });
    return res.data;
  } catch {
    return {
      valid: false,
      message: 'Không thể kết nối máy chủ để kiểm tra mã giảm giá.',
    };
  }
};

// ---------------------------------------------------------------------------
// Admin APIs
// ---------------------------------------------------------------------------

export async function fetchAdminFields(params?: {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) {
  const token = await getAuthToken();
  const res = await api.get('/admin/fields', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function fetchAdminFieldById(id: string) {
  const token = await getAuthToken();
  const res = await api.get(`/admin/fields/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function createAdminField(dto: Record<string, unknown>) {
  const token = await getAuthToken();
  const res = await api.post('/admin/fields', dto, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function uploadAdminFieldImages(
  fieldId: string,
  formData: FormData,
) {
  const token = await getAuthToken();
  const res = await api.post(`/admin/fields/${fieldId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  return res.data;
}

export async function fetchAdminUsers(params?: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const token = await getAuthToken();
  const res = await api.get('/admin/users', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function fetchAdminUserById(id: string) {
  const token = await getAuthToken();
  const res = await api.get(`/admin/users/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function createAdminUser(dto: Record<string, unknown>) {
  const token = await getAuthToken();
  const res = await api.post('/admin/users', dto, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function updateAdminFieldStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE',
) {
  const token = await getAuthToken();
  const res = await api.patch(
    `/admin/fields/${id}/status`,
    { status },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  return res.data;
}

export async function updateAdminField(
  id: string,
  data: Record<string, unknown>,
) {
  const token = await getAuthToken();
  const res = await api.patch(`/admin/fields/${id}`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function fetchCurrentUserProfile() {
  const token = await getAuthToken();
  const res = await api.get('/users/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function updateAdminUserStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE',
) {
  const token = await getAuthToken();
  const res = await api.patch(
    `/admin/users/${id}/status`,
    { status },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  return res.data;
}

export async function updateAdminUser(
  id: string,
  data: Record<string, unknown>,
) {
  const token = await getAuthToken();
  const res = await api.patch(`/admin/users/${id}`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function uploadAdminUserAvatar(userId: string, formData: FormData) {
  const token = await getAuthToken();
  const res = await api.post(`/admin/users/${userId}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  return res.data;
}

export async function deleteAdminField(id: string) {
  const token = await getAuthToken();
  const res = await api.delete(`/admin/fields/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function fetchAdminFieldSchedule(fieldId: string, date: string) {
  const token = await getAuthToken();
  const res = await api.get(`/admin/fields/${fieldId}/schedule?date=${date}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function fetchAdminPriceRules(fieldId: string) {
  const token = await getAuthToken();
  const res = await api.get(`/admin/fields/${fieldId}/price-rules`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function createAdminPriceRule(
  fieldId: string,
  data: Record<string, unknown>,
) {
  const token = await getAuthToken();
  const res = await api.post(`/admin/fields/${fieldId}/price-rules`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function updateAdminPriceRule(
  fieldId: string,
  ruleId: string,
  data: Record<string, unknown>,
) {
  const token = await getAuthToken();
  const res = await api.patch(
    `/admin/fields/${fieldId}/price-rules/${ruleId}`,
    data,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  return res.data;
}

export async function deleteAdminPriceRule(fieldId: string, ruleId: string) {
  const token = await getAuthToken();
  const res = await api.delete(
    `/admin/fields/${fieldId}/price-rules/${ruleId}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  return res.data;
}

// ---------------- Admin Bookings APIs ----------------

export async function fetchAdminBookings(params?: {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
  fieldId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) {
  const token = await getAuthToken();
  const res = await api.get('/admin/bookings', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function fetchAdminBookingById(id: string) {
  const token = await getAuthToken();
  const res = await api.get(`/admin/bookings/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function approveAdminBooking(id: string) {
  const token = await getAuthToken();
  const res = await api.patch(
    `/admin/bookings/${id}/approve`,
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  return res.data;
}

export async function rejectAdminBooking(id: string, reason?: string) {
  const token = await getAuthToken();
  const res = await api.patch(
    `/admin/bookings/${id}/reject`,
    { reason },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  return res.data;
}

export async function fetchAdminBookingCalendar(
  fromOrParams?: { from?: string; to?: string; fieldId?: string } | string,
  to?: string,
  fieldId?: string,
) {
  const token = await getAuthToken();
  const params =
    typeof fromOrParams === 'string'
      ? { from: fromOrParams, to, ...(fieldId && { fieldId }) }
      : fromOrParams;

  const res = await api.get('/admin/bookings/calendar', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

// ---------------- Admin Dashboard APIs ----------------

export async function fetchAdminDashboardStats() {
  const token = await getAuthToken();
  const res = await api.get('/admin/dashboard/stats', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}
