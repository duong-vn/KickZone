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