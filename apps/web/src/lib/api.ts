import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchFields = async (params: Record<string, any>) => {
  // Loại bỏ các param rỗng
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== '')
  );
  const query = new URLSearchParams(cleanParams).toString();
  
  // URL tùy thuộc vào cấu hình API của bạn (thường là http://localhost:3000 hoặc /api)
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/fields?${query}`);
  
  if (!res.ok) throw new Error('Failed to fetch fields');
  return res.json();
};
