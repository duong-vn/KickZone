import type { ReactNode } from 'react';

export const adminFilterControlClass =
  'h-10 w-full rounded-xl border border-[#bccbb9] bg-white px-3 text-sm text-[#191c1d] outline-none transition placeholder:text-[#8a9188] hover:border-[#8ca18c] focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10';

type AdminFilterBarProps = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function AdminFilterBar({
  children,
  className = '',
  ariaLabel = 'Bộ lọc danh sách',
}: AdminFilterBarProps) {
  return (
    <section
      aria-label={ariaLabel}
      className="rounded-2xl border border-[#bccbb9] bg-white p-4 shadow-[0_2px_5px_rgba(0,0,0,0.04)]"
    >
      <div className={`grid gap-3 ${className}`}>{children}</div>
    </section>
  );
}
