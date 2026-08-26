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

  const hasReplies = Boolean(comment.replies && comment.replies.length > 0);

  return (
    <div className="relative group">
      {/* Curved connector for nested comment items */}
      {isNested && (
        <div
          aria-hidden="true"
          className="absolute -left-3.5 sm:-left-5 top-4 w-3 sm:w-4.5 h-3.5 border-b-2 border-l-2 border-[#bccbb9]/60 rounded-bl-xl pointer-events-none"
        />
      )}

      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* Avatar */}
        {comment.user.avatarUrl ? (
          <img
            src={comment.user.avatarUrl}
            alt={comment.user.fullName}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 border border-[#bccbb9]/50 shadow-2xs mt-0.5"
          />
        ) : (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#006e2f]/10 text-[#006e2f] font-bold text-xs flex items-center justify-center shrink-0 border border-[#006e2f]/20 shadow-2xs mt-0.5">
            {comment.user.fullName.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Comment Bubble */}
          <div className="bg-[#f8f9fa] hover:bg-white border border-[#bccbb9]/40 hover:border-[#006e2f]/30 rounded-2xl p-3 sm:p-3.5 shadow-2xs transition-all">
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1.5">
              <span className="font-['Manrope'] font-bold text-xs sm:text-[13px] text-[#191c1d]">
                {comment.user.fullName}
              </span>
              {isOwner && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#006e2f]/10 text-[#006e2f] border border-[#006e2f]/20">
                  Bạn
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1 bg-[#006e2f] text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-2xs">
                  <ShieldCheck className="w-3 h-3" />
                  Quản lý Sân
                </span>
              )}
              <span className="text-[11px] text-[#72796f] ml-auto">
                {formattedDate}
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
                <textarea
                  rows={2}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-white border border-[#bccbb9]/80 rounded-xl p-2.5 text-xs text-[#191c1d] focus:outline-none focus:border-[#006e2f] focus:ring-1 focus:ring-[#006e2f] resize-none"
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
                    className="text-xs text-[#575e70] rounded-lg"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="xs"
                    disabled={!editText.trim()}
                    className="bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-semibold rounded-lg"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Lưu
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-xs sm:text-[13px] text-[#191c1d] leading-relaxed whitespace-pre-wrap">
                {comment.replyToUserName && (
                  <span className="inline-flex items-center text-[#006e2f] bg-[#006e2f]/10 font-bold px-1.5 py-0.5 rounded-md text-xs mr-1.5 hover:bg-[#006e2f]/20 transition-colors">
                    @{comment.replyToUserName}
                  </span>
                )}
                {comment.content}
              </p>
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-1 mt-1 ml-1">
            <button
              type="button"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#575e70] hover:text-[#006e2f] hover:bg-[#006e2f]/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <Reply className="w-3 h-3" />
              <span>{showReplyForm ? 'Đóng' : 'Trả lời'}</span>
            </button>

            {isOwner && onEditComment && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#575e70] hover:text-[#006e2f] hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Sửa</span>
              </button>
            )}

            {canDelete && onDeleteComment && (
              <button
                type="button"
                onClick={() => onDeleteComment(comment.id)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#575e70] hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
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
              className="mt-2.5 p-3 rounded-2xl bg-[#f8f9fa] border border-[#006e2f]/30 shadow-xs flex items-start gap-2 animate-in fade-in-0 duration-200"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={currentUser?.fullName || 'Avatar'}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#bccbb9]/40 mt-0.5"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#006e2f] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {userInitials}
                </div>
              )}
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Phản hồi @${comment.user.fullName}...`}
                  className="w-full bg-white border border-[#bccbb9]/80 rounded-xl px-3 py-1.5 text-xs text-[#191c1d] placeholder:text-[#575e70]/70 focus:outline-none focus:border-[#006e2f] focus:ring-1 focus:ring-[#006e2f]"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowReplyForm(false)}
                    className="text-xs text-[#575e70] rounded-lg"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="xs"
                    disabled={!replyText.trim()}
                    className="bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-semibold rounded-lg"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Gửi
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Nested Replies with Continuous Left Tree Line */}
          {hasReplies && (
            <div className="relative mt-3 pl-3.5 sm:pl-5 ml-2.5 sm:ml-3 border-l-2 border-[#bccbb9]/50 space-y-3">
              {comment.replies!.map((reply) => (
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
