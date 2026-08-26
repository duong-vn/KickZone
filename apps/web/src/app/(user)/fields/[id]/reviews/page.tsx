'use client';

import { useState, useMemo, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  StarOff,
  AlertCircle,
  RotateCcw,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  Review,
  ReviewFilterState,
  ReviewStarFilter,
  ReviewSortOption,
} from '@/types/review';
import {
  calculateReviewSummary,
  filterAndSortReviews,
} from '@/data/mock-reviews';
import {
  ReviewSummaryCard,
  ReviewFilterBar,
  ReviewCard,
  WriteReviewModal,
  DeleteReviewDialog,
} from '@/components/reviews';
import { Button } from '@/components/ui/button';
import {
  fetchFieldById,
  fetchFieldReviews,
  createReview,
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
  params: Promise<{ id: string }>;
}

export default function FieldAllReviewsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const fieldId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch field info
  const {
    data: fieldResponse,
    isLoading: isFieldLoading,
    isError: isFieldError,
    refetch: refetchField,
  } = useQuery({
    queryKey: ['field', fieldId],
    queryFn: () => fetchFieldById(fieldId),
    retry: (failureCount, err: unknown) => {
      const errorObj = err as { status?: number };
      if (errorObj?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const field = fieldResponse?.data;

  // Fetch reviews from API
  const { data: reviewsResponse, isLoading: isReviewsLoading } = useQuery({
    queryKey: ['field-reviews', fieldId],
    queryFn: () => fetchFieldReviews(fieldId),
    enabled: !!field,
  });

  // Auth state
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
        if (!isMounted) return;
        if (data.user) {
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
        } else {
          setCurrentUser(null);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      }
    };
    void checkAuth();
    return () => {
      isMounted = false;
    };
  }, [fieldId]);

  // Check eligibility for reviews
  const { data: eligibilityData } = useQuery({
    queryKey: ['review-eligibility', fieldId],
    queryFn: () => checkReviewEligibility(fieldId),
    enabled: !!currentUser && !!field,
    retry: false,
  });

  // Fetch current user profile
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

  const effectiveCurrentUserId = currentUser
    ? currentProfile?.id || eligibilityData?.currentProfileId || currentUser.id
    : null;

  const [showEligibilityDialog, setShowEligibilityDialog] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState<
    'not_logged_in' | 'no_completed_booking' | 'already_reviewed'
  >('not_logged_in');

  // Comment Mutations
  const createCommentMutation = useMutation({
    mutationFn: ({
      reviewId,
      content,
      parentId,
    }: {
      reviewId: string;
      content: string;
      parentId?: string;
    }) => createReviewComment(reviewId, { content, parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-reviews', fieldId] });
      toast.success('Đã gửi bình luận thành công!');
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

  // Review Mutations
  const createReviewMutation = useMutation({
    mutationFn: (data: {
      rating: number;
      content: string;
      bookingId?: string;
    }) => createReview(fieldId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-reviews', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['field', fieldId] });
      queryClient.invalidateQueries({
        queryKey: ['review-eligibility', fieldId],
      });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: string;
      data: { rating?: number; content?: string };
    }) => updateReview(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-reviews', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['field', fieldId] });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-reviews', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['field', fieldId] });
      queryClient.invalidateQueries({
        queryKey: ['review-eligibility', fieldId],
      });
      toast.success('Đã xóa bài đánh giá thành công.');
      setDeletingReview(null);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Không thể xóa bài đánh giá.';
      toast.error(message);
    },
  });

  const reviewsList = useMemo(() => {
    if (reviewsResponse?.data && reviewsResponse.data.length > 0) {
      return reviewsResponse.data;
    }
    if (field?.reviews && field.reviews.length > 0) {
      return field.reviews;
    }
    return [];
  }, [reviewsResponse, field]);

  // Filter and Sort state
  const [starFilter, setStarFilter] = useState<ReviewStarFilter>('all');
  const [sortOption, setSortOption] = useState<ReviewSortOption>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 4;

  // Modal states
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  // Summary calculation
  const summary = useMemo(() => {
    if (reviewsResponse?.summary) {
      return reviewsResponse.summary;
    }
    return calculateReviewSummary(reviewsList);
  }, [reviewsResponse, reviewsList]);

  // Star counts mapping for filter pills
  const starCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((r: Review) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviewsList]);

  // Filtered & Paginated items
  const { items: currentReviews, totalPages } = useMemo(() => {
    const filterState: ReviewFilterState = {
      star: starFilter,
      sortBy: sortOption,
      page: currentPage,
      limit: pageSize,
    };
    return filterAndSortReviews(reviewsList, filterState);
  }, [reviewsList, starFilter, sortOption, currentPage, pageSize]);

  // Handlers
  const handleStarChange = (star: ReviewStarFilter) => {
    setStarFilter(star);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: ReviewSortOption) => {
    setSortOption(sort);
    setCurrentPage(1);
  };

  const handleOpenWriteReview = () => {
    if (!currentUser) {
      setEligibilityReason('not_logged_in');
      setShowEligibilityDialog(true);
      return;
    }

    if (eligibilityData && !eligibilityData.canReview) {
      setEligibilityReason(
        eligibilityData.reason === 'already_reviewed'
          ? 'already_reviewed'
          : 'no_completed_booking',
      );
      setShowEligibilityDialog(true);
      return;
    }

    setEditingReview(null);
    setIsWriteModalOpen(true);
  };

  const handleCreateOrUpdateReview = async (data: {
    rating: number;
    content: string;
    reviewId?: string;
  }) => {
    if (!field) return;
    if (data.reviewId) {
      await updateReviewMutation.mutateAsync({
        reviewId: data.reviewId,
        data: { rating: data.rating, content: data.content },
      });
      setIsWriteModalOpen(false);
      setEditingReview(null);
    } else {
      await createReviewMutation.mutateAsync({
        rating: data.rating,
        content: data.content,
        bookingId: eligibilityData?.eligibleBookingId,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    await deleteReviewMutation.mutateAsync(deletingReview.id);
  };

  const handleAddComment = (
    reviewId: string,
    content: string,
    parentId?: string,
  ) => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để bình luận.');
      return;
    }
    createCommentMutation.mutate({ reviewId, content, parentId });
  };

  const handleEditComment = (commentId: string, content: string) => {
    updateCommentMutation.mutate({ commentId, content });
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  if (isFieldLoading || isReviewsLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] pt-6 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-48 bg-[#e1e3e4] rounded animate-pulse mb-6" />
          <div className="h-8 w-64 bg-[#e1e3e4] rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 h-64 bg-[#e1e3e4] rounded-2xl animate-pulse" />
            <div className="lg:col-span-8 space-y-4">
              <div className="h-12 bg-[#e1e3e4] rounded-xl animate-pulse" />
              <div className="h-32 bg-[#e1e3e4] rounded-xl animate-pulse" />
              <div className="h-32 bg-[#e1e3e4] rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isFieldError || !field) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#f8f9fa]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-200 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h1 className="font-['Manrope'] text-xl font-extrabold text-[#191c1d] mb-2">
            Không tìm thấy thông tin sân
          </h1>
          <p className="text-xs text-[#575e70] leading-relaxed mb-6">
            Sân bóng này không tồn tại hoặc đã bị gỡ bỏ.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => refetchField()}
              className="w-full sm:w-auto bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-bold rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử lại</span>
            </Button>
            <Link
              href="/fields"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#bccbb9]/60 bg-white hover:bg-[#f8f9fa] text-[#191c1d] text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Danh sách sân</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fieldName = field.name;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-6 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Breadcrumbs & Back Link */}
        <nav aria-label="Breadcrumb" className="flex flex-col gap-2 mb-6">
          <Link
            href={`/fields/${fieldId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#575e70] hover:text-[#006e2f] transition-colors w-fit cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại chi tiết sân</span>
          </Link>
          <ol className="flex items-center space-x-2 text-xs text-[#575e70]">
            <li>
              <Link href="/" className="hover:text-[#006e2f]">
                Trang chủ
              </Link>
            </li>
            <li className="text-[#bccbb9]">/</li>
            <li>
              <Link href="/fields" className="hover:text-[#006e2f]">
                Danh sách sân
              </Link>
            </li>
            <li className="text-[#bccbb9]">/</li>
            <li>
              <Link
                href={`/fields/${fieldId}`}
                className="hover:text-[#006e2f]"
              >
                {fieldName}
              </Link>
            </li>
            <li className="text-[#bccbb9]">/</li>
            <li aria-current="page" className="font-bold text-[#191c1d]">
              Đánh giá & Bình luận
            </li>
          </ol>
        </nav>

        {/* 2. Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b border-[#bccbb9]/30">
          <div>
            <h1 className="font-['Manrope'] font-extrabold text-2xl sm:text-3xl text-[#191c1d] mb-1">
              Đánh giá {fieldName}
            </h1>
            <p className="text-xs sm:text-sm text-[#575e70]">
              Tổng hợp {summary.totalReviews} bài đánh giá từ người chơi đã hoàn
              tất đặt sân thực tế
            </p>
          </div>
          <Button
            onClick={handleOpenWriteReview}
            className="bg-[#006e2f] hover:bg-[#004b1e] text-white font-semibold rounded-xl px-6 py-2.5 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Viết đánh giá của tôi</span>
          </Button>
        </div>

        {/* 3. Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Summary Card */}
          <div className="lg:col-span-4 sticky top-6">
            <ReviewSummaryCard summary={summary} />
          </div>

          {/* Right Column: Filter Bar & Review Cards */}
          <div className="lg:col-span-8 space-y-6">
            {/* Filter Bar */}
            <ReviewFilterBar
              selectedStar={starFilter}
              onStarChange={handleStarChange}
              selectedSort={sortOption}
              onSortChange={handleSortChange}
              starCounts={starCounts}
              totalCount={reviewsList.length}
            />

            {/* Reviews List */}
            {currentReviews.length > 0 ? (
              <div className="space-y-4">
                {currentReviews.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    fieldId={fieldId}
                    currentUserId={effectiveCurrentUserId}
                    currentUser={currentProfile}
                    onEdit={(r) => {
                      setEditingReview(r);
                      setIsWriteModalOpen(true);
                    }}
                    onDelete={(r) => setDeletingReview(r)}
                    onAddComment={handleAddComment}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-[#bccbb9]/40 text-center flex flex-col items-center justify-center shadow-xs">
                <div className="w-14 h-14 rounded-full bg-[#f8f9fa] border border-[#bccbb9]/40 flex items-center justify-center mb-3 text-[#575e70]">
                  <StarOff className="w-7 h-7 stroke-[1.8] text-[#575e70]" />
                </div>
                <h3 className="text-base font-bold text-[#191c1d] mb-1">
                  Không tìm thấy đánh giá phù hợp
                </h3>
                <p className="text-xs text-[#575e70] max-w-sm mb-4">
                  Chưa có bài đánh giá nào khớp với bộ lọc số sao đã chọn.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStarFilter('all')}
                  className="text-xs border-[#006e2f] text-[#006e2f] hover:bg-[#006e2f]/10 cursor-pointer"
                >
                  Xóa bộ lọc sao
                </Button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-[#bccbb9]/30">
                <div className="text-xs text-[#575e70]">
                  Trang{' '}
                  <span className="font-bold text-[#191c1d]">
                    {currentPage}
                  </span>{' '}
                  / {totalPages}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-[#006e2f] text-white shadow-xs'
                            : 'bg-white border border-[#bccbb9]/40 text-[#575e70] hover:border-[#006e2f] hover:text-[#006e2f]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer"
                    aria-label="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Eligibility Modal */}
        {showEligibilityDialog && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#bccbb9]/40 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Info className="w-7 h-7 stroke-[1.8]" />
              </div>

              {eligibilityReason === 'not_logged_in' ? (
                <>
                  <h3 className="font-['Manrope'] text-lg font-extrabold text-[#191c1d] mb-2">
                    Yêu cầu đăng nhập tài khoản
                  </h3>
                  <p className="text-xs text-[#575e70] leading-relaxed mb-6">
                    Bạn cần đăng nhập tài khoản KickZone và có ít nhất 1 lượt
                    đặt sân đã hoàn thành tại <strong>{field.name}</strong> để
                    viết bài đánh giá.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Button
                      onClick={() =>
                        router.push(`/login?next=/fields/${field.id}/reviews`)
                      }
                      className="flex-1 bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-bold rounded-xl py-2.5 cursor-pointer"
                    >
                      Đăng nhập ngay
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowEligibilityDialog(false)}
                      className="flex-1 border-[#bccbb9]/60 text-xs font-semibold rounded-xl py-2.5 cursor-pointer"
                    >
                      Đóng
                    </Button>
                  </div>
                </>
              ) : eligibilityReason === 'already_reviewed' ? (
                <>
                  <h3 className="font-['Manrope'] text-lg font-extrabold text-[#191c1d] mb-2">
                    Đã hoàn thành đánh giá
                  </h3>
                  <p className="text-xs text-[#575e70] leading-relaxed mb-6">
                    Bạn đã đánh giá các lượt đặt sân đã hoàn thành của mình tại{' '}
                    <strong>{field.name}</strong>. Bạn có thể chỉnh sửa lại bài
                    đánh giá của mình bất cứ lúc nào!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {reviewsList.find(
                      (r) =>
                        r.id === eligibilityData?.existingReviewId ||
                        (effectiveCurrentUserId &&
                          (r.userId === effectiveCurrentUserId ||
                            r.user?.id === effectiveCurrentUserId)),
                    ) && (
                      <Button
                        onClick={() => {
                          const target = reviewsList.find(
                            (r) =>
                              r.id === eligibilityData?.existingReviewId ||
                              (effectiveCurrentUserId &&
                                (r.userId === effectiveCurrentUserId ||
                                  r.user?.id === effectiveCurrentUserId)),
                          );
                          setShowEligibilityDialog(false);
                          if (target) {
                            setEditingReview(target);
                            setIsWriteModalOpen(true);
                          }
                        }}
                        className="flex-1 bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-bold rounded-xl py-2.5 cursor-pointer"
                      >
                        Chỉnh sửa đánh giá
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setShowEligibilityDialog(false)}
                      className="flex-1 border-[#bccbb9]/60 text-xs font-semibold rounded-xl py-2.5 cursor-pointer"
                    >
                      Đã hiểu
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-['Manrope'] text-lg font-extrabold text-[#191c1d] mb-2">
                    Chưa đủ điều kiện đánh giá
                  </h3>
                  <p className="text-xs text-[#575e70] leading-relaxed mb-6">
                    Theo quy định của KickZone, chỉ những tài khoản đã từng đặt
                    sân và hoàn thành trận đấu tại <strong>{field.name}</strong>{' '}
                    mới có thể gửi đánh giá nhằm đảm bảo tính chân thực và minh
                    bạch.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Button
                      onClick={() => router.push(`/fields/${field.id}`)}
                      className="flex-1 bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-bold rounded-xl py-2.5 cursor-pointer"
                    >
                      Đặt sân ngay
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowEligibilityDialog(false)}
                      className="flex-1 border-[#bccbb9]/60 text-xs font-semibold rounded-xl py-2.5 cursor-pointer"
                    >
                      Đã hiểu
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        <WriteReviewModal
          isOpen={isWriteModalOpen}
          onClose={() => {
            setIsWriteModalOpen(false);
            setEditingReview(null);
          }}
          onSubmit={handleCreateOrUpdateReview}
          initialReview={editingReview}
          bookingProof={eligibilityData?.bookingProof}
        />

        <DeleteReviewDialog
          isOpen={Boolean(deletingReview)}
          onClose={() => setDeletingReview(null)}
          onConfirm={handleConfirmDelete}
          isLoading={deleteReviewMutation.isPending}
        />
      </div>
    </div>
  );
}
