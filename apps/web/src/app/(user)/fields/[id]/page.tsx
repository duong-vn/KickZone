/* eslint-disable @next/next/no-img-element */
'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Star,
  Shield,
  ChevronRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  MessageSquarePlus,
  ArrowRight,
  StarOff,
  Heart,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { fetchAvailability, fetchFieldById } from '@/lib/api';
import { nextBusinessDates } from '@/lib/booking-time';
import type { Review } from '@/types/review';
import {
  INITIAL_MOCK_REVIEWS,
  CURRENT_USER,
  calculateReviewSummary,
} from '@/data/mock-reviews';
import {
  StarRating,
  ReviewCard,
  WriteReviewModal,
  DeleteReviewDialog,
} from '@/components/reviews';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1529900240051-5120302b7405?auto=format&fit=crop&w=800&q=80';

export default function FieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: fieldId } = use(params);
  const router = useRouter();

  const dates = useMemo(() => nextBusinessDates(), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.iso ?? '');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Reviews state
  const [reviewsList, setReviewsList] = useState<Review[]>(INITIAL_MOCK_REVIEWS);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  const reviewSummary = useMemo(
    () => calculateReviewSummary(reviewsList),
    [reviewsList],
  );

  const fieldQuery = useQuery({
    queryKey: ['field', fieldId],
    queryFn: () => fetchFieldById(fieldId),
    retry: false,
  });

  const availabilityQuery = useQuery({
    queryKey: ['availability', fieldId, selectedDate],
    queryFn: () => fetchAvailability(fieldId, selectedDate),
    enabled: Boolean(selectedDate),
    retry: false,
  });

  const field = fieldQuery.data?.data;
  const slots = availabilityQuery.data?.data.slots ?? [];
  const selected = slots.filter((slot) =>
    selectedSlots.includes(slot.startTime),
  );
  const originalPrice = selected.reduce((total, slot) => total + slot.price, 0);

  const toggleSlot = (startTime: string) => {
    const index = slots.findIndex((slot) => slot.startTime === startTime);
    const selectedIndexes = selectedSlots
      .map((value) => slots.findIndex((slot) => slot.startTime === value))
      .filter((value) => value >= 0);
    const min = Math.min(...selectedIndexes);
    const max = Math.max(...selectedIndexes);

    if (selectedSlots.includes(startTime)) {
      if (selectedSlots.length > 1 && index !== min && index !== max) {
        return toast.error('Chỉ có thể bỏ chọn khung giờ ở đầu hoặc cuối dải.');
      }
      setSelectedSlots((current) =>
        current.filter((value) => value !== startTime),
      );
      return;
    }

    if (selectedSlots.length > 0 && index !== min - 1 && index !== max + 1) {
      return toast.error('Vui lòng chọn các khung giờ liền nhau.');
    }

    setSelectedSlots((current) => [...current, startTime]);
  };

  const proceed = () => {
    if (!selected.length) {
      return toast.error('Vui lòng chọn ít nhất một khung giờ.');
    }
    const ordered = [...selected].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
    router.push(
      `/checkout?${new URLSearchParams({
        fieldId,
        startTime: ordered[0].startTime,
        endTime: ordered[ordered.length - 1].endTime,
      }).toString()}`,
    );
  };

  const handleCreateOrUpdateReview = (data: {
    rating: number;
    content: string;
    reviewId?: string;
  }) => {
    if (data.reviewId) {
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
      toast.success('Đã cập nhật bài đánh giá.');
    } else {
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
          fieldName: field?.name ?? 'Sân bóng',
          matchDate: 'Hôm nay',
          timeSlot: '18:00 - 19:30',
          fieldTypeName: field?.type?.name ?? 'Sân bóng đá',
        },
        comments: [],
      };
      setReviewsList((prev) => [newReview, ...prev]);
      toast.success('Đã gửi bài đánh giá thành công.');
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
          const updatedComments = rev.comments.map((c) => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            return c;
          });
          return { ...rev, comments: updatedComments };
        }

        return { ...rev, comments: [...rev.comments, newComment] };
      }),
    );

    toast.success('Đã gửi phản hồi thành công!');
  };

  if (fieldQuery.isLoading) {
    return <State message="Đang tải thông tin sân..." />;
  }

  if (fieldQuery.isError || !field) {
    return <State message="Không tìm thấy sân hoặc máy chủ đang lỗi." error />;
  }

  const galleryImages =
    field.images && field.images.length > 0
      ? field.images.map((img) => img.storagePath)
      : [DEFAULT_IMAGE];

  const currentImage = galleryImages[activeImageIndex] || DEFAULT_IMAGE;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16 text-[#191c1d]">
      {/* HEADER BREADCRUMB & TITLES */}
      <header className="border-b border-[#bccbb9]/40 bg-white py-6 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-2 text-xs text-[#575e70]">
            <Link href="/fields" className="hover:underline">
              Tìm sân
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-[#191c1d]">{field.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-extrabold sm:text-3xl font-['Manrope'] text-[#191c1d]">
                  {field.name}
                </h1>
                <span className="rounded-full bg-[#006e2f]/10 px-3 py-1 text-xs font-bold text-[#006e2f] border border-[#006e2f]/20">
                  {field.type?.name ?? 'Sân bóng'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#575e70]">
                <MapPin className="h-4 w-4 text-[#006e2f] shrink-0" />
                <span>{field.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFavorite(!isFavorite);
                  toast.success(
                    isFavorite
                      ? 'Đã bỏ khỏi danh sách yêu thích'
                      : 'Đã thêm vào danh sách yêu thích',
                  );
                }}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isFavorite
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-[#bccbb9]/60 bg-white text-[#575e70] hover:bg-[#f8f9fa]'
                }`}
                title="Yêu thích"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Đã sao chép liên kết sân!');
                }}
                className="p-2.5 rounded-xl border border-[#bccbb9]/60 bg-white text-[#575e70] hover:bg-[#f8f9fa] transition-colors"
                title="Chia sẻ"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: 2 COLUMNS */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* LEFT COLUMN: 8 COLS */}
        <section className="space-y-6 lg:col-span-8">
          {/* GALLERY HERO */}
          <div className="space-y-3">
            <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl border border-[#bccbb9]/40 bg-slate-200 shadow-sm">
              <img
                src={currentImage}
                alt={field.name}
                className="h-full w-full object-cover"
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#006e2f] shadow-xs'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${field.name} ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="rounded-2xl border border-[#bccbb9]/40 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-bold font-['Manrope'] text-[#191c1d]">
              Giới thiệu sân bóng
            </h2>
            <p className="text-sm leading-6 text-[#575e70] whitespace-pre-line">
              {field.description ||
                'Sân bóng đá chất lượng cao với mặt cỏ đạt chuẩn, hệ thống chiếu sáng ban đêm và tiện ích đầy đủ.'}
            </p>
          </div>

          {/* RULES & POLICIES */}
          <div className="rounded-2xl border border-[#bccbb9]/40 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold font-['Manrope'] text-[#191c1d] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#006e2f]" />
              Quy định & Chính sách đặt sân
            </h2>
            <div className="space-y-2.5 text-xs text-[#575e70]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#006e2f] shrink-0 mt-0.5" />
                <span>Vui lòng mang giày thi đấu phù hợp (giày đế TF/AG cho sân cỏ nhân tạo).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#006e2f] shrink-0 mt-0.5" />
                <span>Đến trước giờ đặt sân ít nhất 10 phút để nhận sân và chuẩn bị.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#006e2f] shrink-0 mt-0.5" />
                <span>Hủy sân chỉ áp dụng cho đơn đặt ở trạng thái chờ duyệt (PENDING).</span>
              </div>
            </div>
          </div>

          {/* REVIEWS SECTION */}
          <div className="rounded-2xl border border-[#bccbb9]/40 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#bccbb9]/30">
              <div>
                <h2 className="text-lg font-bold text-[#191c1d] font-['Manrope'] mb-1">
                  Đánh giá từ khách hàng
                </h2>
                <p className="text-xs text-[#575e70]">
                  Đánh giá từ những người đã hoàn tất đặt sân thực tế
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingReview(null);
                  setIsWriteModalOpen(true);
                }}
                className="bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-semibold rounded-xl px-4 py-2 self-start sm:self-auto shadow-xs flex items-center gap-1.5"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Viết đánh giá</span>
              </Button>
            </div>

            {/* Rating summary cards */}
            <div className="flex flex-col md:flex-row gap-6 mb-6 items-center p-5 bg-[#f8f9fa] rounded-2xl border border-[#bccbb9]/30">
              <div className="w-full md:w-48 text-center">
                <div className="text-4xl sm:text-5xl font-extrabold text-[#006e2f] font-['Manrope'] mb-1">
                  {reviewSummary.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-1.5">
                  <StarRating
                    value={reviewSummary.averageRating}
                    size="sm"
                    color="pitch"
                  />
                </div>
                <div className="text-xs text-[#575e70] font-medium">
                  Dựa trên {reviewSummary.totalReviews} đánh giá
                </div>
              </div>

              <div className="flex-1 w-full space-y-2 text-xs">
                {reviewSummary.breakdown.map((row) => (
                  <div key={row.star} className="flex items-center gap-2">
                    <span className="w-4 text-right font-bold text-[#575e70]">
                      {row.star}
                    </span>
                    <Star className="w-3.5 h-3.5 fill-[#006e2f] text-[#006e2f]" />
                    <div className="flex-1 h-2 bg-[#edeeef] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#006e2f] rounded-full transition-all duration-500"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[#575e70] font-semibold">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Reviews List */}
            {reviewsList.length > 0 ? (
              <div className="space-y-4 mb-6">
                {reviewsList.slice(0, 3).map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    fieldId={fieldId}
                    onEdit={(r) => {
                      setEditingReview(r);
                      setIsWriteModalOpen(true);
                    }}
                    onDelete={(r) => setDeletingReview(r)}
                    onAddComment={handleAddComment}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[#f8f9fa] p-8 rounded-xl border border-[#bccbb9]/30 text-center flex flex-col items-center justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-white border border-[#bccbb9]/40 flex items-center justify-center mb-2 text-[#575e70]">
                  <StarOff className="w-6 h-6 stroke-[1.8] text-[#575e70]" />
                </div>
                <p className="text-xs text-[#575e70]">
                  Chưa có đánh giá nào cho sân này. Hãy là người đầu tiên đánh giá!
                </p>
              </div>
            )}

            {/* Link to All Reviews */}
            <div className="pt-2 text-center border-t border-[#bccbb9]/30">
              <Link
                href={`/fields/${fieldId}/reviews`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#006e2f] hover:underline p-2 rounded-xl transition-all"
              >
                <span>Xem tất cả {reviewsList.length} đánh giá & bình luận</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

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
        </section>

        {/* RIGHT COLUMN: 4 COLS STICKY BOOKING WIDGET */}
        <aside className="lg:col-span-4">
          <div className="sticky top-6 space-y-5 rounded-2xl border border-[#bccbb9]/50 bg-white p-6 shadow-xl">
            <div className="flex items-end justify-between border-b border-[#bccbb9]/40 pb-4">
              <div>
                <span className="text-xs text-[#575e70] uppercase font-semibold">
                  Giá thuê từ
                </span>
                <div className="text-2xl font-extrabold text-[#006e2f] font-['Manrope']">
                  {field.basePricePerHour.toLocaleString('vi-VN')}đ
                  <span className="text-xs font-normal text-[#575e70]">/giờ</span>
                </div>
              </div>
              <span className="rounded-full bg-[#006e2f]/10 px-2.5 py-1 text-xs font-bold text-[#006e2f]">
                {field.type?.name ?? 'Sân bóng'}
              </span>
            </div>

            {/* 1. CHỌN NGÀY */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#191c1d]">
                  1. Chọn ngày đá
                </label>
                <span className="text-[11px] text-[#575e70] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> 7 ngày tới
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {dates.map((date) => (
                  <button
                    key={date.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date.iso);
                      setSelectedSlots([]);
                    }}
                    className={`rounded-xl border px-1 py-2 text-center text-xs transition-colors cursor-pointer ${
                      selectedDate === date.iso
                        ? 'border-[#006e2f] bg-[#006e2f] font-bold text-white shadow-xs'
                        : 'border-[#bccbb9]/40 bg-[#f8f9fa] text-[#575e70] hover:border-[#006e2f]'
                    }`}
                  >
                    <span className="block text-[10px]">{date.dayName}</span>
                    {date.dayFormatted}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. CHỌN KHUNG GIỜ 30 PHÚT */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#191c1d]">
                2. Chọn khung giờ (30 phút / slot)
              </label>
              {availabilityQuery.isLoading ? (
                <p className="text-xs text-[#575e70] py-4 text-center">
                  Đang tải lịch sân...
                </p>
              ) : availabilityQuery.isError ? (
                <p className="text-xs text-red-700 py-4 text-center">
                  Không thể tải lịch khả dụng. Vui lòng thử lại.
                </p>
              ) : slots.length === 0 ? (
                <p className="rounded-xl bg-[#f8f9fa] p-4 text-xs text-[#575e70] text-center">
                  Sân đóng cửa trong ngày này.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const time = new Intl.DateTimeFormat('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }).format(new Date(slot.startTime));
                    const disabled = !slot.available;
                    const isSelected = selectedSlots.includes(slot.startTime);

                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleSlot(slot.startTime)}
                        className={`rounded-lg px-1.5 py-2 text-xs font-semibold transition-all ${
                          disabled
                            ? 'cursor-not-allowed bg-[#edeeef] text-[#575e70]/40 line-through'
                            : isSelected
                              ? 'bg-[#006e2f] text-white shadow-xs'
                              : 'border border-[#bccbb9]/50 bg-white text-[#191c1d] hover:border-[#006e2f]'
                        }`}
                      >
                        <div>{time}</div>
                        <div
                          className={`text-[10px] ${isSelected ? 'text-green-100' : 'text-[#575e70]'}`}
                        >
                          {slot.price.toLocaleString('vi-VN')}đ
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PRICE SUMMARY */}
            <div className="rounded-xl border border-[#bccbb9]/40 bg-[#f8f9fa] p-4 text-xs space-y-2">
              <div className="flex justify-between text-[#575e70]">
                <span>Số slot đã chọn:</span>
                <b className="text-[#191c1d]">{selected.length} slot</b>
              </div>
              <div className="flex justify-between border-t border-[#bccbb9]/40 pt-2 text-[#191c1d]">
                <span className="font-bold">Tổng tiền:</span>
                <b className="text-xl text-[#006e2f] font-['Manrope']">
                  {originalPrice.toLocaleString('vi-VN')}đ
                </b>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <Button
              onClick={proceed}
              disabled={!selected.length}
              className="w-full rounded-xl bg-[#006e2f] py-6 text-base font-bold text-white hover:bg-[#005321] transition-all disabled:opacity-50"
            >
              Đặt sân ngay
            </Button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-[#575e70]">
              <Shield className="h-3.5 w-3.5 text-[#006e2f]" /> Giá và tình trạng sân
              được xác nhận trên máy chủ
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function State({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[60vh] items-center justify-center text-sm ${
        error ? 'text-red-700 font-semibold' : 'text-[#575e70]'
      }`}
    >
      {message}
    </div>
  );
}
