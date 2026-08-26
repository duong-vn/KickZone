/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  Reply,
  Edit3,
  Trash2,
  CheckCircle,
  ArrowUpRight,
  Send,
} from 'lucide-react';
import { type Review, countTotalComments } from '@/types/review';
import { StarRating } from './star-rating';
import { ReviewCommentItem } from './review-comment-item';
import { Button } from '@/components/ui/button';
import { cn, formatFieldTypeName } from '@/lib/utils';

export interface ReviewCardProps {
  review: Review;
  currentUserId?: string | null;
  currentUser?: {
    id: string;
    fullName?: string;
    avatarUrl?: string | null;
    role?: string;
  } | null;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onAddComment?: (
    reviewId: string,
    content: string,
    parentId?: string,
    replyToUserName?: string,
  ) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  fieldId?: string;
  defaultExpandedComments?: boolean;
  className?: string;
}

export function ReviewCard({
  review,
  currentUserId,
  currentUser,
  onEdit,
  onDelete,
  onAddComment,
  onEditComment,
  onDeleteComment,
  fieldId,
  defaultExpandedComments = false,
  className,
}: ReviewCardProps) {
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(
    defaultExpandedComments,
  );
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [commentText, setCommentText] = useState('');

  const hasLoggedInUser = Boolean(currentUserId || currentUser?.id);
  const isOwner = Boolean(
    hasLoggedInUser &&
    ((currentUserId &&
      (review.userId === currentUserId ||
        review.user?.id === currentUserId ||
        (review as { profiles?: { id?: string } }).profiles?.id ===
          currentUserId)) ||
      (currentUser?.id &&
        (review.userId === currentUser.id ||
          review.user?.id === currentUser.id ||
          (review as { authUserId?: string }).authUserId === currentUser.id ||
          (currentUser as { authUserId?: string }).authUserId ===
            review.userId ||
          (currentUser as { authUserId?: string }).authUserId ===
            review.user?.id))),
  );

  // Recursively count all comments and replies
  const commentsList = review.comments || [];
  const totalCommentsCount = countTotalComments(commentsList);

  const rawDate = review.createdAt || (review as { date?: string }).date || '';
  const formattedDate =
    typeof rawDate === 'string' && rawDate.includes('T')
      ? new Date(rawDate).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : rawDate || 'Gần đây';

  const router = useRouter();
  const pathname = usePathname();

  const handleReplyClick = () => {
    if (!hasLoggedInUser) {
      const currentPath =
        typeof window !== 'undefined'
          ? pathname || window.location.pathname
          : '';
      toast.info('Vui lòng đăng nhập để gửi bình luận.', {
        action: {
          label: 'Đăng nhập',
          onClick: () => {
            router.push(
              currentPath
                ? `/login?redirect=${encodeURIComponent(currentPath)}`
                : '/login',
            );
          },
        },
      });
      return;
    }
    setShowReplyBox((prev) => !prev);
    setIsCommentsExpanded(true);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !onAddComment) return;
    onAddComment(review.id, commentText.trim());
    setCommentText('');
    setShowReplyBox(false);
    setIsCommentsExpanded(true);
  };

  const handleAddNestedReply = (
    parentId: string,
    content: string,
    replyToUserName: string,
  ) => {
    if (onAddComment) {
      onAddComment(review.id, content, parentId, replyToUserName);
    }
  };

  const currentFieldId = fieldId || review.fieldId || '1';
  const userAvatar = currentUser?.avatarUrl;
  const userInitials = (currentUser?.fullName || 'Bạn')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        'bg-white p-5 rounded-2xl border border-[#bccbb9]/40 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#006e2f]/30',
        className,
      )}
    >
      {/* 1. Header: User Info, Rating & Owner Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          {review.user.avatarUrl ? (
            <img
              src={review.user.avatarUrl}
              alt={review.user.fullName}
              className="w-10 h-10 rounded-full object-cover border border-[#bccbb9]/40"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#006e2f]/10 text-[#006e2f] font-bold text-sm flex items-center justify-center border border-[#006e2f]/20">
              {review.user.fullName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h4 className="font-['Manrope'] font-bold text-sm text-[#191c1d]">
                {review.user.fullName}
              </h4>
              {isOwner && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#006e2f]/10 text-[#006e2f] border border-[#006e2f]/20">
                  Bạn
                </span>
              )}
              {review.verifiedBooking && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold bg-[#22c55e]/15 text-[#006e2f]">
                  <CheckCircle className="w-2.5 h-2.5" />
                  Đã đặt sân
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#575e70] mt-0.5">
              {formattedDate}
              {review.booking?.fieldTypeName &&
                ` • ${formatFieldTypeName(review.booking.fieldTypeName)}`}
            </div>
          </div>
        </div>

        {/* Rating Stars & Owner Edit/Delete Controls */}
        <div className="flex items-center gap-3 ml-auto sm:ml-0">
          <StarRating value={review.rating} size="sm" color="pitch" />

          {isOwner && (
            <div className="flex items-center gap-1 border-l border-[#bccbb9]/40 pl-2.5 ml-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(review)}
                  aria-label="Chỉnh sửa đánh giá"
                  className="p-1 rounded-lg text-[#575e70] hover:text-[#006e2f] hover:bg-[#f3f4f5] transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(review)}
                  aria-label="Xóa đánh giá"
                  className="p-1 rounded-lg text-[#575e70] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Review Content */}
      <p className="text-xs sm:text-sm text-[#3d4a3d] leading-relaxed whitespace-pre-wrap mb-4">
        {review.content}
      </p>

      {/* 3. Bottom Inline Comments Bar (Screen 1 & Screen 2) */}
      <div className="pt-3 border-t border-[#bccbb9]/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {totalCommentsCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006e2f] hover:underline cursor-pointer"
            >
              {isCommentsExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Ẩn {totalCommentsCount} bình luận</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Xem {totalCommentsCount} bình luận</span>
                </>
              )}
            </button>
          ) : (
            <span className="text-xs text-[#575e70]">Chưa có bình luận</span>
          )}

          <button
            type="button"
            onClick={handleReplyClick}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#575e70] hover:text-[#006e2f] transition-colors cursor-pointer ml-1"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Trả lời</span>
          </button>
        </div>

        {/* Link to Full Discussion View */}
        <Link
          href={`/fields/${currentFieldId}/reviews/${review.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#575e70] hover:text-[#006e2f] transition-colors"
        >
          <span>Chi tiết thảo luận</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. Inline Reply Input Form */}
      {showReplyBox && hasLoggedInUser && (
        <form
          onSubmit={handleSendComment}
          className="mt-3.5 flex items-start gap-2.5 p-3 bg-[#f8f9fa] rounded-xl border border-[#bccbb9]/40 animate-in fade-in-0 duration-200"
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={currentUser?.fullName || 'Avatar'}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#bccbb9]/40"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#006e2f] text-white text-xs font-bold flex items-center justify-center shrink-0">
              {userInitials}
            </div>
          )}

          <div className="flex-1 flex flex-col gap-2">
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận cho đánh giá này..."
              className="w-full bg-white border border-[#bccbb9]/60 rounded-lg p-2.5 text-xs text-[#191c1d] placeholder:text-[#575e70]/70 focus:outline-none focus:border-[#006e2f] focus:ring-1 focus:ring-[#006e2f] resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowReplyBox(false)}
                className="text-xs text-[#575e70]"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="xs"
                disabled={!commentText.trim()}
                className="bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-semibold"
              >
                <Send className="w-3 h-3 mr-1" />
                Gửi bình luận
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* 5. Expanded Comments Thread (Screen 1 & 4) */}
      {isCommentsExpanded && commentsList.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-[#bccbb9]/20 space-y-3.5">
          {commentsList.map((comm) => (
            <ReviewCommentItem
              key={comm.id}
              comment={comm}
              onAddReply={handleAddNestedReply}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              currentUserId={currentUserId}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
