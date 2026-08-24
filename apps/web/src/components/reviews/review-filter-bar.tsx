'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ArrowUpDown } from 'lucide-react';
import type { ReviewStarFilter, ReviewSortOption } from '@/types/review';
import { cn } from '@/lib/utils';

export interface ReviewFilterBarProps {
  selectedStar: ReviewStarFilter;
  onStarChange: (star: ReviewStarFilter) => void;
  selectedSort: ReviewSortOption;
  onSortChange: (sort: ReviewSortOption) => void;
  starCounts?: Record<number, number>;
  totalCount?: number;
  className?: string;
}

const STAR_OPTIONS: { label: string; value: ReviewStarFilter }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: '5 sao', value: 5 },
  { label: '4 sao', value: 4 },
  { label: '3 sao', value: 3 },
  { label: '2 sao', value: 2 },
  { label: '1 sao', value: 1 },
];

const SORT_OPTIONS: { label: string; value: ReviewSortOption }[] = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'Điểm cao nhất', value: 'highest' },
  { label: 'Điểm thấp nhất', value: 'lowest' },
];

export function ReviewFilterBar({
  selectedStar,
  onStarChange,
  selectedSort,
  onSortChange,
  starCounts,
  totalCount,
  className,
}: ReviewFilterBarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.value === selectedSort)?.label || 'Mới nhất';

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2',
        className,
      )}
    >
      {/* 1. Star Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {STAR_OPTIONS.map((opt) => {
          const isActive = selectedStar === opt.value;
          const count =
            opt.value === 'all'
              ? totalCount
              : starCounts
                ? starCounts[opt.value]
                : undefined;

          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onStarChange(opt.value)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5',
                isActive
                  ? 'bg-[#006e2f] text-white shadow-sm ring-2 ring-[#006e2f]/20'
                  : 'bg-white border border-[#bccbb9]/60 text-[#3d4a3d] hover:bg-[#f3f4f5] hover:border-[#006e2f]/50',
              )}
            >
              <span>{opt.label}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#edeeef] text-[#575e70]',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Custom Sleek Sort Dropdown (No raw select) */}
      <div className="relative w-full sm:w-auto min-w-[200px]" ref={sortRef}>
        <button
          type="button"
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="w-full sm:w-auto flex items-center justify-between gap-3 bg-white border border-[#bccbb9]/60 rounded-xl px-4 py-2 text-xs font-semibold text-[#191c1d] shadow-sm hover:border-[#006e2f] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20"
        >
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#575e70]" />
            <span className="text-[#575e70] font-normal">Sắp xếp:</span>
            <span className="text-[#006e2f] font-bold">{currentSortLabel}</span>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[#575e70] transition-transform duration-200',
              isSortOpen && 'rotate-180',
            )}
          />
        </button>

        {isSortOpen && (
          <div className="absolute right-0 mt-1.5 w-full sm:w-52 bg-white rounded-xl border border-[#bccbb9]/50 shadow-lg py-1.5 z-30 animate-in fade-in-0 zoom-in-95">
            <div className="px-3 py-1 text-[11px] font-bold text-[#575e70] uppercase tracking-wider">
              Tiêu chí sắp xếp
            </div>
            {SORT_OPTIONS.map((sort) => {
              const isSelected = selectedSort === sort.value;
              return (
                <button
                  key={sort.value}
                  type="button"
                  onClick={() => {
                    onSortChange(sort.value);
                    setIsSortOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[#22c55e]/10 text-[#006e2f] font-bold'
                      : 'text-[#191c1d] hover:bg-[#f8f9fa]',
                  )}
                >
                  <span>{sort.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#006e2f]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
