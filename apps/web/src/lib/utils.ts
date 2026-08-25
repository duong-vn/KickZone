import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFieldTypeName(
  name?: string | { name?: string } | null,
): string {
  if (!name) return 'Sân 7 người';
  const str = typeof name === 'object' ? name.name : name;
  if (!str) return 'Sân 7 người';
  const clean = str.toLowerCase().trim();
  if (clean === '5-a-side' || clean === '5' || clean.includes('5')) {
    return 'Sân 5 người';
  }
  if (clean === '7-a-side' || clean === '7' || clean.includes('7')) {
    return 'Sân 7 người';
  }
  if (clean === '11-a-side' || clean === '11' || clean.includes('11')) {
    return 'Sân 11 người';
  }
  return str;
}
