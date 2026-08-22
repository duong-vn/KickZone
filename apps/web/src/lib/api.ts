import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/fields${query ? `?${query}` : ''}`,
  );

  if (!res.ok) {
    throw new Error('Failed to fetch fields');
  }

  return res.json();
};
