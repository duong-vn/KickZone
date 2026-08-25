/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import {
  Reply,
  ShieldCheck,
  Send,
  Trash2,
  Edit3,
  X,
  Check,
} from 'lucide-react';
import type { ReviewComment } from '@/types/review';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ReviewCommentItemProps {
  comment: ReviewComment;
  onAddReply: (
    parentId: string,
    content: string,
    replyToUserName: string,
  ) => void;
  onDeleteComment?: (commentId: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  currentUserId?: string | null;
  currentUser?: {
    id: string;
    fullName?: string;
    avatarUrl?: string | null;
    role?: string;
  } | null;
  isNested?: boolean;
}

export function ReviewCommentItem({
  comment,
  onAddReply,
  onDeleteComment,
  onEditComment,
  currentUserId,
  currentUser,
  isNested = false,
}: ReviewCommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isAdmin = comment.user.role === 'ADMIN';
  const hasLoggedInUser = Boolean(currentUserId || currentUser?.id);
  const isOwner = Boolean(
    hasLoggedInUser &&
    ((currentUserId &&
      (comment.userId === currentUserId ||
        comment.user?.id === currentUserId)) ||
      (currentUser?.id &&
        (comment.userId === currentUser.id ||
          comment.user?.id === currentUser.id ||
          (comment as { authUserId?: string }).authUserId === currentUser.id ||
          (currentUser as { authUserId?: string }).authUserId ===
            comment.userId ||
          (currentUser as { authUserId?: string }).authUserId ===
            comment.user?.id))),
  );
  const canDelete =
    hasLoggedInUser && (isOwner || currentUser?.role === 'ADMIN');

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(comment.id, replyText.trim(), comment.user.fullName);
    setReplyText('');
    setShowReplyForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim() || !onEditComment) return;
    onEditComment(comment.id, editText.trim());
    setIsEditing(false);
  };

  const rawDate =
    comment.createdAt || (comment as { date?: string }).date || '';
  const formattedDate =
    typeof rawDate === 'string' && rawDate.includes('T')
      ? new Date(rawDate).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : rawDate || 'Gần đây';

  const userAvatar = currentUser?.avatarUrl;
  const userInitials = (currentUser?.fullName || 'Bạn')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn('relative group', isNested && 'ml-6 sm:ml-10 mt-3')}>
      {/* Visual Connecting Line for nested comments */}
      {isNested && (
        <>
          <div className="absolute -left-4 sm:-left-6 -top-3 bottom-4 w-[2px] bg-[#bccbb9]/50 rounded-bl-lg pointer-events-none" />
          <div className="absolute -left-4 sm:-left-6 top-4 w-3.5 sm:w-5 h-[2px] bg-[#bccbb9]/50 pointer-events-none" />
        </>
      )}

      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* Avatar */}
        {comment.user.avatarUrl ? (
          <img
            src={comment.user.avatarUrl}
            alt={comment.user.fullName}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0 border border-[#bccbb9]/40"
          />
        ) : (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#006e2f]/10 text-[#006e2f] font-bold text-xs flex items-center justify-center shrink-0 border border-[#006e2f]/20">
            {comment.user.fullName.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Comment Bubble */}
          <div className="bg-[#f3f4f5] rounded-xl p-3 sm:p-3.5 border border-[#bccbb9]/30">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="font-bold text-xs sm:text-sm text-[#191c1d]">
                {comment.user.fullName}
              </span>
              {isOwner && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#006e2f]/10 text-[#006e2f] border border-[#006e2f]/20">
                  Bạn
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1 bg-[#006e2f] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Quản lý Sân
                </span>
              )}
              <span className="text-[11px] text-[#575e70] ml-auto">
                {formattedDate}
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
                <textarea
                  rows={2}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-white border border-[#bccbb9]/80 rounded-lg p-2 text-xs text-[#191c1d] focus:outline-none focus:border-[#006e2f] focus:ring-1 focus:ring-[#006e2f] resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.content);
                    }}
                    className="text-xs text-[#575e70]"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="xs"
                    disabled={!editText.trim()}
                    className="bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-semibold"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Lưu
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-xs sm:text-sm text-[#191c1d] leading-relaxed whitespace-pre-wrap">
                {comment.replyToUserName && (
                  <span className="text-[#006e2f] font-semibold mr-1.5">
                    @{comment.replyToUserName}
                  </span>
                )}
                {comment.content}
              </p>
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-3 mt-1.5 ml-2">
            <button
              type="button"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#575e70] hover:text-[#006e2f] transition-colors cursor-pointer"
            >
              <Reply className="w-3 h-3" />
              <span>{showReplyForm ? 'Đóng' : 'Trả lời'}</span>
            </button>

            {isOwner && onEditComment && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#575e70] hover:text-[#006e2f] transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Sửa</span>
              </button>
            )}

            {canDelete && onDeleteComment && (
              <button
                type="button"
                onClick={() => onDeleteComment(comment.id)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#575e70] hover:text-[#ba1a1a] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            )}
          </div>

          {/* Inline Reply Form */}
          {showReplyForm && (
            <form
              onSubmit={handleSendReply}
              className="mt-3 flex items-start gap-2 animate-in fade-in-0 duration-200"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={currentUser?.fullName || 'Avatar'}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#bccbb9]/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#006e2f] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {userInitials}
                </div>
              )}
              <div className="flex-1 flex flex-col gap-1.5">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Phản hồi @${comment.user.fullName}...`}
                  className="w-full bg-white border border-[#bccbb9]/80 rounded-lg px-3 py-1.5 text-xs text-[#191c1d] placeholder:text-[#575e70]/70 focus:outline-none focus:border-[#006e2f] focus:ring-1 focus:ring-[#006e2f]"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowReplyForm(false)}
                    className="text-xs text-[#575e70]"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="xs"
                    disabled={!replyText.trim()}
                    className="bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-semibold"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Gửi
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Nested Replies List */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-3">
              {comment.replies.map((reply) => (
                <ReviewCommentItem
                  key={reply.id}
                  comment={reply}
                  onAddReply={onAddReply}
                  onDeleteComment={onDeleteComment}
                  onEditComment={onEditComment}
                  currentUserId={currentUserId}
                  currentUser={currentUser}
                  isNested={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
