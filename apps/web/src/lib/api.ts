import axios from 'axios';
import { getSupabaseBrowserClient } from './supabase';
import type {
  FavoritesResponse,
  ToggleFavoriteResponse,
} from '@/types/favorite';
import { Field, FieldsResponse } from '@/types/field';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    throw new Error('Failed to fetch fields');
  }

  return res.json();
};

export const fetchFieldById = async (id: string): Promise<Field> => {
  const res = await fetch(`${API_BASE_URL}/fields/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch field ${id}`);
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

// ----------------------------------------------------
// Public Field Types
// ----------------------------------------------------
export async function fetchFieldTypes() {
  const res = await fetch(`${API_BASE_URL}/fields/field-types`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch field types');
  }
  return res.json();
}

// ----------------------------------------------------
// Admin Dashboard
// ----------------------------------------------------
export async function fetchAdminDashboardStats() {
  const token = await getAuthToken();
  const res = await api.get('/admin/dashboard/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ----------------------------------------------------
// Admin Bookings
// ----------------------------------------------------
export async function fetchAdminBookings(params?: Record<string, any>) {
  const token = await getAuthToken();
  const res = await api.get('/admin/bookings', {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchAdminBookingById(id: string) {
  const token = await getAuthToken();
  const res = await api.get(`/admin/bookings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function approveAdminBooking(id: string) {
  const token = await getAuthToken();
  const res = await api.patch(
    `/admin/bookings/${id}/approve`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data;
}

export async function rejectAdminBooking(id: string, reason?: string) {
  const token = await getAuthToken();
  const res = await api.patch(
    `/admin/bookings/${id}/reject`,
    { reason: reason || 'Admin từ chối' },
    {
      headers: { Authorization: `Bearer ${token}` },
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
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ----------------------------------------------------
// Admin Fields
// ----------------------------------------------------
export async function fetchAdminFields(params?: Record<string, any>) {
  const token = await getAuthToken();
  const res = await api.get('/admin/fields', {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchAdminFieldById(id: string) {
  const token = await getAuthToken();
  const res = await api.get(`/admin/fields/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createAdminField(data: any) {
  const token = await getAuthToken();
  const res = await api.post('/admin/fields', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateAdminField(id: string, data: any) {
  const token = await getAuthToken();
  const res = await api.patch(`/admin/fields/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data;
}

export async function deleteAdminField(id: string) {
  const token = await getAuthToken();
  const res = await api.delete(`/admin/fields/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
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
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

// ----------------------------------------------------
// Admin Price Rules
// ----------------------------------------------------
export async function createAdminPriceRule(fieldId: string, data: any) {
  const token = await getAuthToken();
  const res = await api.post(`/admin/fields/${fieldId}/price-rules`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateAdminPriceRule(
  fieldId: string,
  ruleId: string,
  data: any,
) {
  const token = await getAuthToken();
  const res = await api.patch(
    `/admin/fields/${fieldId}/price-rules/${ruleId}`,
    data,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data;
}

export async function deleteAdminPriceRule(fieldId: string, ruleId: string) {
  const token = await getAuthToken();
  const res = await api.delete(
    `/admin/fields/${fieldId}/price-rules/${ruleId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data;
}

// ----------------------------------------------------
// Admin Users
// ----------------------------------------------------
export async function fetchAdminUsers(params?: Record<string, any>) {
  const token = await getAuthToken();
  const res = await api.get('/admin/users', {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchAdminUserById(id: string) {
  const token = await getAuthToken();
  const res = await api.get(`/admin/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createAdminUser(data: any) {
  const token = await getAuthToken();
  const res = await api.post('/admin/users', data, {
    headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data;
}

export async function updateAdminUser(id: string, data: any) {
  const token = await getAuthToken();
  const res = await api.patch(`/admin/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}