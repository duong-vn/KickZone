/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Review, ReviewBookingProof } from '@/types/review';
import { StarRating } from './star-rating';
import { Button } from '@/components/ui/button';
import { formatFieldTypeName } from '@/lib/utils';

export interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rating: number;
    content: string;
    reviewId?: string;
  }) => Promise<void> | void;
  bookingProof?: ReviewBookingProof;
  initialReview?: Review | null; // For editing
}

function WriteReviewModalContent({
  onClose,
  onSubmit,
  bookingProof,
  initialReview,
}: Omit<WriteReviewModalProps, 'isOpen'>) {
  const [rating, setRating] = useState<number>(
    initialReview ? initialReview.rating : 5,
  );
  const [content, setContent] = useState<string>(
    initialReview ? initialReview.content : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(initialReview);
  const maxLength = 500;

  const effectiveBookingProof =
    bookingProof || initialReview?.booking || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá chất lượng sân.');
      return;
    }
    if (content.trim().length < 5) {
      setError('Vui lòng nhập nội dung đánh giá tối thiểu 5 ký tự.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        rating,
        content: content.trim(),
        reviewId: initialReview?.id,
      });
      if (isEditing) {
        toast.success('Đã cập nhật bài đánh giá thành công!');
        onClose();
      } else {
        setIsSuccess(true);
        toast.success('Cảm ơn bạn! Đánh giá đã được đăng thành công.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi đánh giá.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#bccbb9]/40 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCloseModal}
          aria-label="Đóng"
          className="absolute top-4 right-4 p-2 rounded-full text-[#575e70] hover:text-[#191c1d] hover:bg-[#f3f4f5] transition-colors cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          /* ==========================================
             SUCCESS STATE SCREEN
          ========================================== */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center animate-in fade-in-0 zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#22c55e]/15 text-[#006e2f] flex items-center justify-center mb-5">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h3 className="font-['Manrope'] font-extrabold text-2xl text-[#006e2f] mb-2">
              {isEditing
                ? 'Cập nhật thành công!'
                : 'Cảm ơn bạn đã gửi đánh giá!'}
            </h3>
            <p className="text-sm text-[#575e70] max-w-md mb-8 leading-relaxed">
              Đánh giá chất lượng chân thực của bạn sẽ giúp cộng đồng người chơi
              KickZone chọn được sân phù hợp nhất.
            </p>

            <Button
              type="button"
              onClick={handleCloseModal}
              className="bg-[#006e2f] hover:bg-[#004b1e] text-white font-semibold rounded-xl px-8 py-2.5 shadow-sm cursor-pointer"
            >
              Hoàn tất & Quay lại
            </Button>
          </div>
        ) : (
          /* ==========================================
             REVIEW FORM SCREEN
          ========================================== */
          <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="mb-6 pr-8">
              <h2 className="font-['Manrope'] font-extrabold text-2xl text-[#006e2f] mb-1">
                {isEditing ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
              </h2>
              <p className="text-xs sm:text-sm text-[#575e70]">
                Hãy chia sẻ trải nghiệm thực tế của bạn để giúp những người chơi
                khác.
              </p>
            </div>

            {/* Booking Summary Card if available */}
            {effectiveBookingProof && (
              <div className="flex items-center gap-4 p-3.5 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/40 mb-6">
                {effectiveBookingProof.fieldImage ? (
                  <img
                    src={effectiveBookingProof.fieldImage}
                    alt={effectiveBookingProof.fieldName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0 border border-[#bccbb9]/30"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-[#006e2f]/10 flex items-center justify-center text-[#006e2f] shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-['Manrope'] font-bold text-sm sm:text-base text-[#191c1d] truncate mb-1">
                    {effectiveBookingProof.fieldName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#575e70] mb-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#006e2f]" />
                    <span>Ngày đá: {effectiveBookingProof.matchDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#575e70]">
                    <Clock className="w-3.5 h-3.5 text-[#006e2f]" />
                    <span>
                      Khung giờ: {effectiveBookingProof.timeSlot} (
                      {formatFieldTypeName(effectiveBookingProof.fieldTypeName)}
                      )
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold rounded-xl mb-5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-2.5">
                  Chất lượng sân thi đấu{' '}
                  <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/40 flex flex-col items-center sm:items-start">
                  <StarRating
                    value={rating}
                    onChange={(val) => {
                      setRating(val);
                      if (error) setError(null);
                    }}
                    readonly={false}
                    size="xl"
                    showTextLabel={true}
                  />
                </div>
              </div>

              {/* 2. Textarea with character count */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="review-content"
                    className="text-xs font-bold text-[#191c1d] uppercase tracking-wider"
                  >
                    Nội dung đánh giá <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-[#575e70]">
                    {content.length}/{maxLength} ký tự
                  </span>
                </div>

                <textarea
                  id="review-content"
                  rows={4}
                  maxLength={maxLength}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Chia sẻ cảm nhận về mặt cỏ, ánh sáng đèn, thái độ nhân viên, bãi gửi xe, dịch vụ nước uống..."
                  className="w-full bg-white border border-[#bccbb9]/80 rounded-xl p-3.5 text-xs sm:text-sm text-[#191c1d] placeholder:text-[#575e70]/60 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20 transition-all resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#bccbb9]/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="rounded-xl px-5 text-xs font-semibold text-[#575e70] cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#006e2f] hover:bg-[#004b1e] text-white font-semibold rounded-xl px-6 text-xs shadow-sm cursor-pointer"
                >
                  {isSubmitting
                    ? 'Đang gửi...'
                    : isEditing
                      ? 'Lưu thay đổi'
                      : 'Gửi đánh giá'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export function WriteReviewModal(props: WriteReviewModalProps) {
  if (!props.isOpen) return null;
  return (
    <WriteReviewModalContent
      key={props.initialReview?.id ?? 'create-review'}
      {...props}
    />
  );
}
