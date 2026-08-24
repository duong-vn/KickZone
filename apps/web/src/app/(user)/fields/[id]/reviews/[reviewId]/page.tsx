/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  CheckCircle,
  Edit3,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Review } from '@/types/review';
import { INITIAL_MOCK_REVIEWS, CURRENT_USER } from '@/data/mock-reviews';
import {
  StarRating,
  ReviewCommentItem,
  WriteReviewModal,
  DeleteReviewDialog,
} from '@/components/reviews';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ id: string; reviewId: string }>;
}

export default function ReviewDiscussionDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id: fieldId, reviewId } = resolvedParams;

  // Local reviews store
  const [reviewsList, setReviewsList] =
    useState<Review[]>(INITIAL_MOCK_REVIEWS);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Modals for editing / deleting current review
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Find the active review
  const currentReview = useMemo(() => {
    return reviewsList.find((r) => r.id === reviewId) || reviewsList[0];
  }, [reviewsList, reviewId]);

  const isOwner =
    currentReview?.isOwner || currentReview?.userId === CURRENT_USER.id;

  // Count all comments including nested replies
  const totalCommentsCount = useMemo(() => {
    if (!currentReview) return 0;
    return currentReview.comments.reduce(
      (acc, c) => acc + 1 + (c.replies?.length || 0),
      0,
    );
  }, [currentReview]);

  const formattedDate = currentReview?.createdAt.includes('T')
    ? new Date(currentReview.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : currentReview?.createdAt || 'Gần đây';

  // Add a top-level comment
  const handleAddTopComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);

    const newComment = {
      id: `comm-${Date.now()}`,
      reviewId: currentReview.id,
      userId: CURRENT_USER.id,
      parentId: null,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      user: CURRENT_USER,
    };

    setReviewsList((prev) =>
      prev.map((r) =>
        r.id === currentReview.id
          ? { ...r, comments: [...r.comments, newComment] }
          : r,
      ),
    );

    setNewCommentText('');
    setIsSubmittingComment(false);
    toast.success('Đã gửi bình luận thành công!');
  };

  // Add a nested reply
  const handleAddReply = (
    parentId: string,
    content: string,
    replyToUserName: string,
  ) => {
    const newReply = {
      id: `comm-${Date.now()}`,
      reviewId: currentReview.id,
      userId: CURRENT_USER.id,
      parentId,
      replyToUserName,
      content,
      createdAt: new Date().toISOString(),
      user: CURRENT_USER,
    };

    setReviewsList((prev) =>
      prev.map((r) => {
        if (r.id !== currentReview.id) return r;
        const updated = r.comments.map((c) => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), newReply] };
          }
          return c;
        });
        return { ...r, comments: updated };
      }),
    );

    toast.success('Đã gửi phản hồi thành công!');
  };

  // Edit handler
  const handleUpdateReview = (data: { rating: number; content: string }) => {
    setReviewsList((prev) =>
      prev.map((r) =>
        r.id === currentReview.id
          ? {
              ...r,
              rating: data.rating,
              content: data.content,
              updatedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
    setIsEditModalOpen(false);
  };

  // Delete handler
  const handleConfirmDelete = () => {
    setReviewsList((prev) => prev.filter((r) => r.id !== currentReview.id));
    toast.success('Đã xóa bài đánh giá.');
    setIsDeleteDialogOpen(false);
    router.push(`/fields/${fieldId}/reviews`);
  };

  if (!currentReview) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-['Manrope'] font-bold text-xl text-[#191c1d] mb-2">
            Không tìm thấy bài đánh giá
          </h2>
          <Link
            href={`/fields/${fieldId}/reviews`}
            className="text-xs font-semibold text-[#006e2f] hover:underline"
          >
            Quay lại danh sách đánh giá
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-6 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* 1. Breadcrumbs / Back navigation */}
        <nav className="flex flex-col gap-2 mb-6">
          <Link
            href={`/fields/${fieldId}/reviews`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#575e70] hover:text-[#006e2f] transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại tất cả đánh giá</span>
          </Link>
          <ol className="flex items-center space-x-2 text-xs text-[#575e70]">
            <li>
              <Link href="/" className="hover:text-[#006e2f]">
                Trang chủ
              </Link>
            </li>
            <li className="text-[#bccbb9]">/</li>
            <li>
              <Link
                href={`/fields/${fieldId}`}
                className="hover:text-[#006e2f]"
              >
                Chi tiết sân
              </Link>
            </li>
            <li className="text-[#bccbb9]">/</li>
            <li>
              <Link
                href={`/fields/${fieldId}/reviews`}
                className="hover:text-[#006e2f]"
              >
                Đánh giá
              </Link>
            </li>
            <li className="text-[#bccbb9]">/</li>
            <li aria-current="page" className="font-bold text-[#191c1d]">
              Chi tiết thảo luận
            </li>
          </ol>
        </nav>

        {/* 2. Original Highlighted Review Card (Screen 4) */}
        <section className="bg-white border border-[#bccbb9]/50 rounded-2xl p-6 shadow-sm mb-8 relative">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {currentReview.user.avatarUrl ? (
              <img
                src={currentReview.user.avatarUrl}
                alt={currentReview.user.fullName}
                className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#bccbb9]/40"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#006e2f]/10 text-[#006e2f] font-bold text-base flex items-center justify-center shrink-0 border border-[#006e2f]/20">
                {currentReview.user.fullName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Manrope'] font-bold text-base text-[#191c1d]">
                      {currentReview.user.fullName}
                    </h3>
                    {isOwner && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#006e2f]/10 text-[#006e2f] border border-[#006e2f]/20">
                        Bạn
                      </span>
                    )}
                    {currentReview.verifiedBooking && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold bg-[#22c55e]/15 text-[#006e2f]">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Đã đặt sân
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#575e70] mt-1">
                    <StarRating
                      value={currentReview.rating}
                      size="sm"
                      color="pitch"
                    />
                    <span className="font-bold text-[#191c1d]">
                      {currentReview.rating.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Badges and Owner Action buttons */}
                <div className="flex items-center gap-2">
                  <span className="bg-[#22c55e]/15 text-[#006e2f] px-2.5 py-1 rounded-md text-xs font-bold font-['Manrope']">
                    {currentReview.booking?.fieldTypeName || 'Sân 7 người'}
                  </span>

                  {isOwner && (
                    <div className="flex items-center gap-1 border-l border-[#bccbb9]/40 pl-2">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        aria-label="Sửa đánh giá"
                        className="p-1.5 rounded-lg text-[#575e70] hover:text-[#006e2f] hover:bg-[#f3f4f5] transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        aria-label="Xóa đánh giá"
                        className="p-1.5 rounded-lg text-[#575e70] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Text content */}
              <p className="text-sm text-[#191c1d] leading-relaxed whitespace-pre-wrap mt-3 pt-3 border-t border-[#bccbb9]/20">
                {currentReview.content}
              </p>
            </div>
          </div>
        </section>

        {/* 3. Discussion & Comments Section */}
        <section className="bg-white border border-[#bccbb9]/40 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#bccbb9]/30">
            <h4 className="font-['Manrope'] font-bold text-lg text-[#191c1d] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#006e2f]" />
              <span>Chuỗi thảo luận ({totalCommentsCount})</span>
            </h4>
            <span className="text-xs text-[#575e70]">
              Mọi người cùng trao đổi công khai
            </span>
          </div>

          {/* Add New Comment Box */}
          <form
            onSubmit={handleAddTopComment}
            className="flex items-start gap-3 mb-8"
          >
            {CURRENT_USER.avatarUrl ? (
              <img
                src={CURRENT_USER.avatarUrl}
                alt={CURRENT_USER.fullName}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#bccbb9]/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#006e2f] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {CURRENT_USER.fullName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1 flex flex-col gap-2.5">
              <textarea
                rows={3}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Viết bình luận hoặc câu hỏi của bạn về bài đánh giá này..."
                className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl p-3.5 text-xs sm:text-sm text-[#191c1d] placeholder:text-[#575e70]/60 focus:outline-none focus:bg-white focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20 transition-all resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmittingComment || !newCommentText.trim()}
                  className="bg-[#006e2f] hover:bg-[#004b1e] text-white font-semibold rounded-xl px-5 text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi bình luận</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Nested Comments Thread */}
          {currentReview.comments.length > 0 ? (
            <div className="space-y-6">
              {currentReview.comments.map((comm) => (
                <div
                  key={comm.id}
                  className="pb-5 border-b border-[#bccbb9]/20 last:border-b-0 last:pb-0"
                >
                  <ReviewCommentItem
                    comment={comm}
                    onAddReply={handleAddReply}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/30">
              <p className="text-xs sm:text-sm text-[#575e70]">
                Chưa có bình luận nào. Hãy là người đầu tiên tham gia thảo luận!
              </p>
            </div>
          )}
        </section>

        {/* 4. Modals */}
        <WriteReviewModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateReview}
          initialReview={currentReview}
        />

        <DeleteReviewDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
}
