import axios from 'axios';
import { getSupabaseBrowserClient } from './supabase';
import type {
  FavoritesResponse,
  ToggleFavoriteResponse,
} from '@/types/favorite';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
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
) => {
  const cleanParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = String(value);
    }
  });

  const query = new URLSearchParams(cleanParams).toString();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/fields${query ? `?${query}` : ''}`,
  );

  if (!res.ok) {
    throw new Error('Failed to fetch fields');
  }

  return res.json();
};

export const fetchFieldById = async (id: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/fields/${id}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch field ${id}`);
  }

  return res.json();
};

export const fetchFieldTypes = async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/field-types`,
  );

  if (!res.ok) {
    throw new Error('Failed to fetch field types');
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

export async function fetchAdminBookingCalendar(from?: string, to?: string) {
  const token = await getAuthToken();
  const res = await api.get('/admin/bookings/calendar', {
    params: { from, to },
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
