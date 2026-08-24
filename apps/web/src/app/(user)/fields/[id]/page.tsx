/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo, use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Star,
  Share2,
  Heart,
  Clock,
  CheckCircle2,
  Shield,
  ChevronRight,
  Wifi,
  Car,
  Coffee,
  Droplets,
  Shirt,
  Lightbulb,
  X,
  MessageSquarePlus,
  ArrowRight,
  StarOff,
  AlertCircle,
  RotateCcw,
  Home,
  ChevronLeft,
  Lock,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Review } from '@/types/review';
import { CURRENT_USER, calculateReviewSummary } from '@/data/mock-reviews';
import {
  useFavoriteStatusQuery,
  useToggleFavoriteMutation,
} from '@/hooks/use-favorites';
import {
  StarRating,
  ReviewCard,
  WriteReviewModal,
  DeleteReviewDialog,
} from '@/components/reviews';
import {
  fetchFieldById,
  fetchFieldReviews,
  validateVoucherApi,
} from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase';

// Helper to format field type to clean Vietnamese
export function formatFieldTypeName(name?: string | null): string {
  if (!name) return 'Sân 7 người';
  const clean = name.toLowerCase().trim();
  if (clean === '5-a-side' || clean === '5' || clean.includes('5'))
    return 'Sân 5 người';
  if (clean === '7-a-side' || clean === '7' || clean.includes('7'))
    return 'Sân 7 người';
  if (clean === '11-a-side' || clean === '11' || clean.includes('11'))
    return 'Sân 11 người';
  return name;
}

const DEFAULT_AMENITIES = [
  {
    icon: 'Car',
    label: 'Bãi giữ xe rộng rãi',
    desc: 'Có chỗ đỗ ô tô và xe máy an toàn',
  },
  {
    icon: 'Droplets',
    label: 'Nước uống phục vụ',
    desc: 'Trà đá và nước mát giải khát',
  },
  {
    icon: 'Shirt',
    label: 'Phòng thay đồ & Tủ khóa',
    desc: 'Khu vực thay đồ sạch sẽ, có tủ gửi đồ',
  },
  {
    icon: 'Wifi',
    label: 'Wifi miễn phí',
    desc: 'Phủ sóng toàn bộ khuôn viên sân',
  },
  {
    icon: 'Lightbulb',
    label: 'Dàn đèn LED cao áp',
    desc: 'Độ sáng đạt chuẩn thi đấu ban đêm',
  },
  {
    icon: 'Coffee',
    label: 'Căn tin giải khát',
    desc: 'Phục vụ nước uống và đồ ăn nhẹ',
  },
];

const DEFAULT_RULES = [
  'Vui lòng sử dụng giày đế TF (đinh dăm) hoặc IC (futsal), nghiêm cấm giày đinh sắt SG.',
  'Đến trước giờ thi đấu 10-15 phút để chuẩn bị và làm thủ tục nhận sân.',
  'Nghiêm cấm hút thuốc, xả rác bừa bãi và mang chất dễ cháy nổ vào sân.',
  'Hủy hoặc thay đổi lịch đặt phải thực hiện trước giờ bắt đầu ít nhất 12 tiếng.',
];

// Khung giờ 30 phút tiêu chuẩn
const TIME_INTERVALS = {
  morning: [
    '06:00',
    '06:30',
    '07:00',
    '07:30',
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
  ],
  afternoon: [
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
  ],
  evening: [
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
    '22:00',
    '22:30',
  ],
};

const ALL_TIME_SLOTS = [
  ...TIME_INTERVALS.morning,
  ...TIME_INTERVALS.afternoon,
  ...TIME_INTERVALS.evening,
];

function getSlotEndTime(slot: string): string {
  const [hours, minutes] = slot.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + 30;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(
    totalMinutes % 60,
  ).padStart(2, '0')}`;
}

export default function FieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const fieldId = resolvedParams.id;
  const router = useRouter();

  // 1. Fetch field by ID
  const {
    data: field,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['field', fieldId],
    queryFn: () => fetchFieldById(fieldId),
    retry: (failureCount, err: unknown) => {
      const errorObj = err as { status?: number };
      if (errorObj?.status === 404) return false;
      return failureCount < 2;
    },
  });

  // 2. Fetch reviews from API
  const { data: reviewsResponse } = useQuery({
    queryKey: ['field-reviews', fieldId],
    queryFn: () => fetchFieldReviews(fieldId, { limit: 5 }),
    enabled: !!field,
  });

  // Auth state for review eligibility
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
  } | null>(null);
  const [hasCompletedBooking] = useState(false);
  const [showEligibilityDialog, setShowEligibilityDialog] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState<
    'not_logged_in_booking' | 'not_logged_in_review' | 'no_completed_booking'
  >('not_logged_in_booking');

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;
        if (data.user) {
          setCurrentUser({
            id: data.user.id,
            email: data.user.email,
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

  // Gallery Modal State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Favorite state via TanStack Query
  const { data: favoriteData } = useFavoriteStatusQuery(fieldId);
  const toggleFavoriteMutation = useToggleFavoriteMutation(fieldId);
  const isFavorite = Boolean(favoriteData?.is_favorite);

  const handleFavoriteToggle = () => {
    toggleFavoriteMutation.mutate();
  };

  // Booking Widget State
  const [customSubPitchId, setCustomSubPitchId] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount: number;
    discountType: 'PERCENT' | 'FIXED';
  } | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  // Reviews Local State (for interactive additions/edits)
  const [localReviews, setLocalReviews] = useState<Review[] | null>(null);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  // Days list for next 7 days
  const next7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    const dayNames = [
      'CN',
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName =
        i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : dayNames[d.getDay()];
      const displayDate = `${String(d.getDate()).padStart(2, '0')}-${String(
        d.getMonth() + 1,
      ).padStart(2, '0')}`;

      days.push({
        dateStr,
        dayName,
        displayDate,
      });
    }
    return days;
  }, []);

  const selectedDate = customDate ?? (next7Days[0]?.dateStr || '');

  const subPitches = useMemo(() => {
    if (field?.subPitches && field.subPitches.length > 0) {
      return field.subPitches;
    }
    if (field) {
      const typeLabel = formatFieldTypeName(field.type);
      return [
        {
          id: `${field.id}-1`,
          name: `${typeLabel} - Sân A1 (Cỏ mới)`,
          type: typeLabel,
          pricePerHour: field.base_price_per_hour || 300000,
        },
        {
          id: `${field.id}-2`,
          name: `${typeLabel} - Sân A2 (Tiêu chuẩn)`,
          type: typeLabel,
          pricePerHour: field.base_price_per_hour || 300000,
        },
      ];
    }
    return [];
  }, [field]);

  const selectedSubPitchId = customSubPitchId ?? (subPitches[0]?.id || '');

  // Reviews list calculation
  const reviewsList = useMemo(() => {
    if (localReviews !== null) return localReviews;
    if (reviewsResponse?.data && reviewsResponse.data.length > 0) {
      return reviewsResponse.data;
    }
    if (field?.reviews && field.reviews.length > 0) {
      return field.reviews;
    }
    return [];
  }, [localReviews, reviewsResponse, field]);

  const reviewSummary = useMemo(() => {
    if (reviewsResponse?.summary && localReviews === null) {
      return reviewsResponse.summary;
    }
    return calculateReviewSummary(reviewsList);
  }, [reviewsResponse, localReviews, reviewsList]);

  // Images list
  const fieldImages = useMemo(() => {
    if (field?.images && field.images.length > 0) {
      return field.images;
    }
    if (field?.image) {
      return [field.image];
    }
    return [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    ];
  }, [field]);

  // Pricing calculations
  const currentSubPitch = useMemo(
    () => subPitches.find((p) => p.id === selectedSubPitchId) || subPitches[0],
    [subPitches, selectedSubPitchId],
  );

  const pricePerHour =
    currentSubPitch?.pricePerHour || field?.base_price_per_hour || 300000;
  const durationHours = selectedSlots.length * 0.5;
  const originalPrice = Math.round(durationHours * pricePerHour);

  const discountAmount = useMemo(() => {
    if (!appliedVoucher || originalPrice <= 0) return 0;
    return appliedVoucher.discount;
  }, [appliedVoucher, originalPrice]);

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  // Check if slot is disabled (past time for today)
  const isSlotDisabled = (slot: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate === todayStr) {
      const now = new Date();
      const [slotHour, slotMin] = slot.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      if (slotHour < currentHour) return true;
      if (slotHour === currentHour && slotMin <= currentMin) return true;
    }
    return false;
  };

  // Time slot selection logic (contiguous slots)
  const handleToggleSlot = (slot: string) => {
    if (isSlotDisabled(slot)) {
      toast.error('Khung giờ này đã qua, vui lòng chọn khung giờ sắp tới.');
      return;
    }

    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
      return;
    }

    if (selectedSlots.length === 0) {
      setSelectedSlots([slot]);
      return;
    }

    const sortedSlots = [...selectedSlots, slot].sort(
      (a, b) => ALL_TIME_SLOTS.indexOf(a) - ALL_TIME_SLOTS.indexOf(b),
    );

    const firstIdx = ALL_TIME_SLOTS.indexOf(sortedSlots[0]);
    const lastIdx = ALL_TIME_SLOTS.indexOf(sortedSlots[sortedSlots.length - 1]);

    const contiguousSlots = ALL_TIME_SLOTS.slice(firstIdx, lastIdx + 1);
    // Check if any slot in the range is disabled
    const hasDisabledSlot = contiguousSlots.some((s) => isSlotDisabled(s));
    if (hasDisabledSlot) {
      toast.error('Khoảng thời gian bạn chọn chứa khung giờ đã qua.');
      return;
    }
    setSelectedSlots(contiguousSlots);
  };

  // Voucher validation against real API
  const handleApplyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      toast.error('Vui lòng nhập mã giảm giá.');
      return;
    }

    if (originalPrice <= 0) {
      toast.error(
        'Vui lòng chọn ít nhất 1 khung giờ trước khi áp dụng voucher.',
      );
      return;
    }

    setIsValidatingVoucher(true);
    try {
      const result = await validateVoucherApi(code, originalPrice, fieldId);
      if (result.valid && result.discountAmount !== undefined) {
        setAppliedVoucher({
          code: result.code || code,
          discount: result.discountAmount,
          discountType: result.discountType || 'FIXED',
        });
        toast.success(
          result.message ||
          `Đã áp dụng mã ${code}! Giảm ${result.discountAmount.toLocaleString('vi-VN')}đ`,
        );
      } else {
        setAppliedVoucher(null);
        toast.error(
          result.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
        );
      }
    } catch {
      toast.error('Lỗi khi kiểm tra mã giảm giá. Vui lòng thử lại.');
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (!field) return;

    if (!currentUser) {
      setEligibilityReason('not_logged_in_booking');
      setShowEligibilityDialog(true);
      return;
    }

    if (!selectedSubPitchId) {
      toast.error('Vui lòng chọn sân thi đấu.');
      return;
    }
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày thi đấu.');
      return;
    }
    if (selectedSlots.length === 0) {
      toast.error('Vui lòng chọn ít nhất một khung giờ thi đấu.');
      return;
    }

    const sortedSlots = [...selectedSlots].sort(
      (a, b) => ALL_TIME_SLOTS.indexOf(a) - ALL_TIME_SLOTS.indexOf(b),
    );
    const startTime = sortedSlots[0];
    const endTime = getSlotEndTime(sortedSlots[sortedSlots.length - 1]);

    // Format dateDisplay (e.g. "Hôm nay, 24/08/2026")
    const dateObj = new Date(selectedDate);
    const dateDisplay = `${dateObj.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })}`;

    const queryParams = new URLSearchParams({
      fieldId: field.id,
      fieldName: field.name,
      fieldAddress: field.address,
      fieldType: formatFieldTypeName(field.type),
      courtName: currentSubPitch?.name || 'Sân tiêu chuẩn',
      date: selectedDate,
      dateDisplay,
      startTime,
      endTime,
      durationHours: String(durationHours),
      pricePerHour: String(pricePerHour),
      fieldImage: fieldImages[0] || '',
      voucher: appliedVoucher ? appliedVoucher.code : '',
    });

    router.push(`/checkout?${queryParams.toString()}`);
  };

  // Review eligibility check
  const handleOpenWriteReview = () => {
    if (!currentUser) {
      setEligibilityReason('not_logged_in_review');
      setShowEligibilityDialog(true);
      return;
    }

    if (!hasCompletedBooking) {
      setEligibilityReason('no_completed_booking');
      setShowEligibilityDialog(true);
      return;
    }

    setEditingReview(null);
    setIsWriteReviewOpen(true);
  };

  // Review actions
  const handleCreateOrUpdateReview = (data: {
    rating: number;
    content: string;
    reviewId?: string;
  }) => {
    if (!field) return;

    if (data.reviewId) {
      setLocalReviews((prev) => {
        const base = prev ?? reviewsList;
        return base.map((r) =>
          r.id === data.reviewId
            ? {
              ...r,
              rating: data.rating,
              content: data.content,
              updatedAt: new Date().toISOString(),
            }
            : r,
        );
      });
      setEditingReview(null);
      toast.success('Đã cập nhật bài đánh giá.');
    } else {
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        userId: currentUser?.id || CURRENT_USER.id,
        fieldId: field.id,
        bookingId: `bk-${Date.now()}`,
        rating: data.rating,
        content: data.content,
        createdAt: new Date().toISOString(),
        verifiedBooking: true,
        isOwner: true,
        user: {
          id: currentUser?.id || CURRENT_USER.id,
          fullName: currentUser?.email?.split('@')[0] || 'Tôi',
          avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          role: 'USER',
        },
        booking: {
          id: `bk-${Date.now()}`,
          code: `KZ-BK-${Math.floor(100 + Math.random() * 900)}`,
          fieldName: field.name,
          matchDate: 'Hôm nay',
          timeSlot: '18:00 - 19:30',
          fieldTypeName: formatFieldTypeName(field.type),
        },
        comments: [],
      };

      setLocalReviews((prev) => [newReview, ...(prev ?? reviewsList)]);
      toast.success('Đã gửi đánh giá thành công!');
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingReview) return;
    setLocalReviews((prev) => {
      const base = prev ?? reviewsList;
      return base.filter((r) => r.id !== deletingReview.id);
    });
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
      userId: currentUser?.id || CURRENT_USER.id,
      parentId: parentId || null,
      replyToUserName: replyToUserName || null,
      content,
      createdAt: new Date().toISOString(),
      user: CURRENT_USER,
    };

    setLocalReviews((prev) => {
      const base = prev ?? reviewsList;
      return base.map((rev) => {
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
      });
    });

    toast.success('Đã gửi bình luận thành công!');
  };

  // ----------------------------------------------------
  // RENDER: LOADING SKELETON
  // ----------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] pt-6 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-48 bg-[#e1e3e4] rounded animate-pulse mb-6" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="space-y-2">
              <div className="h-8 w-72 bg-[#e1e3e4] rounded-lg animate-pulse" />
              <div className="h-4 w-96 bg-[#e1e3e4] rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-[#e1e3e4] rounded-xl animate-pulse" />
              <div className="h-10 w-24 bg-[#e1e3e4] rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="h-[380px] sm:h-[460px] bg-[#e1e3e4] rounded-3xl animate-pulse mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-48 bg-[#e1e3e4] rounded-2xl animate-pulse" />
              <div className="h-48 bg-[#e1e3e4] rounded-2xl animate-pulse" />
              <div className="h-64 bg-[#e1e3e4] rounded-2xl animate-pulse" />
            </div>
            <div className="lg:col-span-4 h-96 bg-[#e1e3e4] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: 404 NOT FOUND STATE
  // ----------------------------------------------------
  const is404 =
    (error as { status?: number })?.status === 404 || (isError && !field);

  if (is404 || (!isLoading && !field)) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#f8f9fa]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#bccbb9]/40 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h1 className="font-['Manrope'] text-2xl font-extrabold text-[#191c1d] mb-2">
            Không tìm thấy sân bóng
          </h1>
          <p className="text-xs sm:text-sm text-[#575e70] leading-relaxed mb-6">
            Sân bóng bạn đang tìm kiếm không tồn tại, đã bị ngừng hoạt động hoặc
            đường dẫn không hợp lệ.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/fields"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Danh sách sân bóng</span>
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#bccbb9]/60 bg-white hover:bg-[#f8f9fa] text-[#191c1d] text-xs font-semibold transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: GENERIC ERROR STATE
  // ----------------------------------------------------
  if (isError) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#f8f9fa]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-rose-200 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h1 className="font-['Manrope'] text-2xl font-extrabold text-[#191c1d] mb-2">
            Đã xảy ra lỗi
          </h1>
          <p className="text-xs sm:text-sm text-[#575e70] leading-relaxed mb-6">
            Không thể tải thông tin sân bóng vào lúc này. Vui lòng kiểm tra kết
            nối và thử lại.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => refetch()}
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

  if (!field) {
    return null;
  }

  const fieldTypeName = formatFieldTypeName(field.type);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] font-sans pb-24">
      {/* 1. Breadcrumbs */}
      <div className="bg-white border-b border-[#bccbb9]/30 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center space-x-2 text-xs text-[#575e70]"
          >
            <Link href="/" className="hover:text-[#006e2f] transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#bccbb9]" />
            <Link
              href="/fields"
              className="hover:text-[#006e2f] transition-colors"
            >
              Danh sách sân
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#bccbb9]" />
            <span className="font-bold text-[#191c1d] truncate max-w-[200px] sm:max-w-md">
              {field.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* 2. Top Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              <h1 className="font-['Manrope'] font-extrabold text-2xl sm:text-3xl text-[#191c1d] tracking-tight">
                {field.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#006e2f]/10 text-[#006e2f] border border-[#006e2f]/20">
                <Shield className="w-3 h-3" />
                <span>Đã xác thực</span>
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f1f3f4] text-[#41484d] border border-[#bccbb9]/30">
                {fieldTypeName}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#575e70]">
              <div className="flex items-center gap-1 text-[#3d4a3d]">
                <MapPin className="w-3.5 h-3.5 text-[#006e2f] shrink-0" />
                <span>
                  {field.address}, {field.district ? `${field.district}, ` : ''}
                  {field.city}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-[#191c1d]">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{reviewSummary.averageRating}</span>
                <span className="font-normal text-[#575e70]">
                  ({reviewSummary.totalReviews} đánh giá)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#575e70]" />
                <span>{field.operatingHours || '06:00 - 23:00 hàng ngày'}</span>
              </div>
            </div>
          </div>

          {/* Social actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFavoriteToggle}
              disabled={toggleFavoriteMutation.isPending}
              className={`rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-all ${isFavorite
                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-[#bccbb9]/60 hover:bg-[#f8f9fa] text-[#191c1d]'
                }`}
            >
              <Heart
                className={`w-4 h-4 mr-1.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-[#575e70]'
                  }`}
              />
              <span>{isFavorite ? 'Đã yêu thích' : 'Yêu thích'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Đã sao chép liên kết sân bóng!');
                }
              }}
              className="rounded-xl px-4 py-2 text-xs font-semibold border-[#bccbb9]/60 hover:bg-[#f8f9fa] text-[#191c1d] cursor-pointer"
            >
              <Share2 className="w-4 h-4 mr-1.5 text-[#575e70]" />
              <span>Chia sẻ</span>
            </Button>
          </div>
        </div>

        {/* 3. Photo Gallery Layout (Responsive for 1 or multiple images) */}
        <div className="mb-10">
          {fieldImages.length === 1 ? (
            /* Single Hero Image */
            <div
              onClick={() => {
                setSelectedPhotoIndex(0);
                setIsGalleryOpen(true);
              }}
              className="relative h-[340px] sm:h-[440px] w-full rounded-3xl overflow-hidden shadow-sm cursor-pointer group border border-[#bccbb9]/40"
            >
              <img
                src={fieldImages[0]}
                alt={field.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-black/80 transition-colors">
                <span>1/1 ảnh • Xem phóng to</span>
              </div>
            </div>
          ) : fieldImages.length === 2 ? (
            /* 2 Images side by side */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-[320px] sm:h-[400px] rounded-3xl overflow-hidden">
              {fieldImages.slice(0, 2).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedPhotoIndex(idx);
                    setIsGalleryOpen(true);
                  }}
                  className="relative h-full w-full overflow-hidden cursor-pointer group border border-[#bccbb9]/30"
                >
                  <img
                    src={img}
                    alt={`${field.name} ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Multi-image grid (3 or more) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[380px] sm:h-[460px] rounded-3xl overflow-hidden shadow-sm">
              {/* Main Featured Photo */}
              <div
                onClick={() => {
                  setSelectedPhotoIndex(0);
                  setIsGalleryOpen(true);
                }}
                className="lg:col-span-6 h-full relative cursor-pointer group overflow-hidden"
              >
                <img
                  src={fieldImages[0]}
                  alt={`${field.name} chính`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
                  Ảnh chính
                </div>
              </div>

              {/* Middle 2 Stacked Photos */}
              <div className="hidden sm:grid lg:col-span-3 grid-rows-2 gap-3 h-full">
                <div
                  onClick={() => {
                    setSelectedPhotoIndex(1);
                    setIsGalleryOpen(true);
                  }}
                  className="relative h-full cursor-pointer group overflow-hidden"
                >
                  <img
                    src={fieldImages[1] || fieldImages[0]}
                    alt={`${field.name} 2`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div
                  onClick={() => {
                    setSelectedPhotoIndex(2);
                    setIsGalleryOpen(true);
                  }}
                  className="relative h-full cursor-pointer group overflow-hidden"
                >
                  <img
                    src={fieldImages[2] || fieldImages[0]}
                    alt={`${field.name} 3`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Right Side Photo with View All Overlay */}
              <div
                onClick={() => {
                  setSelectedPhotoIndex(3 < fieldImages.length ? 3 : 0);
                  setIsGalleryOpen(true);
                }}
                className="hidden lg:block lg:col-span-3 h-full relative cursor-pointer group overflow-hidden"
              >
                <img
                  src={fieldImages[3] || fieldImages[0]}
                  alt={`${field.name} 4`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/45 group-hover:bg-black/55 transition-colors flex flex-col items-center justify-center text-white p-4 text-center">
                  <span className="font-['Manrope'] text-2xl font-black mb-1">
                    +{fieldImages.length}
                  </span>
                  <span className="text-xs font-bold tracking-wide">
                    Xem tất cả ảnh
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Main 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details & Specs (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section A: Giới thiệu & Thông số sân (No awkward sparkles icon) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#bccbb9]/40 shadow-xs">
              <h2 className="font-['Manrope'] text-xl font-extrabold text-[#191c1d] mb-3">
                Giới thiệu & Thông số sân
              </h2>
              <p className="text-sm text-[#575e70] leading-relaxed mb-6">
                {field.description ||
                  `Khu liên hợp sân bóng đá ${field.name} đạt tiêu chuẩn thi đấu, bề mặt cỏ êm ái, hệ thống thoát nước hiện đại và đèn chiếu sáng LED công suất cao phục vụ tối đa cho các trận cầu đỉnh cao.`}
              </p>

              {/* Sub-pitch spec pills */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#575e70] mb-3">
                  Các loại sân tại cơ sở
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subPitches.map((pitch) => (
                    <div
                      key={pitch.id}
                      className="p-3.5 rounded-2xl border border-[#bccbb9]/50 bg-[#f8f9fa] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#191c1d]">
                          {pitch.name}
                        </div>
                        <div className="text-[11px] text-[#575e70]">
                          Mặt cỏ nhân tạo • Đạt chuẩn thi đấu
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#006e2f]">
                        {pitch.pricePerHour.toLocaleString('vi-VN')}đ/h
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities Grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#575e70] mb-3">
                  Tiện ích & Dịch vụ đi kèm
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {DEFAULT_AMENITIES.map((am, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-2xl border border-[#bccbb9]/30 bg-white"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#006e2f]/10 text-[#006e2f] flex items-center justify-center shrink-0">
                        {am.icon === 'Car' && <Car className="w-4 h-4" />}
                        {am.icon === 'Droplets' && (
                          <Droplets className="w-4 h-4" />
                        )}
                        {am.icon === 'Shirt' && <Shirt className="w-4 h-4" />}
                        {am.icon === 'Wifi' && <Wifi className="w-4 h-4" />}
                        {am.icon === 'Lightbulb' && (
                          <Lightbulb className="w-4 h-4" />
                        )}
                        {am.icon === 'Coffee' && <Coffee className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#191c1d]">
                          {am.label}
                        </div>
                        <div className="text-[11px] text-[#575e70]">
                          {am.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section B: Nội quy & Chính sách */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#bccbb9]/40 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[#006e2f]" />
                <h2 className="font-['Manrope'] text-xl font-extrabold text-[#191c1d]">
                  Nội quy & Chính sách đặt sân
                </h2>
              </div>
              <ul className="space-y-3">
                {DEFAULT_RULES.map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-[#575e70] leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#006e2f] shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section C: Vị trí sân bóng (Real Google Maps Embed) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#bccbb9]/40 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#006e2f]" />
                  <h2 className="font-['Manrope'] text-xl font-extrabold text-[#191c1d]">
                    Vị trí sân bóng
                  </h2>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${field.name} ${field.address} TP.HCM`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#006e2f] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Mở Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Real Interactive Google Maps Iframe */}
              <div className="relative h-72 rounded-2xl overflow-hidden border border-[#bccbb9]/40 bg-[#f8f9fa] shadow-xs">
                <iframe
                  title={`Bản đồ vị trí ${field.name}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    `${field.name}, ${field.address}, ${field.district ? `${field.district}, ` : ''}TP.HCM`,
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full"
                />
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-[#bccbb9]/40 shadow-xs flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2 text-xs truncate mr-2">
                    <MapPin className="w-4 h-4 text-[#006e2f] shrink-0" />
                    <span className="font-medium text-[#191c1d] truncate">
                      {field.address},{' '}
                      {field.district ? `${field.district}, ` : ''}
                      {field.city}
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${field.name} ${field.address} TP.HCM`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[#006e2f] text-white text-xs font-semibold hover:bg-[#004b1e] transition-colors"
                  >
                    Chỉ đường
                  </a>
                </div>
              </div>
            </div>

            {/* Section D: Reviews & Ratings Overview */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#bccbb9]/40 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#bccbb9]/30">
                <div>
                  <h2 className="font-['Manrope'] text-xl font-extrabold text-[#191c1d] mb-1">
                    Đánh giá từ cầu thủ & đội bóng
                  </h2>
                  <p className="text-xs text-[#575e70] flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-[#006e2f]" />
                    <span>
                      Đánh giá chân thực từ những người đã hoàn tất đặt sân thực
                      tế
                    </span>
                  </p>
                </div>
                <Button
                  onClick={handleOpenWriteReview}
                  className="bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Viết đánh giá</span>
                </Button>
              </div>

              {/* Rating breakdown summary */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 my-6 p-6 rounded-2xl bg-[#f8f9fa] border border-[#bccbb9]/30 items-center">
                <div className="sm:col-span-4 text-center sm:border-r border-[#bccbb9]/30 sm:pr-6">
                  <div className="font-['Manrope'] font-black text-4xl text-[#191c1d] mb-1">
                    {reviewSummary.averageRating}
                  </div>
                  <div className="flex justify-center mb-1.5">
                    <StarRating
                      value={Number(reviewSummary.averageRating)}
                      size="md"
                      color="amber"
                    />
                  </div>
                  <div className="text-xs text-[#575e70]">
                    Dựa trên {reviewSummary.totalReviews} đánh giá
                  </div>
                </div>

                <div className="sm:col-span-8 space-y-1.5">
                  {(reviewSummary.breakdown || []).map((item) => {
                    return (
                      <div
                        key={item.star}
                        className="flex items-center gap-3 text-xs"
                      >
                        <div className="w-10 flex items-center gap-1 font-bold text-[#575e70]">
                          <span>{item.star}</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </div>
                        <div className="flex-1 h-2 bg-[#e1e3e4] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="w-8 text-right text-[11px] text-[#575e70]">
                          {item.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Reviews list */}
              {reviewsList.length > 0 ? (
                <div className="space-y-4">
                  {reviewsList.slice(0, 3).map((rev) => (
                    <ReviewCard
                      key={rev.id}
                      review={rev}
                      fieldId={field.id}
                      onEdit={(r) => {
                        setEditingReview(r);
                        setIsWriteReviewOpen(true);
                      }}
                      onDelete={(r) => setDeletingReview(r)}
                      onAddComment={handleAddComment}
                    />
                  ))}

                  {reviewsList.length > 3 && (
                    <div className="pt-4 text-center">
                      <Link
                        href={`/fields/${field.id}/reviews`}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-[#006e2f] text-[#006e2f] text-xs font-bold hover:bg-[#006e2f]/10 transition-colors cursor-pointer"
                      >
                        <span>
                          Xem tất cả {reviewSummary.totalReviews} đánh giá
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-[#575e70]">
                  <StarOff className="w-8 h-8 text-[#bccbb9] mx-auto mb-2" />
                  <p className="text-xs">
                    Chưa có bài đánh giá nào cho sân bóng này.
                  </p>
                  <p className="text-[11px] text-[#575e70] mt-1">
                    Hãy hoàn thành lượt đặt sân để trở thành người đầu tiên đánh
                    giá!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget (4 cols) */}
          <div className="lg:col-span-4 sticky top-6 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#bccbb9]/40 shadow-sm">
              {/* Header Price */}
              <div className="flex items-baseline justify-between gap-2 pb-4 mb-5 border-b border-[#bccbb9]/30">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#575e70] block">
                    Giá thuê sân
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-['Manrope'] text-2xl sm:text-3xl font-black text-[#006e2f]">
                      {pricePerHour.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-xs text-[#575e70]">/giờ</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#006e2f]/10 text-[#006e2f]">
                  {fieldTypeName}
                </span>
              </div>

              {/* Step 1: Chọn sân con */}
              <div className="mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#191c1d] mb-2.5">
                  1. Chọn sân thi đấu
                </label>
                <div className="space-y-2">
                  {subPitches.map((p) => {
                    const isSelected = selectedSubPitchId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCustomSubPitchId(p.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${isSelected
                            ? 'border-[#006e2f] bg-[#006e2f]/5 text-[#006e2f] ring-1 ring-[#006e2f]'
                            : 'border-[#bccbb9]/50 hover:bg-[#f8f9fa] text-[#191c1d]'
                          }`}
                      >
                        <span>{p.name}</span>
                        <span className="text-[11px] font-bold">
                          {p.pricePerHour.toLocaleString('vi-VN')}đ/h
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Chọn ngày thi đấu */}
              <div className="mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#191c1d] mb-2.5">
                  2. Chọn ngày đặt sân
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
                  {next7Days.map((day) => {
                    const isSelected = selectedDate === day.dateStr;
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => setCustomDate(day.dateStr)}
                        className={`p-2 rounded-xl text-center transition-all cursor-pointer border ${isSelected
                            ? 'bg-[#006e2f] text-white border-[#006e2f] shadow-xs'
                            : 'bg-white border-[#bccbb9]/40 text-[#191c1d] hover:bg-[#f8f9fa]'
                          }`}
                      >
                        <div className="text-[10px] font-medium opacity-90 truncate">
                          {day.dayName}
                        </div>
                        <div className="text-xs font-bold">
                          {day.displayDate}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Chọn khung giờ 30 phút */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#191c1d]">
                    3. Chọn khung giờ (30p/slot)
                  </label>
                  {selectedSlots.length > 0 && (
                    <span className="text-[11px] font-bold text-[#006e2f]">
                      Đã chọn: {durationHours * 60} phút
                    </span>
                  )}
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {/* Sáng */}
                  <div>
                    <span className="text-[10px] font-bold text-[#575e70] uppercase block mb-1.5">
                      Buổi sáng (06:00 - 12:00)
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIME_INTERVALS.morning.map((slot) => {
                        const isPast = isSlotDisabled(slot);
                        const isSelected = selectedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isPast}
                            onClick={() => handleToggleSlot(slot)}
                            title={isPast ? 'Khung giờ đã qua' : undefined}
                            className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${isPast
                                ? 'bg-gray-100/80 text-[#575e70]/40 border border-gray-200 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'bg-[#006e2f] text-white shadow-xs cursor-pointer'
                                  : 'bg-white border border-[#bccbb9]/40 text-[#191c1d] hover:border-[#006e2f] cursor-pointer'
                              }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chiều */}
                  <div>
                    <span className="text-[10px] font-bold text-[#575e70] uppercase block mb-1.5">
                      Buổi chiều (12:00 - 17:00)
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIME_INTERVALS.afternoon.map((slot) => {
                        const isPast = isSlotDisabled(slot);
                        const isSelected = selectedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isPast}
                            onClick={() => handleToggleSlot(slot)}
                            title={isPast ? 'Khung giờ đã qua' : undefined}
                            className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${isPast
                                ? 'bg-gray-100/80 text-[#575e70]/40 border border-gray-200 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'bg-[#006e2f] text-white shadow-xs cursor-pointer'
                                  : 'bg-white border border-[#bccbb9]/40 text-[#191c1d] hover:border-[#006e2f] cursor-pointer'
                              }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tối */}
                  <div>
                    <span className="text-[10px] font-bold text-[#575e70] uppercase block mb-1.5">
                      Buổi tối (17:00 - 23:00)
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIME_INTERVALS.evening.map((slot) => {
                        const isPast = isSlotDisabled(slot);
                        const isSelected = selectedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isPast}
                            onClick={() => handleToggleSlot(slot)}
                            title={isPast ? 'Khung giờ đã qua' : undefined}
                            className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${isPast
                                ? 'bg-gray-100/80 text-[#575e70]/40 border border-gray-200 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'bg-[#006e2f] text-white shadow-xs cursor-pointer'
                                  : 'bg-white border border-[#bccbb9]/40 text-[#191c1d] hover:border-[#006e2f] cursor-pointer'
                              }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Voucher Input */}
              <div className="mb-6 pt-4 border-t border-[#bccbb9]/30">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#191c1d] mb-2">
                  Mã giảm giá (Voucher)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) =>
                      setVoucherCode(e.target.value.toUpperCase())
                    }
                    placeholder="VD: KICKZONE50, KZ10..."
                    className="flex-1 px-3.5 py-2 text-xs border border-[#bccbb9]/60 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyVoucher}
                    disabled={isValidatingVoucher}
                    className="text-xs font-bold border-[#006e2f] text-[#006e2f] hover:bg-[#006e2f]/10 rounded-xl px-4 cursor-pointer"
                  >
                    {isValidatingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
                  </Button>
                </div>
                {appliedVoucher && (
                  <div className="mt-2 text-xs text-[#006e2f] flex items-center justify-between font-semibold">
                    <span>
                      Mã &quot;{appliedVoucher.code}&quot; đã được áp dụng
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedVoucher(null);
                        setVoucherCode('');
                      }}
                      className="text-rose-500 hover:underline text-[11px] cursor-pointer"
                    >
                      Bỏ mã
                    </button>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#f8f9fa] border border-[#bccbb9]/30 mb-6 text-xs">
                <div className="flex justify-between text-[#575e70]">
                  <span>Thời lượng:</span>
                  <span className="font-bold text-[#191c1d]">
                    {durationHours} giờ ({selectedSlots.length} slot)
                  </span>
                </div>
                <div className="flex justify-between text-[#575e70]">
                  <span>Đơn giá:</span>
                  <span className="font-semibold text-[#191c1d]">
                    {pricePerHour.toLocaleString('vi-VN')}đ/h
                  </span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-[#006e2f] font-semibold">
                    <span>Giảm giá voucher:</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#bccbb9]/30 flex justify-between items-baseline">
                  <span className="font-bold text-[#191c1d] text-sm">
                    Tổng tạm tính:
                  </span>
                  <span className="font-['Manrope'] font-extrabold text-xl text-[#006e2f]">
                    {finalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={selectedSlots.length === 0}
                className="w-full bg-[#006e2f] hover:bg-[#004b1e] disabled:bg-[#bccbb9] text-white font-bold py-3 rounded-2xl transition-all active:scale-98 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {selectedSlots.length === 0
                    ? 'Vui lòng chọn khung giờ'
                    : 'Tiến hành đặt sân'}
                </span>
                {selectedSlots.length > 0 && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Lightbox Modal Gallery */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Đóng thư viện ảnh"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center mb-4">
            <img
              src={fieldImages[selectedPhotoIndex] || fieldImages[0]}
              alt={`${field.name} ${selectedPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-2xl"
            />

            {fieldImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhotoIndex(
                      (selectedPhotoIndex - 1 + fieldImages.length) %
                      fieldImages.length,
                    )
                  }
                  className="absolute left-2 sm:left-4 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all cursor-pointer"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhotoIndex(
                      (selectedPhotoIndex + 1) % fieldImages.length,
                    )
                  }
                  className="absolute right-2 sm:right-4 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all cursor-pointer"
                  aria-label="Ảnh sau"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails row */}
          {fieldImages.length > 1 && (
            <div className="flex gap-2 max-w-xl overflow-x-auto pb-2">
              {fieldImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(i)}
                  className={`w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${selectedPhotoIndex === i
                      ? 'border-[#22c55e] scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Review Eligibility Dialog */}
      {showEligibilityDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#bccbb9]/40 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Info className="w-7 h-7 stroke-[1.8]" />
            </div>

            {eligibilityReason === 'not_logged_in_booking' ? (
              <>
                <h3 className="font-['Manrope'] text-lg font-extrabold text-[#191c1d] mb-2">
                  Yêu cầu đăng nhập tài khoản
                </h3>
                <p className="text-xs text-[#575e70] leading-relaxed mb-6">
                  Bạn cần đăng nhập tài khoản KickZone để tiếp tục tiến hành đặt
                  sân tại <strong>{field.name}</strong>.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Button
                    onClick={() =>
                      router.push(`/login?redirect=/fields/${field.id}`)
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
            ) : eligibilityReason === 'not_logged_in_review' ? (
              <>
                <h3 className="font-['Manrope'] text-lg font-extrabold text-[#191c1d] mb-2">
                  Yêu cầu đăng nhập tài khoản
                </h3>
                <p className="text-xs text-[#575e70] leading-relaxed mb-6">
                  Bạn cần đăng nhập tài khoản KickZone và có ít nhất 1 lượt đặt
                  sân đã hoàn thành tại <strong>{field.name}</strong> để viết
                  bài đánh giá.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Button
                    onClick={() =>
                      router.push(`/login?redirect=/fields/${field.id}`)
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
                    onClick={() => {
                      setShowEligibilityDialog(false);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
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

      {/* 7. Write / Edit Review Modal */}
      <WriteReviewModal
        isOpen={isWriteReviewOpen}
        onClose={() => {
          setIsWriteReviewOpen(false);
          setEditingReview(null);
        }}
        onSubmit={handleCreateOrUpdateReview}
        initialReview={editingReview}
      />

      {/* 8. Delete Review Confirmation Dialog */}
      <DeleteReviewDialog
        isOpen={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
