import axios from 'axios';
import { getSupabaseBrowserClient } from './supabase';
import type {
  FavoritesResponse,
  ToggleFavoriteResponse,
} from '@/types/favorite';
import { Field, FieldsResponse, FieldReviewsResponse } from '@/types/field';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export const fetchFields = async (
  params: Record<string, string | number | boolean | undefined | null>,
): Promise<FieldsResponse> => {
  const cleanParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = String(value);
    }
  });

  const query = new URLSearchParams(cleanParams).toString();
  const res = await fetch(`${API_BASE_URL}/fields${query ? `?${query}` : ''}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new ApiError(
      `Lỗi tải danh sách sân bóng (${res.status})`,
      res.status,
    );
  }

  return res.json();
};

export const fetchFieldById = async (id: string): Promise<Field> => {
  const res = await fetch(`${API_BASE_URL}/fields/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new ApiError('Không tìm thấy thông tin sân bóng này', 404);
    }
    throw new ApiError(`Lỗi tải chi tiết sân bóng (${res.status})`, res.status);
  }

  return res.json();
};

export const fetchFieldTypes = async () => {
  const res = await fetch(`${API_BASE_URL}/field-types`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new ApiError('Lỗi tải loại sân', res.status);
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
  const cleanParams: Record<string, string> = {};

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = String(value);
      }
    });
  }

  const query = new URLSearchParams(cleanParams).toString();
  const res = await fetch(
    `${API_BASE_URL}/fields/${id}/reviews${query ? `?${query}` : ''}`,
    {
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    if (res.status === 404) {
      throw new ApiError('Không tìm thấy đánh giá cho sân bóng này', 404);
    }
    throw new ApiError(`Lỗi tải đánh giá sân bóng (${res.status})`, res.status);
  }

  return res.json();
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
    const res = await fetch(`${API_BASE_URL}/vouchers/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, originalPrice, fieldId }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        valid: false,
        message:
          errorData.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
      };
    }

    return await res.json();
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
  fromOrParams?: { from?: string; to?: string } | string,
  to?: string,
) {
  const token = await getAuthToken();
  const params =
    typeof fromOrParams === 'string'
      ? { from: fromOrParams, to }
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
