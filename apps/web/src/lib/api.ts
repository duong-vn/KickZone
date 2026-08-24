import axios from 'axios';
import { Field, FieldsResponse } from '@/types/field';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

