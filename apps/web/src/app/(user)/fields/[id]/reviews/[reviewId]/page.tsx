/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  CheckCircle,
  Edit3,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  StarRating,
  ReviewCommentItem,
  WriteReviewModal,
  DeleteReviewDialog,
} from '@/components/reviews';
import { countTotalComments } from '@/types/review';
import { Button } from '@/components/ui/button';
import { formatFieldTypeName } from '@/lib/utils';
import {
  fetchFieldReviews,
  updateReview,
  deleteReview,
  checkReviewEligibility,
  createReviewComment,
  updateReviewComment,
  deleteReviewComment,
  fetchCurrentUserProfile,
} from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface PageProps {
  params: Promise<{ id: string; reviewId: string }>;
}

export default function ReviewDiscussionDetailPage({ params }: PageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const { id: fieldId, reviewId } = resolvedParams;

  // Auth user state
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    avatarUrl?: string | null;
    fullName?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (isMounted && data.user) {
          const userMeta = data.user.user_metadata || {};
          setCurrentUser({
            id: data.user.id,
            email: data.user.email,
            avatarUrl: userMeta.avatar_url || userMeta.picture || null,
            fullName:
              userMeta.full_name ||
              userMeta.name ||
              data.user.email?.split('@')[0] ||
              'Người dùng',
          });
        }
      } catch {
        // ignore
      }
    };
    void checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch current user profile from DB (for accurate name, role, avatar)
  const { data: userProfileData } = useQuery({
    queryKey: ['currentUserProfile', currentUser?.id],
    queryFn: () => fetchCurrentUserProfile(),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  const profileFromApi = userProfileData?.data ?? userProfileData;
  const currentProfile = profileFromApi?.id
    ? {
        id: profileFromApi.id,
        authUserId: profileFromApi.authUserId || currentUser?.id,
        fullName:
          profileFromApi.fullName || currentUser?.fullName || 'Người dùng',
        avatarUrl: profileFromApi.avatarUrl || currentUser?.avatarUrl || null,
        role: profileFromApi.role || 'USER',
      }
    : currentUser
      ? {
          id: currentUser.id,
          authUserId: currentUser.id,
          fullName: currentUser.fullName || 'Người dùng',
          avatarUrl: currentUser.avatarUrl || null,
          role: 'USER',
        }
      : null;

  // Fetch reviews for field
  const { data: reviewsResponse, isLoading } = useQuery({
    queryKey: ['field-reviews', fieldId],
    queryFn: () => fetchFieldReviews(fieldId),
  });

  // Check eligibility for reviews (to resolve profile id)
  const { data: eligibilityData } = useQuery({
    queryKey: ['review-eligibility', fieldId],
    queryFn: () => checkReviewEligibility(fieldId),
    enabled: !!currentUser,
    retry: false,
  });

  const effectiveCurrentUserId =
    currentProfile?.id || eligibilityData?.currentProfileId || currentUser?.id;

  const [newCommentText, setNewCommentText] = useState('');

  // Modals for editing / deleting current review
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Find the active review
  const currentReview = useMemo(() => {
    const list = reviewsResponse?.data || [];
    return list.find((r) => r.id === reviewId) || null;
  }, [reviewsResponse, reviewId]);

  const isOwner = Boolean(
    currentUser &&
    effectiveCurrentUserId &&
    (currentReview?.userId === effectiveCurrentUserId ||
      currentReview?.user?.id === effectiveCurrentUserId ||
      (currentReview as { authUserId?: string })?.authUserId ===
        effectiveCurrentUserId),
  );

  // Count all comments including nested replies recursively
  const commentsList = useMemo(
    () => currentReview?.comments || [],
    [currentReview],
  );
  const totalCommentsCount = useMemo(() => {
    return countTotalComments(commentsList);
  }, [commentsList]);

  const rawDate =
    currentReview?.createdAt ||
    (currentReview as { date?: string })?.date ||
    '';
  const formattedDate =
    typeof rawDate === 'string' && rawDate.includes('T')
      ? new Date(rawDate).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : rawDate || 'Gần đây';

  // Mutations for Review
  const updateReviewMutation = useMutation({
    mutationFn: (data: { rating?: number; content?: string }) =>
      updateReview(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-reviews', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['field', fieldId] });
      setIsEditModalOpen(false);
      toast.success('Đã cập nhật bài đánh giá thành công.');
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Không thể cập nhật bài đánh giá.';
      toast.error(message);
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: () => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-reviews', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['field', fieldId] });
      queryClient.invalidateQueries({
        queryKey: ['review-eligibility', fieldId],
      });
      toast.success('Đã xóa bài đánh giá thành công.');
      setIsDeleteDialogOpen(false);
      router.push(`/fields/${fieldId}/reviews`);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Không thể xóa bài đánh giá.';
      toast.error(message);
    },
  });

  // Mutations for Comments
  const createCommentMutation = useMutation({
    mutationFn: (input: { content: string; parentId?: string }) =>
      createReviewComment(reviewId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-reviews', fieldId] });
      toast.success('Đã gửi bình luận thành công!');
      setNewCommentText('');
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Không thể gửi bình luận.';
      toast.error(message);
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => updateReviewComment(commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-reviews', fieldId] });
      toast.success('Đã cập nhật bình luận.');
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Không thể cập nhật bình luận.';
      toast.error(message);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteReviewComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-reviews', fieldId] });
      toast.success('Đã xóa bình luận.');
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Không thể xóa bình luận.';
      toast.error(message);
    },
  });

  // Add a top-level comment
  const handleAddTopComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentReview) return;
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để tham gia bình luận.');
      return;
    }

    createCommentMutation.mutate({ content: newCommentText.trim() });
  };

  // Add a nested reply
  const handleAddReply = (parentId: string, content: string) => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để trả lời bình luận.');
      return;
    }

    createCommentMutation.mutate({ content, parentId });
  };

  // Edit comment handler
  const handleEditComment = (commentId: string, content: string) => {
    updateCommentMutation.mutate({ commentId, content });
  };

  // Delete comment handler
  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  // Edit review handler
  const handleUpdateReview = async (data: {
    rating: number;
    content: string;
  }) => {
    await updateReviewMutation.mutateAsync({
      rating: data.rating,
      content: data.content,
    });
  };

  // Delete review handler
  const handleConfirmDelete = async () => {
    await deleteReviewMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#e1e3e4]" />
          <div className="h-4 w-48 bg-[#e1e3e4] rounded" />
        </div>
      </div>
    );
  }

  if (!currentReview) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-['Manrope'] font-bold text-xl text-[#191c1d] mb-2">
            Không tìm thấy bài đánh giá
          </h2>
          <Link
            href={`/fields/${fieldId}/reviews`}
            className="text-xs font-semibold text-[#006e2f] hover:underline cursor-pointer"
          >
            Quay lại danh sách đánh giá
          </Link>
        </div>
      </div>
    );
  }

  const userAvatar = currentProfile?.avatarUrl;
  const userInitials = (currentProfile?.fullName || 'Bạn')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-6 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* 1. Breadcrumbs / Back navigation */}
        <nav className="flex flex-col gap-2 mb-6">
          <Link
            href={`/fields/${fieldId}/reviews`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#575e70] hover:text-[#006e2f] transition-colors w-fit cursor-pointer"
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

        {/* 2. Original Highlighted Review Card */}
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
                    {formatFieldTypeName(currentReview.booking?.fieldTypeName)}
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
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={currentProfile?.fullName || 'Avatar'}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#bccbb9]/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#006e2f] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {userInitials}
              </div>
            )}

            <div className="flex-1 flex flex-col gap-2.5">
              <textarea
                rows={3}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={
                  currentUser
                    ? 'Viết bình luận hoặc câu hỏi của bạn về bài đánh giá này...'
                    : 'Đăng nhập để tham gia bình luận...'
                }
                disabled={!currentUser}
                className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl p-3.5 text-xs sm:text-sm text-[#191c1d] placeholder:text-[#575e70]/60 focus:outline-none focus:bg-white focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20 transition-all resize-none disabled:opacity-60"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    !currentUser ||
                    createCommentMutation.isPending ||
                    !newCommentText.trim()
                  }
                  className="bg-[#006e2f] hover:bg-[#004b1e] text-white font-semibold rounded-xl px-5 text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi bình luận</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Nested Comments Thread */}
          {commentsList.length > 0 ? (
            <div className="space-y-6">
              {commentsList.map((comm) => (
                <div
                  key={comm.id}
                  className="pb-5 border-b border-[#bccbb9]/20 last:border-b-0 last:pb-0"
                >
                  <ReviewCommentItem
                    comment={comm}
                    onAddReply={handleAddReply}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    currentUserId={effectiveCurrentUserId}
                    currentUser={currentProfile}
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
          isLoading={deleteReviewMutation.isPending}
        />
      </div>
    </div>
  );
}
