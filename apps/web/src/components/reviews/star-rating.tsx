'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StarRatingProps {
  value: number; // 0 to 5 (e.g. 4.8 or integer)
  onChange?: (value: number) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  readonly?: boolean;
  color?: 'pitch' | 'amber';
  showTextLabel?: boolean;
  className?: string;
}

const RATING_LABELS = [
  '',
  'Tệ',
  'Không hài lòng',
  'Bình thường',
  'Hài lòng',
  'Rất tuyệt vời',
];

export function StarRating({
  value,
  onChange,
  size = 'sm',
  readonly = true,
  color = 'pitch',
  showTextLabel = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const activeValue = hoverValue !== null ? hoverValue : value;

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9',
  };

  const starColor =
    color === 'pitch'
      ? {
          fill: 'fill-[#006e2f] text-[#006e2f]',
          half: 'text-[#006e2f]',
          empty: 'text-[#bccbb9]/60',
        }
      : {
          fill: 'fill-[#f59e0b] text-[#f59e0b]',
          half: 'text-[#f59e0b]',
          empty: 'text-[#bccbb9]/60',
        };

  // Interactive picker mode
  if (!readonly && onChange) {
    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        <div
          className="flex items-center gap-1.5"
          onMouseLeave={() => setHoverValue(null)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = activeValue >= star;
            return (
              <button
                key={star}
                type="button"
                aria-label={`Chọn ${star} sao - ${RATING_LABELS[star]}`}
                onClick={() => onChange(star)}
                onMouseEnter={() => setHoverValue(star)}
                className="cursor-pointer transition-transform hover:scale-115 focus:outline-none active:scale-95 p-0.5"
              >
                <Star
                  className={cn(
                    sizeClasses[size],
                    'transition-colors duration-150',
                    isFilled
                      ? 'fill-[#eab308] text-[#eab308]'
                      : 'text-[#bccbb9] hover:text-[#eab308]',
                  )}
                />
              </button>
            );
          })}
        </div>
        {showTextLabel && (
          <span className="text-xs font-semibold text-[#006e2f] min-h-[18px]">
            {activeValue > 0
              ? RATING_LABELS[activeValue]
              : 'Vui lòng chọn mức độ hài lòng'}
          </span>
        )}
      </div>
    );
  }

  // Display only mode
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fillDifference = value - (star - 1);
          const isFull = fillDifference >= 0.75;
          const isHalf = fillDifference >= 0.25 && fillDifference < 0.75;

          if (isFull) {
            return (
              <Star
                key={star}
                className={cn(sizeClasses[size], starColor.fill)}
              />
            );
          }

          if (isHalf) {
            return (
              <div key={star} className="relative inline-block">
                <Star className={cn(sizeClasses[size], starColor.empty)} />
                <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                  <Star className={cn(sizeClasses[size], starColor.fill)} />
                </div>
              </div>
            );
          }

          return (
            <Star
              key={star}
              className={cn(sizeClasses[size], starColor.empty)}
            />
          );
        })}
      </div>
      {showTextLabel && (
        <span className="text-xs font-bold text-[#191c1d] ml-1">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
