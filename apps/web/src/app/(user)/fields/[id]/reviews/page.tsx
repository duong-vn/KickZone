'use client';

import { useState, useMemo, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  StarOff,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  Review,
  ReviewFilterState,
  ReviewStarFilter,
  ReviewSortOption,
} from '@/types/review';
import {
  INITIAL_MOCK_REVIEWS,
  CURRENT_USER,
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FieldAllReviewsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const fieldId = resolvedParams.id;

  // Local state for reviews store to allow client interactions
  const [reviewsList, setReviewsList] =
    useState<Review[]>(INITIAL_MOCK_REVIEWS);

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
  const summary = useMemo(
    () => calculateReviewSummary(reviewsList),
    [reviewsList],
  );

  // Star counts mapping for filter pills
  const starCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((r) => {
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

  const handleCreateOrUpdateReview = (data: {
    rating: number;
    content: string;
    reviewId?: string;
  }) => {
    if (data.reviewId) {
      // Edit existing review
      setReviewsList((prev) =>
        prev.map((r) =>
          r.id === data.reviewId
            ? {
                ...r,
                rating: data.rating,
                content: data.content,
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      setEditingReview(null);
    } else {
      // Create new review
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        userId: CURRENT_USER.id,
        fieldId: fieldId,
        bookingId: `bk-${Date.now()}`,
        rating: data.rating,
        content: data.content,
        createdAt: new Date().toISOString(),
        verifiedBooking: true,
        isOwner: true,
        user: CURRENT_USER,
        booking: {
          id: `bk-${Date.now()}`,
          code: `KZ-BK-${Math.floor(100 + Math.random() * 900)}`,
          fieldName: 'Sân Bóng Chảo Lửa',
          matchDate: 'Hôm nay',
          timeSlot: '18:00 - 19:30',
          fieldTypeName: 'Sân 7 người',
        },
        comments: [],
      };
      setReviewsList((prev) => [newReview, ...prev]);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingReview) return;
    setReviewsList((prev) => prev.filter((r) => r.id !== deletingReview.id));
    toast.success('Đã xóa bài đánh giá thành công.');
    setDeletingReview(null);
  };

  const handleAddComment = (
    reviewId: string,
    content: string,
    parentId?: string,
    replyToUserName?: string,
  ) => {
    const newComment = {
      id: `comm-${Date.now()}`,
      reviewId,
      userId: CURRENT_USER.id,
      parentId: parentId || null,
      replyToUserName: replyToUserName || null,
      content,
      createdAt: new Date().toISOString(),
      user: CURRENT_USER,
    };

    setReviewsList((prev) =>
      prev.map((rev) => {
        if (rev.id !== reviewId) return rev;

        if (parentId) {
          // Add nested reply
          const updatedComments = rev.comments.map((c) => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            return c;
          });
          return { ...rev, comments: updatedComments };
        }

        // Add top-level comment
        return { ...rev, comments: [...rev.comments, newComment] };
      }),
    );

    toast.success('Đã gửi bình luận thành công!');
  };

  const fieldName = 'Sân Bóng Chảo Lửa';

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-6 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Breadcrumbs & Back Link */}
        <nav aria-label="Breadcrumb" className="flex flex-col gap-2 mb-6">
          <Link
            href={`/fields/${fieldId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#575e70] hover:text-[#006e2f] transition-colors w-fit"
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
                Tìm sân
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
              Tổng hợp {summary.totalReviews} bài đánh giá từ người chơi đã trải
              nghiệm và xác thực
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingReview(null);
              setIsWriteModalOpen(true);
            }}
            className="bg-[#006e2f] hover:bg-[#004b1e] text-white font-semibold rounded-xl px-6 py-2.5 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Viết đánh giá của tôi</span>
          </Button>
        </div>

        {/* 3. Main 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (4 cols): Sticky Summary Card */}
          <div className="lg:col-span-4">
            <ReviewSummaryCard
              summary={summary}
              onWriteReview={() => {
                setEditingReview(null);
                setIsWriteModalOpen(true);
              }}
              isSticky={true}
            />
          </div>

          {/* Right Column (8 cols): Filters, Reviews List & Pagination */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Filter and Sort Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#bccbb9]/40 shadow-xs">
              <ReviewFilterBar
                selectedStar={starFilter}
                onStarChange={handleStarChange}
                selectedSort={sortOption}
                onSortChange={handleSortChange}
                starCounts={starCounts}
                totalCount={reviewsList.length}
              />
            </div>

            {/* Reviews Cards List */}
            {currentReviews.length > 0 ? (
              <div className="space-y-4">
                {currentReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    fieldId={fieldId}
                    onEdit={(rev) => {
                      setEditingReview(rev);
                      setIsWriteModalOpen(true);
                    }}
                    onDelete={(rev) => setDeletingReview(rev)}
                    onAddComment={handleAddComment}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-[#bccbb9]/40 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#f3f4f5] border border-[#bccbb9]/40 flex items-center justify-center mb-3.5 text-[#575e70]">
                  <StarOff className="w-7 h-7 stroke-[1.8] text-[#575e70]" />
                </div>
                <h3 className="font-['Manrope'] font-bold text-base text-[#191c1d] mb-1">
                  Chưa có đánh giá phù hợp
                </h3>
                <p className="text-xs text-[#575e70] max-w-sm mb-4">
                  Không tìm thấy bài đánh giá nào cho mức lọc đã chọn. Hãy thử
                  chọn tất cả hoặc viết bài đánh giá đầu tiên.
                </p>
                <Button
                  onClick={() => setStarFilter('all')}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  Xóa bộ lọc sao
                </Button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg p-2"
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
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[#006e2f] text-white shadow-sm'
                          : 'bg-white border border-[#bccbb9]/60 text-[#191c1d] hover:bg-[#f3f4f5]'
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
                  className="rounded-lg p-2"
                  aria-label="Trang tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 4. Modals */}
        <WriteReviewModal
          isOpen={isWriteModalOpen}
          onClose={() => {
            setIsWriteModalOpen(false);
            setEditingReview(null);
          }}
          onSubmit={handleCreateOrUpdateReview}
          initialReview={editingReview}
        />

        <DeleteReviewDialog
          isOpen={Boolean(deletingReview)}
          onClose={() => setDeletingReview(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
}
