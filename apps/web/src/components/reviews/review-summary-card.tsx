'use client';

import { Star, MessageSquarePlus } from 'lucide-react';
import type { ReviewSummary } from '@/types/review';
import { StarRating } from './star-rating';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ReviewSummaryCardProps {
  summary: ReviewSummary;
  onWriteReview?: () => void;
  showWriteButton?: boolean;
  className?: string;
  isSticky?: boolean;
}

export function ReviewSummaryCard({
  summary,
  onWriteReview,
  showWriteButton = true,
  className,
  isSticky = false,
}: ReviewSummaryCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-6 border border-[#bccbb9]/40 shadow-sm',
        isSticky && 'sticky top-24',
        className,
      )}
    >
      <h3 className="font-['Manrope'] font-bold text-lg text-[#191c1d] mb-4">
        Tổng quan đánh giá
      </h3>

      {/* Average Score & Stars */}
      <div className="flex flex-col items-center justify-center p-4 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/20 mb-6 text-center">
        <div className="font-['Manrope'] font-extrabold text-4xl sm:text-5xl text-[#191c1d] tracking-tight mb-1">
          {summary.averageRating.toFixed(1)}
        </div>
        <div className="mb-1.5">
          <StarRating value={summary.averageRating} size="md" color="pitch" />
        </div>
        <p className="text-xs text-[#575e70] font-medium">
          Dựa trên {summary.totalReviews} đánh giá từ người chơi đã đặt sân
        </p>
      </div>

      {/* Star Progress Bars */}
      <div className="space-y-3 mb-6">
        {summary.breakdown.map((row) => (
          <div key={row.star} className="flex items-center gap-2.5 text-xs">
            <span className="w-10 text-right font-semibold text-[#575e70] flex items-center justify-end gap-1">
              {row.star}
              <Star className="w-3 h-3 fill-[#006e2f] text-[#006e2f]" />
            </span>
            <div className="flex-1 h-2.5 bg-[#e1e3e4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#006e2f] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${row.percentage}%` }}
              />
            </div>
            <span className="w-7 text-right text-xs font-semibold text-[#191c1d]">
              {row.count}
            </span>
          </div>
        ))}
      </div>

      {/* Optional Write Review CTA */}
      {showWriteButton && onWriteReview && (
        <Button
          onClick={onWriteReview}
          className="w-full bg-[#006e2f] hover:bg-[#004b1e] text-white font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Viết đánh giá của tôi</span>
        </Button>
      )}
    </div>
  );
}
