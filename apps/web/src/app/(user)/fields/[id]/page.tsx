/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo, use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Star,
  Share2,
  Heart,
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
  Info,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  LayoutGrid,
  ListFilter,
  Layers,
  Sunrise,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { Review } from '@/types/review';
import { calculateReviewSummary } from '@/data/mock-reviews';
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
  fetchAvailability,
  fetchFieldById,
  fetchFieldReviews,
  validateVoucherApi,
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

import {
  businessDateKey,
  durationMinutes as getDurationMinutes,
  formatBusinessDate,
  formatBusinessTime,
  getContiguousAvailableSlots,
} from '@/lib/booking-time';
import { formatFieldTypeName } from '@/lib/utils';
export { formatFieldTypeName };

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

function dateKeyToLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Mini Calendar Component
function BookingCalendar({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(() =>
    dateKeyToLocalDate(selectedDate),
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const todayStr = businessDateKey(new Date());

  // First day of month & number of days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Thứ 2, 6 = CN

  const daysGrid = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({
      day: d,
      dateStr,
      isPast: dateStr < todayStr,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    });
  }

  const monthNames = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];

  return (
    <div className="bg-[#f8f9fa] border border-[#bccbb9]/40 rounded-2xl p-3.5 select-none">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold text-[#191c1d] font-['Manrope']">
          {monthNames[month]}, {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-[#bccbb9]/40 text-[#575e70] hover:text-[#191c1d] transition-colors cursor-pointer"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-[#bccbb9]/40 text-[#575e70] hover:text-[#191c1d] transition-colors cursor-pointer"
            aria-label="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekdays row */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5 text-[10px] font-bold text-[#575e70]">
        <span>T2</span>
        <span>T3</span>
        <span>T4</span>
        <span>T5</span>
        <span>T6</span>
        <span>T7</span>
        <span className="text-rose-500">CN</span>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysGrid.map((item, idx) => {
          if (!item) {
            return <div key={`empty-${idx}`} className="h-8" />;
          }

          const { day, dateStr, isPast, isToday, isSelected } = item;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(dateStr)}
              className={`h-8 rounded-xl text-xs font-semibold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#006e2f] text-white font-bold shadow-xs scale-105 z-10'
                  : isPast
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'bg-white text-[#191c1d] hover:bg-[#006e2f]/10 hover:text-[#006e2f] border border-[#bccbb9]/20'
              }`}
            >
              <span>{day}</span>
              {isToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-[#006e2f] absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: fieldId } = use(params);
  const router = useRouter();

  // 1. Fetch field by ID
  const {
    data: fieldResponse,
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

  const field = fieldResponse?.data;

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
    avatarUrl?: string | null;
    fullName?: string;
  } | null>(null);
  const [showEligibilityDialog, setShowEligibilityDialog] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState<
    | 'not_logged_in_booking'
    | 'not_logged_in_review'
    | 'no_completed_booking'
    | 'already_reviewed'
  >('not_logged_in_booking');

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (isMounted && data.session?.user) {
          const userMeta = data.session.user.user_metadata || {};
          setCurrentUser({
            id: data.session.user.id,
            email: data.session.user.email,
            avatarUrl: userMeta.avatar_url || userMeta.picture || null,
            fullName:
              userMeta.full_name ||
              userMeta.name ||
              data.session.user.email?.split('@')[0] ||
              'Người dùng',
          });
        }
      } catch {
        // ignore
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const queryClient = useQueryClient();

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

  // 3. Favorites state
  const { data: favData } = useFavoriteStatusQuery(fieldId);
  const toggleFavoriteMutation = useToggleFavoriteMutation(fieldId);
  const isFavorite = favData?.is_favorite ?? false;

  const handleToggleFavorite = () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để lưu sân yêu thích.');
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  // 4. Booking selection uses the server's field-wide availability.
  const [selectedDate, setSelectedDate] = useState(() =>
    businessDateKey(new Date()),
  );
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timeSelectionTab, setTimeSelectionTab] = useState<
    'visual' | 'dropdown'
  >('visual');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount: number;
    discountType: 'PERCENT' | 'FIXED';
    startTime: string;
    endTime: string;
    originalPrice: number;
  } | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const availabilityQuery = useQuery({
    queryKey: ['availability', fieldId, selectedDate],
    queryFn: () => fetchAvailability(fieldId, selectedDate),
    enabled: Boolean(field),
    retry: false,
  });
  const availabilitySlots = useMemo(
    () => availabilityQuery.data?.data.slots ?? [],
    [availabilityQuery.data],
  );
  const startSlots = useMemo(
    () => availabilitySlots.filter((slot) => slot.available),
    [availabilitySlots],
  );
  const availabilityWindow = availabilitySlots.length
    ? `${formatBusinessTime(availabilitySlots[0].startTime)} - ${formatBusinessTime(availabilitySlots[availabilitySlots.length - 1].endTime)}`
    : null;
  const selectedSlots = getContiguousAvailableSlots(
    availabilitySlots,
    startTime,
    endTime || undefined,
  );
  const endSlots = startTime
    ? getContiguousAvailableSlots(availabilitySlots, startTime)
    : [];
  const isSelectionValid = Boolean(endTime && selectedSlots.length > 0);

  // Group slots by time tiers / sessions (Sáng, Chiều, Tối)
  const slotGroups = useMemo(() => {
    const morning: typeof availabilitySlots = [];
    const afternoon: typeof availabilitySlots = [];
    const evening: typeof availabilitySlots = [];

    for (const slot of availabilitySlots) {
      const timeStr = formatBusinessTime(slot.startTime);
      const hour = parseInt(timeStr.split(':')[0], 10);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    }

    return [
      {
        id: 'morning' as const,
        label: 'Sáng',
        sublabel: '06:00 - 12:00',
        icon: Sunrise,
        iconColor: 'text-amber-500',
        bgColor: 'bg-amber-50',
        slots: morning,
        availableCount: morning.filter((s) => s.available).length,
      },
      {
        id: 'afternoon' as const,
        label: 'Chiều',
        sublabel: '12:00 - 17:00',
        icon: Sun,
        iconColor: 'text-orange-500',
        bgColor: 'bg-orange-50',
        slots: afternoon,
        availableCount: afternoon.filter((s) => s.available).length,
      },
      {
        id: 'evening' as const,
        label: 'Tối',
        sublabel: '17:00 - 23:00',
        badge: 'Giờ vàng 🔥',
        icon: Moon,
        iconColor: 'text-indigo-500',
        bgColor: 'bg-indigo-50',
        slots: evening,
        availableCount: evening.filter((s) => s.available).length,
      },
    ].filter((group) => group.slots.length > 0);
  }, [availabilitySlots]);

  const [sessionFilter, setSessionFilter] = useState<
    'all' | 'morning' | 'afternoon' | 'evening'
  >('all');

  // 5. Gallery state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // 6. Review state & modals
  const [localReviews] = useState<Review[] | null>(null);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  // Field attributes
  const fieldTypeName = formatFieldTypeName(field?.type);

  // Reviews merged list
  const reviewsList = useMemo(() => {
    if (localReviews !== null) return localReviews;
    if (reviewsResponse?.data) {
      return reviewsResponse.data;
    }
    if (field?.reviews) {
      return field.reviews;
    }
    return [];
  }, [localReviews, reviewsResponse, field]);

  const reviewSummary = useMemo(() => {
    if (localReviews === null && reviewsResponse?.summary) {
      return reviewsResponse.summary;
    }
    if (reviewsList.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        breakdown: [
          { star: 5, count: 0, percentage: 0 },
          { star: 4, count: 0, percentage: 0 },
          { star: 3, count: 0, percentage: 0 },
          { star: 2, count: 0, percentage: 0 },
          { star: 1, count: 0, percentage: 0 },
        ],
      };
    }
    return calculateReviewSummary(reviewsList);
  }, [reviewsResponse, localReviews, reviewsList]);

  // Images list
  const fieldImages = useMemo(() => {
    if (
      field?.images &&
      Array.isArray(field.images) &&
      field.images.length > 0
    ) {
      return field.images
        .map((img) =>
          typeof img === 'string'
            ? img
            : (img.storagePath ?? img.storage_path ?? ''),
        )
        .filter(Boolean);
    }
    if (field?.image) {
      return [field.image];
    }
    return [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    ];
  }, [field]);

  const durationMinutes = isSelectionValid
    ? getDurationMinutes(startTime, endTime)
    : 0;
  const durationHours = durationMinutes / 60;
  const originalPrice = selectedSlots.reduce(
    (sum, slot) => sum + slot.price,
    0,
  );
  const activeVoucher =
    appliedVoucher?.startTime === startTime &&
    appliedVoucher.endTime === endTime &&
    appliedVoucher.originalPrice === originalPrice
      ? appliedVoucher
      : null;
  const discountAmount = activeVoucher?.discount ?? 0;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setStartTime('');
    setEndTime('');
    setAppliedVoucher(null);
  };

  const handleStartTimeChange = (newStart: string) => {
    const slots = getContiguousAvailableSlots(availabilitySlots, newStart);
    setStartTime(newStart);
    setEndTime(slots[0]?.endTime ?? '');
    setAppliedVoucher(null);
  };

  const handleVisualSlotClick = (slot: (typeof availabilitySlots)[number]) => {
    if (!slot.available) {
      toast.error('Khung giờ này đã có người đặt hoặc không khả dụng.');
      return;
    }

    if (!startTime || !endTime) {
      handleStartTimeChange(slot.startTime);
      return;
    }

    const slotStartMs = new Date(slot.startTime).getTime();
    const currentStartMs = new Date(startTime).getTime();
    const currentEndMs = new Date(endTime).getTime();

    if (slot.startTime === startTime) {
      if (currentEndMs > new Date(slot.endTime).getTime()) {
        setEndTime(slot.endTime);
        setAppliedVoucher(null);
      } else {
        setStartTime('');
        setEndTime('');
        setAppliedVoucher(null);
      }
      return;
    }

    if (slotStartMs > currentStartMs) {
      const candidateSlots = getContiguousAvailableSlots(
        availabilitySlots,
        startTime,
        slot.endTime,
      );
      if (candidateSlots.length > 0) {
        setEndTime(slot.endTime);
        setAppliedVoucher(null);
      } else {
        handleStartTimeChange(slot.startTime);
      }
      return;
    }

    handleStartTimeChange(slot.startTime);
  };

  const handleSetQuickDuration = (minutes: number) => {
    const slot = endSlots.find(
      (item) => getDurationMinutes(startTime, item.endTime) === minutes,
    );
    if (!slot) return;
    setEndTime(slot.endTime);
    setAppliedVoucher(null);
  };

  // Voucher validation against real API
  const handleApplyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      toast.error('Vui lòng nhập mã giảm giá.');
      return;
    }

    if (originalPrice <= 0) {
      toast.error('Vui lòng chọn khung giờ hợp lệ trước khi áp dụng voucher.');
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
          startTime,
          endTime,
          originalPrice,
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

  const handleProceedToCheckout = async () => {
    if (!field || !isSelectionValid) {
      toast.error('Vui lòng chọn khung giờ còn trống.');
      return;
    }

    const freshAvailability = await availabilityQuery.refetch();
    const freshSlots = freshAvailability.data?.data.slots ?? [];
    if (!getContiguousAvailableSlots(freshSlots, startTime, endTime).length) {
      setStartTime('');
      setEndTime('');
      setAppliedVoucher(null);
      toast.error('Khung giờ vừa không còn trống. Vui lòng chọn giờ khác.');
      return;
    }

    const queryParams = new URLSearchParams({
      fieldId: field.id,
      startTime,
      endTime,
      voucher: activeVoucher?.code ?? '',
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
    setIsWriteReviewOpen(true);
  };

  // Review actions
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
      setIsWriteReviewOpen(false);
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
      toast.error('Vui lòng đăng nhập để gửi bình luận.');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] pt-6 pb-20 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-48 bg-[#e1e3e4] rounded animate-pulse mb-6" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="space-y-2">
              <div className="h-8 w-72 bg-[#e1e3e4] rounded-lg animate-pulse" />
              <div className="h-4 w-96 bg-[#e1e3e4] rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-[#e1e3e4] rounded-full animate-pulse" />
              <div className="w-10 h-10 bg-[#e1e3e4] rounded-full animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-80 sm:h-[420px] md:h-[480px] lg:h-[500px] mb-8">
            <div className="md:col-span-2 bg-[#e1e3e4] rounded-2xl animate-pulse h-full" />
            <div className="hidden md:flex flex-col gap-3">
              <div className="bg-[#e1e3e4] rounded-2xl animate-pulse flex-1" />
              <div className="bg-[#e1e3e4] rounded-2xl animate-pulse flex-1" />
            </div>
            <div className="hidden md:flex flex-col gap-3">
              <div className="bg-[#e1e3e4] rounded-2xl animate-pulse flex-1" />
              <div className="bg-[#e1e3e4] rounded-2xl animate-pulse flex-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !field) {
    const errorObj = error as { status?: number };
    const is404 = errorObj?.status === 404;

    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#bccbb9]/40 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h2 className="text-xl font-bold font-['Manrope'] text-[#191c1d] mb-2">
            {is404
              ? 'Không tìm thấy sân bóng'
              : 'Đã có lỗi xảy ra khi tải dữ liệu'}
          </h2>
          <p className="text-xs text-[#575e70] mb-6">
            {is404
              ? 'Sân bóng bạn tìm kiếm không tồn tại hoặc đã tạm dừng hoạt động.'
              : 'Không thể kết nối máy chủ để lấy thông tin sân bóng. Vui lòng thử lại sau.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="text-xs font-semibold rounded-xl border-[#bccbb9]/60 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Thử lại
            </Button>
            <Link href="/fields">
              <Button className="text-xs font-bold rounded-xl bg-[#006e2f] hover:bg-[#004b1e] text-white flex items-center gap-1.5 cursor-pointer">
                <Home className="w-4 h-4" /> Về danh sách sân
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displaySelectedDateVN = formatBusinessDate(
    `${selectedDate}T12:00:00+07:00`,
  );

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen pb-20 font-sans">
      {/* 1. Header Navigation & Breadcrumbs */}
      <div className="bg-white border-b border-[#bccbb9]/40 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <nav className="flex items-center gap-2 text-xs text-[#575e70]">
              <Link href="/" className="hover:text-[#006e2f] transition-colors">
                Trang chủ
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href="/fields"
                className="hover:text-[#006e2f] transition-colors"
              >
                Tìm sân
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#191c1d] font-semibold truncate max-w-xs sm:max-w-md">
                {field.name}
              </span>
            </nav>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator
                      .share({
                        title: field.name,
                        text: `Đặt sân bóng ${field.name} trên KickZone`,
                        url: window.location.href,
                      })
                      .catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Đã sao chép liên kết vào clipboard!');
                  }
                }}
                className="p-2 rounded-full border border-[#bccbb9]/60 hover:bg-[#f8f9fa] transition-colors text-[#575e70] hover:text-[#191c1d] cursor-pointer"
                aria-label="Chia sẻ sân bóng"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={toggleFavoriteMutation.isPending}
                className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  isFavorite
                    ? 'border-rose-300 bg-rose-50 text-rose-600'
                    : 'border-[#bccbb9]/60 hover:bg-[#f8f9fa] text-[#575e70] hover:text-rose-600'
                }`}
                aria-label={
                  isFavorite
                    ? 'Bỏ lưu khỏi danh sách yêu thích'
                    : 'Lưu vào danh sách yêu thích'
                }
              >
                <Heart
                  className={`w-4 h-4 transition-transform active:scale-125 ${
                    isFavorite ? 'fill-rose-600' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#006e2f]/10 text-[#006e2f]">
                  {fieldTypeName}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {(field.reviews_count ||
                    field.reviewCount ||
                    reviewSummary.totalReviews) > 0 ? (
                    <>
                      <span>
                        {(
                          field.rating_avg ||
                          field.rating ||
                          reviewSummary.averageRating
                        ).toFixed(1)}
                      </span>
                      <span className="text-[#575e70] font-normal">
                        (
                        {field.reviews_count ||
                          field.reviewCount ||
                          reviewSummary.totalReviews}{' '}
                        đánh giá)
                      </span>
                    </>
                  ) : (
                    <span className="text-[#575e70] font-normal">
                      Chưa có đánh giá
                    </span>
                  )}
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#191c1d] font-['Manrope'] tracking-tight">
                {field.name}
              </h1>
              <p className="mt-1.5 flex items-center gap-1 text-xs sm:text-sm text-[#575e70]">
                <MapPin className="w-4 h-4 text-[#006e2f] shrink-0" />
                <span>{field.address}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Photo Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-3 h-80 sm:h-[420px] md:h-[480px] lg:h-[500px] rounded-3xl overflow-hidden shadow-sm">
          {/* Main Large Image */}
          <div
            className="md:col-span-2 relative h-full group cursor-pointer overflow-hidden bg-slate-200"
            onClick={() => {
              setSelectedPhotoIndex(0);
              setIsGalleryOpen(true);
            }}
          >
            <img
              src={fieldImages[0] || ''}
              alt={`${field.name} ảnh chính`}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-white text-xs font-semibold">
                Xem ảnh phóng to
              </span>
            </div>
          </div>

          {/* Sub images */}
          <div className="hidden md:flex flex-col gap-3 h-full">
            <div
              className="relative flex-1 group cursor-pointer overflow-hidden bg-slate-200 rounded-xl"
              onClick={() => {
                setSelectedPhotoIndex(1);
                setIsGalleryOpen(true);
              }}
            >
              <img
                src={fieldImages[1] || fieldImages[0] || ''}
                alt={`${field.name} ảnh phụ 1`}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div
              className="relative flex-1 group cursor-pointer overflow-hidden bg-slate-200 rounded-xl"
              onClick={() => {
                setSelectedPhotoIndex(2);
                setIsGalleryOpen(true);
              }}
            >
              <img
                src={fieldImages[2] || fieldImages[0] || ''}
                alt={`${field.name} ảnh phụ 2`}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-3 h-full">
            <div
              className="relative flex-1 group cursor-pointer overflow-hidden bg-slate-200 rounded-xl"
              onClick={() => {
                setSelectedPhotoIndex(3);
                setIsGalleryOpen(true);
              }}
            >
              <img
                src={fieldImages[3] || fieldImages[0] || ''}
                alt={`${field.name} ảnh phụ 3`}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div
              className="relative flex-1 group cursor-pointer overflow-hidden bg-slate-200 rounded-xl"
              onClick={() => {
                setSelectedPhotoIndex(4);
                setIsGalleryOpen(true);
              }}
            >
              <img
                src={fieldImages[4] || fieldImages[0] || ''}
                alt={`${field.name} ảnh phụ 4`}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedPhotoIndex(0);
              setIsGalleryOpen(true);
            }}
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-[#191c1d] px-4 py-2 rounded-xl text-xs font-bold shadow-md backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Tất cả {fieldImages.length} ảnh</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content Split Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: 8 COLS */}
          <div className="lg:col-span-8 space-y-8">
            {/* Field Overview Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#bccbb9]/40 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-[#191c1d] font-['Manrope'] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#006e2f]" /> Giới thiệu
                sân bóng
              </h2>

              <p className="text-xs sm:text-sm text-[#575e70] leading-relaxed whitespace-pre-line">
                {field.description ||
                  `Sân bóng ${field.name} là một trong những cụm sân bóng cỏ nhân tạo tiêu chuẩn hàng đầu tại khu vực. Sân được trang bị mặt cỏ chất lượng cao nhập khẩu, giảm thiểu nguy cơ chấn thương cho các cầu thủ. Hệ thống dàn đèn LED chuyên nghiệp đảm bảo ánh sáng thi đấu hoàn hảo cả ban ngày lẫn ban đêm.`}
              </p>

              {/* Badges / Features */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#bccbb9]/30">
                  <span className="text-[11px] text-[#575e70] block">
                    Loại sân
                  </span>
                  <span className="text-xs font-bold text-[#191c1d]">
                    {fieldTypeName}
                  </span>
                </div>
                <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#bccbb9]/30">
                  <span className="text-[11px] text-[#575e70] block">
                    Giờ hoạt động
                  </span>
                  <span className="text-xs font-bold text-[#191c1d]">
                    {typeof field.operatingHours === 'string'
                      ? field.operatingHours
                      : '06:00 - 23:00 hàng ngày'}
                  </span>
                </div>
                <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#bccbb9]/30 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-[#575e70] block">
                    Đảm bảo uy tín
                  </span>
                  <span className="text-xs font-bold text-[#006e2f] flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Chuẩn đối tác KickZone
                  </span>
                </div>
              </div>
            </div>

            {/* Amenities Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#bccbb9]/40 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-[#191c1d] font-['Manrope']">
                Tiện ích tại sân
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(field.amenities || DEFAULT_AMENITIES).map((amenity, idx) => {
                  const getIcon = (iconName: string) => {
                    switch (iconName) {
                      case 'Car':
                        return <Car className="w-5 h-5 text-[#006e2f]" />;
                      case 'Droplets':
                        return <Droplets className="w-5 h-5 text-[#006e2f]" />;
                      case 'Shirt':
                        return <Shirt className="w-5 h-5 text-[#006e2f]" />;
                      case 'Wifi':
                        return <Wifi className="w-5 h-5 text-[#006e2f]" />;
                      case 'Lightbulb':
                        return <Lightbulb className="w-5 h-5 text-[#006e2f]" />;
                      case 'Coffee':
                        return <Coffee className="w-5 h-5 text-[#006e2f]" />;
                      default:
                        return (
                          <CheckCircle2 className="w-5 h-5 text-[#006e2f]" />
                        );
                    }
                  };

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#bccbb9]/30"
                    >
                      <div className="p-2 rounded-xl bg-white border border-[#bccbb9]/40 shrink-0">
                        {getIcon(amenity.icon)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#191c1d]">
                          {amenity.label}
                        </h4>
                        <p className="text-[11px] text-[#575e70] mt-0.5">
                          {amenity.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rules Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#bccbb9]/40 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-[#191c1d] font-['Manrope'] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#006e2f]" /> Quy định sử dụng
                sân
              </h2>
              <ul className="space-y-2.5">
                {(field.rules || DEFAULT_RULES).map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-[#575e70] leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006e2f] mt-1.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* REVIEWS SECTION */}
            <div
              id="reviews-section"
              className="bg-white p-6 sm:p-8 rounded-3xl border border-[#bccbb9]/40 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#bccbb9]/30 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-[#191c1d] font-['Manrope'] flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                    Đánh giá từ khách hàng
                  </h2>
                  <p className="text-xs text-[#575e70] mt-1">
                    Tổng hợp nhận xét thực tế từ các đội bóng đã từng thi đấu
                    tại đây
                  </p>
                </div>

                <Button
                  onClick={handleOpenWriteReview}
                  className="bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-bold rounded-2xl px-4 py-2.5 flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4" /> Viết đánh giá
                </Button>
              </div>

              {/* Review Summary Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl bg-[#f8f9fa] border border-[#bccbb9]/30 items-center">
                <div className="md:col-span-4 text-center md:text-left space-y-1">
                  {reviewSummary.totalReviews > 0 ? (
                    <>
                      <div className="text-4xl sm:text-5xl font-black text-[#191c1d] font-['Manrope']">
                        {reviewSummary.averageRating.toFixed(1)}
                      </div>
                      <div className="flex justify-center md:justify-start">
                        <StarRating
                          rating={Math.round(reviewSummary.averageRating)}
                          size="md"
                        />
                      </div>
                      <p className="text-xs text-[#575e70]">
                        Dựa trên {reviewSummary.totalReviews} lượt đánh giá
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-xl sm:text-2xl font-bold text-[#191c1d] font-['Manrope'] mb-1">
                        Chưa có đánh giá
                      </div>
                      <p className="text-xs text-[#575e70]">
                        Sân này chưa có lượt đánh giá nào từ người chơi
                      </p>
                    </>
                  )}
                </div>

                <div className="md:col-span-8 space-y-1.5">
                  {reviewSummary.breakdown.map((item) => (
                    <div
                      key={item.star}
                      className="flex items-center gap-3 text-xs"
                    >
                      <div className="flex items-center gap-1 w-12 shrink-0 font-semibold text-[#191c1d]">
                        <span>{item.star}</span>
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] text-[#575e70] shrink-0">
                        {item.count}
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
                      currentUserId={effectiveCurrentUserId}
                      currentUser={currentProfile}
                      onEdit={(r) => {
                        setEditingReview(r);
                        setIsWriteReviewOpen(true);
                      }}
                      onDelete={(r) => setDeletingReview(r)}
                      onAddComment={handleAddComment}
                      onEditComment={handleEditComment}
                      onDeleteComment={handleDeleteComment}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-[#f8f9fa] p-8 rounded-xl border border-[#bccbb9]/30 text-center flex flex-col items-center justify-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#bccbb9]/40 flex items-center justify-center mb-2 text-[#575e70]">
                    <StarOff className="w-6 h-6 stroke-[1.8] text-[#575e70]" />
                  </div>
                  <p className="text-xs text-[#575e70]">
                    Chưa có đánh giá nào cho sân này. Hãy là người đầu tiên đánh
                    giá!
                  </p>
                </div>
              )}

              {/* Link to All Reviews */}
              <div className="pt-2 text-center border-t border-[#bccbb9]/30">
                <Link
                  href={`/fields/${fieldId}/reviews`}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#006e2f] hover:underline p-2 rounded-xl transition-all"
                >
                  <span>
                    Xem tất cả {reviewsList.length} đánh giá & bình luận
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 4 COLS STICKY BOOKING WIDGET */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white p-6 rounded-3xl border border-[#bccbb9]/40 shadow-xl space-y-5">
              <div className="flex items-baseline justify-between border-b border-[#bccbb9]/30 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#575e70] block">
                    Đặt sân
                  </span>
                  <span className="font-['Manrope'] text-lg font-black text-[#006e2f]">
                    Lịch chung của sân
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#006e2f]/10 text-[#006e2f]">
                  {fieldTypeName}
                </span>
              </div>

              {/* Step 1: Chọn ngày thi đấu bằng Calendar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#191c1d] flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#006e2f]" />
                    <span>1. Chọn ngày đặt sân</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[#006e2f]">
                    {selectedDate === businessDateKey(new Date())
                      ? 'Hôm nay'
                      : ''}
                  </span>
                </div>

                <BookingCalendar
                  selectedDate={selectedDate}
                  onSelectDate={handleDateChange}
                />

                <p className="text-[11px] text-[#575e70] mt-1.5 px-1 font-medium capitalize">
                  Đã chọn: <strong>{displaySelectedDateVN}</strong>
                </p>
              </div>

              {/* Step 2: Chọn khung giờ từ lịch thực tế */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#191c1d] flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5 text-[#006e2f]" />
                    <span>2. Chọn khung giờ thi đấu</span>
                  </label>
                  {startSlots.length > 0 && (
                    <span className="text-[10px] font-semibold text-[#006e2f] bg-[#006e2f]/10 px-2 py-0.5 rounded-full">
                      {startSlots.length} slot trống
                    </span>
                  )}
                </div>

                {availabilityQuery.isLoading || availabilityQuery.isFetching ? (
                  <p className="rounded-xl bg-[#f8f9fa] p-3 text-xs text-[#575e70]">
                    Đang tải lịch trống...
                  </p>
                ) : availabilityQuery.isError ? (
                  <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                    Không thể tải lịch trống.{' '}
                    <button
                      type="button"
                      onClick={() => void availabilityQuery.refetch()}
                      className="font-bold underline"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : !availabilitySlots.length ? (
                  <p className="rounded-xl bg-[#f8f9fa] p-3 text-xs text-[#575e70]">
                    Sân đóng cửa vào ngày này.
                  </p>
                ) : !startSlots.length ? (
                  <p className="rounded-xl bg-[#f8f9fa] p-3 text-xs text-[#575e70]">
                    Không còn khung giờ trống trong ngày này.
                  </p>
                ) : (
                  <>
                    {/* Tab selection: Trực quan / Dropdown */}
                    <div className="flex bg-[#f1f3f4] p-1 rounded-2xl mb-3 border border-[#bccbb9]/30">
                      <button
                        type="button"
                        onClick={() => setTimeSelectionTab('visual')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          timeSelectionTab === 'visual'
                            ? 'bg-white text-[#006e2f] shadow-xs'
                            : 'text-[#575e70] hover:text-[#191c1d]'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Trực quan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeSelectionTab('dropdown')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          timeSelectionTab === 'dropdown'
                            ? 'bg-white text-[#006e2f] shadow-xs'
                            : 'text-[#575e70] hover:text-[#191c1d]'
                        }`}
                      >
                        <ListFilter className="w-3.5 h-3.5" />
                        <span>Danh sách</span>
                      </button>
                    </div>

                    {/* TAB 1: VISUAL GRID (TIERED SESSIONS) */}
                    {timeSelectionTab === 'visual' && (
                      <div className="space-y-2.5">
                        {/* Session Filter Pills */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                          <button
                            type="button"
                            onClick={() => setSessionFilter('all')}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                              sessionFilter === 'all'
                                ? 'bg-[#006e2f] text-white shadow-2xs'
                                : 'bg-[#f1f3f4] text-[#575e70] hover:bg-gray-200'
                            }`}
                          >
                            Tất cả ({startSlots.length})
                          </button>
                          {slotGroups.map((group) => {
                            const Icon = group.icon;
                            const isFiltered = sessionFilter === group.id;
                            return (
                              <button
                                key={group.id}
                                type="button"
                                onClick={() => setSessionFilter(group.id)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                                  isFiltered
                                    ? 'bg-[#006e2f] text-white shadow-2xs'
                                    : 'bg-[#f1f3f4] text-[#575e70] hover:bg-gray-200'
                                }`}
                              >
                                <Icon
                                  className={`w-3 h-3 ${isFiltered ? 'text-white' : group.iconColor}`}
                                />
                                <span>{group.label}</span>
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded-full font-medium ${
                                    isFiltered
                                      ? 'bg-white/20 text-white'
                                      : 'bg-gray-200/80 text-[#575e70]'
                                  }`}
                                >
                                  {group.availableCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Tiered Session Groups */}
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                          {slotGroups
                            .filter(
                              (group) =>
                                sessionFilter === 'all' ||
                                sessionFilter === group.id,
                            )
                            .map((group) => {
                              const Icon = group.icon;
                              return (
                                <div
                                  key={group.id}
                                  className="rounded-2xl border border-[#bccbb9]/40 bg-white p-2.5 shadow-2xs"
                                >
                                  {/* Session Header */}
                                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#bccbb9]/20 px-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className={`p-1 rounded-lg ${group.bgColor} border border-[#bccbb9]/30`}
                                      >
                                        <Icon
                                          className={`w-3.5 h-3.5 ${group.iconColor}`}
                                        />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-['Manrope'] font-bold text-xs text-[#191c1d]">
                                            Ca {group.label}
                                          </span>
                                          {group.badge && (
                                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30">
                                              {group.badge}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-[#72796f] block">
                                          {group.sublabel}
                                        </span>
                                      </div>
                                    </div>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        group.availableCount > 0
                                          ? 'bg-[#006e2f]/10 text-[#006e2f]'
                                          : 'bg-gray-100 text-gray-400'
                                      }`}
                                    >
                                      {group.availableCount > 0
                                        ? `${group.availableCount} slot trống`
                                        : 'Hết slot'}
                                    </span>
                                  </div>

                                  {/* Slots Grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    {group.slots.map((slot) => {
                                      const isSelected = selectedSlots.some(
                                        (s) => s.startTime === slot.startTime,
                                      );
                                      const isStart =
                                        slot.startTime === startTime;
                                      const isEnd = slot.endTime === endTime;

                                      return (
                                        <button
                                          key={slot.startTime}
                                          type="button"
                                          disabled={!slot.available}
                                          onClick={() =>
                                            handleVisualSlotClick(slot)
                                          }
                                          className={`relative p-2 rounded-xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                                            isSelected
                                              ? 'bg-[#006e2f] text-white border-[#006e2f] shadow-xs scale-[1.02] z-10'
                                              : !slot.available
                                                ? 'bg-gray-100/70 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                                                : 'bg-[#f8f9fa] hover:bg-white text-[#191c1d] border-[#bccbb9]/40 hover:border-[#006e2f] hover:shadow-2xs'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span
                                              className={`text-[11px] font-bold font-['Manrope'] ${
                                                isSelected
                                                  ? 'text-white'
                                                  : !slot.available
                                                    ? 'text-gray-400 line-through'
                                                    : 'text-[#191c1d]'
                                              }`}
                                            >
                                              {formatBusinessTime(
                                                slot.startTime,
                                              )}{' '}
                                              -{' '}
                                              {formatBusinessTime(slot.endTime)}
                                            </span>
                                            {isSelected && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            )}
                                          </div>
                                          <div className="mt-1 flex items-center justify-between text-[10px]">
                                            <span
                                              className={
                                                isSelected
                                                  ? 'text-green-100 font-semibold'
                                                  : !slot.available
                                                    ? 'text-gray-400'
                                                    : 'text-[#006e2f] font-extrabold'
                                              }
                                            >
                                              {slot.available
                                                ? `${slot.price.toLocaleString('vi-VN')}đ`
                                                : 'Đã kín'}
                                            </span>
                                            <span
                                              className={`text-[9px] font-medium ${
                                                isSelected
                                                  ? 'text-green-100'
                                                  : 'text-[#72796f]'
                                              }`}
                                            >
                                              {isStart && isEnd
                                                ? '30p'
                                                : isStart
                                                  ? 'Bắt đầu'
                                                  : isEnd
                                                    ? 'Kết thúc'
                                                    : '30p'}
                                            </span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-between text-[10px] text-[#575e70] px-1 pt-1.5 border-t border-[#bccbb9]/20">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full border border-[#bccbb9] bg-white" />
                            <span>Trống</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#006e2f]" />
                            <span>Đang chọn</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                            <span>Đã kín</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: DROPDOWN */}
                    {timeSelectionTab === 'dropdown' && (
                      <div>
                        <p className="mb-2 text-[11px] text-[#575e70]">
                          {startSlots.length} khung giờ trống · Mở cửa{' '}
                          {availabilityWindow}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-[#575e70] uppercase mb-1">
                              Giờ bắt đầu
                            </label>
                            <select
                              value={startTime}
                              onChange={(event) =>
                                handleStartTimeChange(event.target.value)
                              }
                              className="w-full px-2.5 py-2 text-xs font-bold border border-[#bccbb9]/60 rounded-xl bg-white text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 cursor-pointer"
                            >
                              <option value="" disabled>
                                Chọn giờ
                              </option>
                              {startSlots.map((slot) => (
                                <option
                                  key={slot.startTime}
                                  value={slot.startTime}
                                >
                                  {formatBusinessTime(slot.startTime)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#575e70] uppercase mb-1">
                              Giờ kết thúc
                            </label>
                            <select
                              value={endTime}
                              onChange={(event) => {
                                setEndTime(event.target.value);
                                setAppliedVoucher(null);
                              }}
                              disabled={!endSlots.length}
                              className="w-full px-2.5 py-2 text-xs font-bold border border-[#bccbb9]/60 rounded-xl bg-white text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 cursor-pointer disabled:bg-[#edeeef]"
                            >
                              <option value="" disabled>
                                Chọn giờ
                              </option>
                              {endSlots.map((slot) => (
                                <option key={slot.endTime} value={slot.endTime}>
                                  {formatBusinessTime(slot.endTime)} (
                                  {getDurationMinutes(startTime, slot.endTime)}
                                  p)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Duration Buttons (shared across tabs when startTime is chosen) */}
                    {startTime && (
                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#bccbb9]/20">
                        <span className="text-[10px] text-[#575e70] font-semibold">
                          Chọn nhanh:
                        </span>
                        {[60, 90, 120].map((minutes) => {
                          const available = endSlots.some(
                            (slot) =>
                              getDurationMinutes(startTime, slot.endTime) ===
                              minutes,
                          );
                          return (
                            <button
                              key={minutes}
                              type="button"
                              onClick={() => handleSetQuickDuration(minutes)}
                              disabled={!available}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all border disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer ${
                                durationMinutes === minutes
                                  ? 'bg-[#006e2f] text-white border-[#006e2f]'
                                  : 'bg-white border-[#bccbb9]/50 text-[#575e70] hover:border-[#006e2f] hover:text-[#006e2f]'
                              }`}
                            >
                              {minutes} phút
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Selected Interval Summary */}
                    {isSelectionValid && (
                      <div className="p-2.5 rounded-xl bg-[#006e2f]/10 border border-[#006e2f]/20 flex items-center justify-between text-xs text-[#006e2f] font-semibold mt-2.5">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#006e2f]" />
                          <span>
                            Khung giờ:{' '}
                            <strong>
                              {formatBusinessTime(startTime)} -{' '}
                              {formatBusinessTime(endTime)}
                            </strong>
                          </span>
                        </div>
                        <span className="font-bold bg-[#006e2f] text-white px-2 py-0.5 rounded-lg text-[10px]">
                          {durationMinutes} phút ({durationHours}h)
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Step 4: Voucher Input */}
              <div className="pt-3 border-t border-[#bccbb9]/30">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#191c1d] mb-1.5">
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
                    className="flex-1 px-3 py-2 text-xs border border-[#bccbb9]/60 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyVoucher}
                    disabled={isValidatingVoucher}
                    className="text-xs font-bold border-[#006e2f] text-[#006e2f] hover:bg-[#006e2f]/10 rounded-xl px-3 cursor-pointer"
                  >
                    {isValidatingVoucher ? 'Kiểm tra...' : 'Áp dụng'}
                  </Button>
                </div>
                {activeVoucher && (
                  <div className="mt-1.5 text-xs text-[#006e2f] flex items-center justify-between font-semibold">
                    <span>Mã &quot;{activeVoucher.code}&quot; đã áp dụng</span>
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
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#bccbb9]/30 text-xs">
                <div className="flex justify-between text-[#575e70]">
                  <span>Thời lượng thi đấu:</span>
                  <span className="font-bold text-[#191c1d]">
                    {durationHours} giờ ({durationMinutes} phút)
                  </span>
                </div>
                {activeVoucher && (
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
                onClick={() => void handleProceedToCheckout()}
                disabled={!isSelectionValid || availabilityQuery.isFetching}
                className="w-full bg-[#006e2f] hover:bg-[#004b1e] disabled:bg-[#bccbb9] text-white font-bold py-3 rounded-2xl transition-all active:scale-98 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {availabilityQuery.isFetching
                    ? 'Đang kiểm tra lịch...'
                    : isSelectionValid
                      ? 'Tiến hành đặt sân'
                      : 'Chọn khung giờ còn trống'}
                </span>
                {isSelectionValid && !availabilityQuery.isFetching && (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal Gallery */}
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
                  className={`w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    selectedPhotoIndex === i
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

      {/* Review Eligibility Dialog */}
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
                          setIsWriteReviewOpen(true);
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

      {/* Write / Edit Review Modal */}
      <WriteReviewModal
        isOpen={isWriteReviewOpen}
        onClose={() => {
          setIsWriteReviewOpen(false);
          setEditingReview(null);
        }}
        onSubmit={handleCreateOrUpdateReview}
        initialReview={editingReview}
        bookingProof={eligibilityData?.bookingProof}
      />

      {/* Delete Review Confirmation Dialog */}
      <DeleteReviewDialog
        isOpen={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteReviewMutation.isPending}
      />
    </div>
  );
}
