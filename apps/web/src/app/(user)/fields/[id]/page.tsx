/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo, use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Star,
  Share2,
  Heart,
  Calendar,
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
  Sparkles,
  Award,
  X,
  Flame,
  MessageSquarePlus,
  ArrowRight,
  StarOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Review } from '@/types/review';
import {
  INITIAL_MOCK_REVIEWS,
  CURRENT_USER,
  calculateReviewSummary,
} from '@/data/mock-reviews';
import { useQuery } from '@tanstack/react-query';
import { fetchFieldById } from '@/lib/api';
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

// ==========================================
// MOCK DATA & DETAILS CHO TỪNG SÂN BÓNG
// ==========================================
interface FieldDetailData {
  id: string;
  name: string;
  location: string;
  address: string;
  district: string;
  city: string;
  rating: number;
  reviewCount: number;
  basePricePerHour: number;
  types: string[];
  subPitches: {
    id: string;
    name: string;
    type: string;
    pricePerHour: number;
  }[];
  images: string[];
  description: string;
  amenities: { icon: string; label: string; desc: string }[];
  rules: string[];
  operatingHours: string;
  reviews: {
    id: string;
    author: string;
    avatar: string;
    date: string;
    rating: number;
    content: string;
    verified: boolean;
  }[];
}

const DEFAULT_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDktZarJ1oqvt1SReM52aUFdOweqHi88lreVI76rs1DV_XDkDaNY9JYH4rZYe0nHJ-ge2Mm79Q51r5QYIDhbltGKpJIi2yTTgYl3S7-NLU6mAdIHWFUz7YOcixGJYO6stA18ZvArjAZCheXucZ96EvvVs__hRiX8OXlRMt6LC0oZ1kR3qSa8mSUXtl0jJ65vsVJw4H5-JWiFQRivO2W6CKIaj1jISy_lTkWCg1afGDdmsbleIm8qMUVyQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCycpjGfVdw9bygMpQMoccFbTMnc-x9vG8Zvo3YQUscucwN2e4E9LVttc9TNuUwhL2_L7uKTkoOzw5QE1F4Sdw227v-4CilRIO_TfTADrs2Bjsko4JN28bmdoyM1CNuHV2Whglz8mjX4dSTlttbE1YuY_xKmNKBELqOnEiiTUlr4cSH_pIwyQ6XR_Iz9G0unlBBylGy4wTCa1dAg-DKn6Tf1tWntfUDuood1RZWpfNGWCNVgleie8Ci7Q',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBt-bw1TY2b112YapIyVjp88DjcP6z2sekO_7Ns--ZTqUbdwA8lvS4k5m6Ry5zfWdqBVEcx-eKfeUVQd_K7AByOtrm_aRkx1PGAdImcM2hwM6c6T5onCYlFqFTusIxLPSBV7fWMi3i5O4KdtT__n3ZS8NB5rgHd9q_5ji6LxZpREQmPUOdA8zVW12napvl8k9cw8uOQZAUXP9hMIVfJSstmwvZUKfPSMbuOroNUu4ZS8E1cm4IQQk8RDQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDvyIQf86mDw18u-k6JPqzTAoH8umHVjvjZQaN2cxRw2XijVaHPW7HID17UiJgfbn4OiEIE4b1YgAnNR8xYwiLeeR5bYjxd9t1ugIWMX28tp9po5jmVzzUQb4YlQJR7kU0syXdxPDR5yF_j0CECDoJh_Y2jLuJUQ0pd4m4WYb13avJ0Wp3Xt_-vT5v2YiSJtlAtuhidkQEhJNnCzMwKGJFe7wuFJqUXeZyWNHZ1CJirMX1faytxZjSblQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDY5ITWfEe64qpM9lq4ObnImkUVdjUmJ_ZA02pyGyzyBHZ5tgrAp-Gh3HDDqDeX7ruD0zoLNtjgJla4p5DuKbsu_Q6wB1QYvi2d4Q62bqruZTpWs9R8SDMY80Ea2J6F9oia3E8VSNJmMSb1SMaqkJ4NReI3pBp1Y2ZmEFdOcbt9kgXkaG9JxTIrSxvhybaVld9L_NUyQBNk-lFTHNZFzjtIfuQDaRcQV_YSqjnIMM7g21luskUOxyXPiw',
];

const FIELDS_DATABASE: Record<string, FieldDetailData> = {
  '1': {
    id: '1',
    name: 'Sân bóng đá Chảo Lửa',
    location: '30 Phan Thúc Duyện, Phường 4, Quận Tân Bình, TP.HCM',
    address: '30 Phan Thúc Duyện, Phường 4, Tân Bình, TP.HCM',
    district: 'Tân Bình',
    city: 'TP. Hồ Chí Minh',
    rating: 4.8,
    reviewCount: 142,
    basePricePerHour: 250000,
    types: ['Sân 5', 'Sân 7'],
    subPitches: [
      {
        id: 'p1',
        name: 'Sân 5 - A1 (Cỏ mới)',
        type: 'Sân 5',
        pricePerHour: 250000,
      },
      {
        id: 'p2',
        name: 'Sân 5 - A2 (Có mái che)',
        type: 'Sân 5',
        pricePerHour: 280000,
      },
      {
        id: 'p3',
        name: 'Sân 7 - B1 (Chuẩn thi đấu)',
        type: 'Sân 7',
        pricePerHour: 450000,
      },
      {
        id: 'p4',
        name: 'Sân 7 - B2 (Đèn LED cao cấp)',
        type: 'Sân 7',
        pricePerHour: 450000,
      },
    ],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDrDOm7rj2skKxqydXGm_2fCgpc8cOSpWpfQNWUjSyk-4a8dJ67OgaVYU9_8gXoZ7zVsNGiHktsLNrqgaBE1jMnGFe72lXAoL0bQmZNUNz0h8Wq87FFOo9oVZ2a87dzJkPll6s7TwgQcznmgYmfIyimnqqxY8RK6lLhDcZ4Bit1ySrjYbD52BLS0WIM6cOxPrR_ocu92EJjPiaknq_yREXKh7BKesXc5k_Se9YStukY_4DUzkvKvmPf1Q',
      ...DEFAULT_IMAGES.slice(1),
    ],
    description:
      'Sân bóng Chảo Lửa là một trong những cụm sân bóng đá cỏ nhân tạo chất lượng hàng đầu tại khu vực Tân Bình. Sân được trang bị cỏ nhân tạo đạt chuẩn FIFA 2 sao, hệ thống chiếu sáng LED chống chói chuẩn thi đấu ban đêm, thoát nước cực tốt khi trời mưa. Không gian thoáng mát, bãi đỗ xe máy và ô tô rộng rãi, căn tin phục vụ giải khát đầy đủ.',
    amenities: [
      {
        icon: 'Car',
        label: 'Bãi giữ xe rộng rãi',
        desc: 'Có chỗ đỗ ô tô và xe máy miễn phí',
      },
      {
        icon: 'Droplets',
        label: 'Nước uống miễn phí',
        desc: 'Bình nước mát lạnh phục vụ tận sân',
      },
      {
        icon: 'Shirt',
        label: 'Phòng thay đồ & Locker',
        desc: 'Tủ có khóa an toàn, phòng tắm nóng lạnh',
      },
      {
        icon: 'Wifi',
        label: 'Wifi tốc độ cao',
        desc: 'Phủ sóng toàn bộ khuôn viên',
      },
      {
        icon: 'Lightbulb',
        label: 'Dàn đèn LED chuẩn',
        desc: 'Độ sáng 500 Lux, không gây chói mắt',
      },
      {
        icon: 'Coffee',
        label: 'Căn tin giải khát',
        desc: 'Đa dạng nước ngọt, nước điện giải, đồ ăn nhẹ',
      },
    ],
    rules: [
      'Vui lòng sử dụng giày đế TF (đinh dăm) hoặc IC (futsal), nghiêm cấm giày đinh sắt SG.',
      'Đến trước giờ đá 10-15 phút để làm thủ tục nhận sân và khởi động.',
      'Nghiêm cấm hút thuốc, xả rác và mang chất kích thích vào khuôn viên sân cỏ.',
      'Hủy sân phải thực hiện trước giờ bắt đầu ít nhất 12 tiếng để được hoàn cọc.',
    ],
    operatingHours: '06:00 - 23:00 hàng ngày',
    reviews: [
      {
        id: 'r1',
        author: 'Nguyễn Văn Hoàng',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        date: '2 ngày trước',
        rating: 5,
        content:
          'Mặt cỏ rất êm, bóng nảy chuẩn. Dàn đèn ban đêm sáng rực rỡ, đá không hề bị tối ở góc biên. Chỗ để xe ô tô thoải mái!',
        verified: true,
      },
      {
        id: 'r2',
        author: 'Trần Minh Trí',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        date: '5 ngày trước',
        rating: 5,
        content:
          'Anh chủ sân và nhân viên hỗ trợ nhiệt tình. Có sẵn áo pitch và bóng thi đấu miễn phí cho đội.',
        verified: true,
      },
      {
        id: 'r3',
        author: 'Lê Quốc Bảo',
        avatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        date: '1 tuần trước',
        rating: 4,
        content:
          'Sân đẹp, giá giờ trưa rất mềm. Cuối tuần hơi đông nên các bạn nhớ đặt sớm trước 2 ngày.',
        verified: true,
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Sân bóng K34',
    location: 'Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP.HCM',
    address: 'Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP.HCM',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    rating: 4.5,
    reviewCount: 98,
    basePricePerHour: 300000,
    types: ['Sân 7'],
    subPitches: [
      {
        id: 'p1',
        name: 'Sân 7 - K1 (Trung tâm)',
        type: 'Sân 7',
        pricePerHour: 300000,
      },
      {
        id: 'p2',
        name: 'Sân 7 - K2 (VIP)',
        type: 'Sân 7',
        pricePerHour: 350000,
      },
    ],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC3Rq8ne4IOVVio5VQy3uaUSlBYmkmgetmT20pt5-fgTOOZgnCBxzUc9RzETSFMsbKADKJZSwChjnHmm_sr-7aKTnl8wkNAZtEcwYF__8UJUJdAzeUDOurOC6k1kWsYiPQVdp31h24McPQ5-4rzObUdgsrTNpsJAA_-3KuLkN342DGPvl8jzGzZshku4eDc86lF7BM8ybPOYP5yojP7TGV8RI_HQAqk0TL_BHfbvXa8h3PlqTTqPEOIVA',
      ...DEFAULT_IMAGES.slice(1),
    ],
    description:
      'Tọa lạc ngay trung tâm Quận 1, Sân K34 là điểm đến quen thuộc của giới văn phòng và các câu lạc bộ bóng đá phong trào. Mặt sân rộng rãi, vị trí đắc địa thuận tiện di chuyển sau giờ làm việc.',
    amenities: [
      { icon: 'Car', label: 'Bãi giữ xe', desc: 'Có người trông giữ 24/7' },
      { icon: 'Droplets', label: 'Nước uống', desc: 'Trà đá miễn phí' },
      { icon: 'Wifi', label: 'Wifi', desc: 'Wifi miễn phí' },
      {
        icon: 'Lightbulb',
        label: 'Đèn cao áp',
        desc: 'Hệ thống đèn LED chiếu sáng ban đêm',
      },
    ],
    rules: [
      'Giữ gìn tư trang cá nhân cẩn thận.',
      'Sử dụng đúng trang phục thể thao và giày đinh phù hợp.',
      'Nghiêm cấm các hành vi bạo lực trên sân.',
    ],
    operatingHours: '06:00 - 22:30 hàng ngày',
    reviews: [
      {
        id: 'r1',
        author: 'Đặng Tuấn Anh',
        avatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        date: '3 ngày trước',
        rating: 5,
        content:
          'Vị trí Quận 1 quá tiện cho anh em văn phòng tụ họp buổi tối sau giờ tan làm.',
        verified: true,
      },
    ],
  },
};

// Fallback generator cho các ID khác
function getFieldById(id: string): FieldDetailData {
  if (FIELDS_DATABASE[id]) {
    return FIELDS_DATABASE[id];
  }
  return {
    id,
    name: `Sân Bóng Đá Phú Thọ - Cụm #${id}`,
    location: '219 Lý Thường Kiệt, Phường 15, Quận 11, TP.HCM',
    address: '219 Lý Thường Kiệt, Phường 15, Quận 11, TP.HCM',
    district: 'Quận 11',
    city: 'TP. Hồ Chí Minh',
    rating: 4.8,
    reviewCount: 124,
    basePricePerHour: 280000,
    types: ['Sân 5', 'Sân 7', 'Sân 11'],
    subPitches: [
      {
        id: `sp-${id}-1`,
        name: 'Sân 5 - Cụm A (Cỏ mới)',
        type: 'Sân 5',
        pricePerHour: 280000,
      },
      {
        id: `sp-${id}-2`,
        name: 'Sân 5 - Cụm B (Có mái che)',
        type: 'Sân 5',
        pricePerHour: 300000,
      },
      {
        id: `sp-${id}-3`,
        name: 'Sân 7 - Cụm C (Chuẩn FIFA)',
        type: 'Sân 7',
        pricePerHour: 500000,
      },
      {
        id: `sp-${id}-4`,
        name: 'Sân 11 - Sân Đại (Thi đấu lớn)',
        type: 'Sân 11',
        pricePerHour: 950000,
      },
    ],
    images: DEFAULT_IMAGES,
    description:
      'Sân Bóng Đá Phú Thọ là một trong những cụm sân bóng đá cỏ nhân tạo đạt chuẩn quốc tế lớn nhất TP.HCM. Với hệ thống chiếu sáng LED hiện đại, mặt cỏ chất lượng cao thường xuyên được bảo dưỡng, sân đáp ứng tốt nhu cầu thi đấu phong trào và các giải đấu lớn. Khu vực đỗ xe rộng rãi, có căn tin phục vụ nước uống và đồ ăn nhẹ.',
    amenities: [
      {
        icon: 'Car',
        label: 'Bãi giữ xe rộng rãi',
        desc: 'Có chỗ đỗ ô tô và xe máy miễn phí',
      },
      {
        icon: 'Droplets',
        label: 'Nước uống miễn phí',
        desc: 'Bình nước mát lạnh phục vụ tận sân',
      },
      {
        icon: 'Shirt',
        label: 'Phòng thay đồ & Locker',
        desc: 'Tủ có khóa an toàn, phòng tắm nóng lạnh',
      },
      {
        icon: 'Wifi',
        label: 'Wifi tốc độ cao',
        desc: 'Phủ sóng toàn bộ khuôn viên',
      },
      {
        icon: 'Lightbulb',
        label: 'Dàn đèn LED chuẩn',
        desc: 'Độ sáng 500 Lux, không gây chói mắt',
      },
      {
        icon: 'Coffee',
        label: 'Căn tin giải khát',
        desc: 'Đa dạng nước ngọt, nước điện giải, đồ ăn nhẹ',
      },
    ],
    rules: [
      'Vui lòng sử dụng giày đế TF (đinh dăm) hoặc IC (futsal), nghiêm cấm giày đinh sắt SG.',
      'Đến trước giờ đá 10-15 phút để làm thủ tục nhận sân và khởi động.',
      'Nghiêm cấm hút thuốc, xả rác và mang chất kích thích vào khuôn viên sân cỏ.',
      'Hủy sân phải thực hiện trước giờ bắt đầu ít nhất 12 tiếng để được hoàn cọc.',
    ],
    operatingHours: '06:00 - 23:00 hàng ngày',
    reviews: [
      {
        id: 'r1',
        author: 'Nguyễn Văn An',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        date: '2 ngày trước',
        rating: 5,
        content:
          'Sân cỏ mới, rất êm. Đèn chiếu sáng tốt, không bị chói. Chỗ để xe rộng rãi thoải mái. Sẽ tiếp tục đặt sân ở đây dài hạn!',
        verified: true,
      },
      {
        id: 'r2',
        author: 'Trần Thị Bích',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        date: '1 tuần trước',
        rating: 5,
        content:
          'Sân đẹp, giá cả hợp lý. Dịch vụ cho thuê bóng và áo pitch rất chu đáo.',
        verified: true,
      },
    ],
  };
}

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

// Khung giờ đã được đặt giả lập
const BOOKED_SLOTS_MAP: Record<string, string[]> = {
  default: ['09:00', '09:30', '17:00', '17:30', '18:30', '19:00', '20:00'],
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

  const { data: apiField, isLoading } = useQuery({
    queryKey: ['field', fieldId],
    queryFn: () => fetchFieldById(fieldId),
    retry: false,
  });

  const field: FieldDetailData = useMemo(() => {
    if (apiField) {
      return {
        ...apiField,
        images:
          apiField.images && apiField.images.length > 0
            ? apiField.images
            : DEFAULT_IMAGES,
      } as FieldDetailData;
    }
    return getFieldById(fieldId);
  }, [apiField, fieldId]);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Favorite state via TanStack Query
  const { data: favoriteData } = useFavoriteStatusQuery(fieldId);
  const toggleFavoriteMutation = useToggleFavoriteMutation(fieldId);
  const isFavorite = Boolean(favoriteData?.is_favorite);

  // Reviews state
  const [reviewsList, setReviewsList] =
    useState<Review[]>(INITIAL_MOCK_REVIEWS);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  const reviewSummary = useMemo(
    () => calculateReviewSummary(reviewsList),
    [reviewsList],
  );

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
          fieldName: field.name,
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

    toast.success('Đã gửi bình luận thành công!');
  };

  // Booking states
  const [selectedSubPitch, setSelectedSubPitch] = useState(
    field.subPitches[0]?.id || 'p1',
  );

  // Next 7 days list
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName =
        i === 0
          ? 'Hôm nay'
          : i === 1
            ? 'Ngày mai'
            : d.toLocaleDateString('vi-VN', { weekday: 'short' });
      const dayFormatted = d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
      dates.push({ iso, dayName, dayFormatted });
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState(
    availableDates[0]?.iso || '',
  );
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  // Current Sub Pitch
  const currentSubPitch = useMemo(
    () =>
      field.subPitches.find((p) => p.id === selectedSubPitch) ||
      field.subPitches[0],
    [field.subPitches, selectedSubPitch],
  );

  const handleChangeSubPitch = (subPitchId: string) => {
    setSelectedSubPitch(subPitchId);
    setSelectedSlots([]);
  };

  const handleChangeDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlots([]);
  };

  // One booking maps to one contiguous start_time/end_time interval.
  const handleToggleSlot = (time: string) => {
    if (BOOKED_SLOTS_MAP.default.includes(time)) return;

    const slotIndex = ALL_TIME_SLOTS.indexOf(time);
    const selectedIndexes = selectedSlots.map((slot) =>
      ALL_TIME_SLOTS.indexOf(slot),
    );
    const minimumIndex = Math.min(...selectedIndexes);
    const maximumIndex = Math.max(...selectedIndexes);

    if (selectedSlots.includes(time)) {
      if (
        selectedSlots.length > 1 &&
        slotIndex !== minimumIndex &&
        slotIndex !== maximumIndex
      ) {
        toast.error('Chỉ có thể bỏ chọn khung giờ ở đầu hoặc cuối dải.');
        return;
      }

      setSelectedSlots((slots) => slots.filter((slot) => slot !== time));
      return;
    }

    if (
      selectedSlots.length > 0 &&
      slotIndex !== minimumIndex - 1 &&
      slotIndex !== maximumIndex + 1
    ) {
      toast.error('Vui lòng chọn các khung giờ liền nhau.');
      return;
    }

    setSelectedSlots((slots) => [...slots, time].sort());
  };

  // Tính toán thời lượng và giá tiền
  const durationHours = (selectedSlots.length * 30) / 60;
  const currentRate = currentSubPitch?.pricePerHour || field.basePricePerHour;
  const originalPrice = Math.round(durationHours * currentRate);
  const discountAmount = Math.min(appliedVoucher?.discount ?? 0, originalPrice);
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  // Xử lý áp dụng voucher
  const handleApplyVoucher = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = voucherCode.trim().toUpperCase();
    if (!clean) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    if (clean === 'KICKZONE50' || clean === 'KZ50') {
      setAppliedVoucher({ code: clean, discount: 50000 });
      toast.success('Đã áp dụng mã giảm giá 50.000đ!');
    } else if (clean === 'KZ10' || clean === 'KZPRO10') {
      const discount = Math.round(originalPrice * 0.1);
      setAppliedVoucher({
        code: clean,
        discount: Math.min(discount, originalPrice),
      });
      toast.success(
        `Đã áp dụng giảm 10% (-${discount.toLocaleString('vi-VN')}đ)!`,
      );
    } else {
      toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  const handleFavoriteToggle = () => {
    toggleFavoriteMutation.mutate();
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết sân bóng vào clipboard!');
    }
  };

  const handleProceedBooking = () => {
    if (selectedSlots.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 khung giờ thi đấu.');
      return;
    }

    const start = selectedSlots[0];
    const end = getSlotEndTime(selectedSlots[selectedSlots.length - 1]);
    // ponytail: sub-pitch is display-only until it has its own database entity.

    const dateObj = availableDates.find((d) => d.iso === selectedDate);
    const dateDisplay = dateObj?.dayFormatted || selectedDate;

    const params = new URLSearchParams({
      fieldId: field.id,
      fieldName: field.name,
      fieldAddress: field.address,
      fieldType: currentSubPitch?.type || 'Sân 7 người',
      courtName: currentSubPitch?.name || 'Sân tiêu chuẩn',
      date: selectedDate,
      dateDisplay,
      startTime: start,
      endTime: end,
      durationHours: durationHours.toString(),
      pricePerHour: currentRate.toString(),
      fieldImage: field.images[0] || '',
      voucher: appliedVoucher?.code || '',
    });

    router.push(`/checkout?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen pb-16 font-sans">
        <div className="bg-white border-b border-[#bccbb9]/40 py-6 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            <div className="h-4 w-48 bg-slate-200 animate-pulse rounded" />
            <div className="h-8 w-80 bg-slate-200 animate-pulse rounded" />
            <div className="h-4 w-96 bg-slate-200 animate-pulse rounded" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 h-72 sm:h-96 lg:h-[430px]">
            <div className="lg:col-span-2 bg-slate-200 animate-pulse rounded-2xl" />
            <div className="hidden lg:flex flex-col gap-3 h-full">
              <div className="h-1/2 bg-slate-200 animate-pulse rounded-xl" />
              <div className="h-1/2 bg-slate-200 animate-pulse rounded-xl" />
            </div>
            <div className="hidden lg:block bg-slate-200 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!apiField && !FIELDS_DATABASE[fieldId]) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 text-emerald-600">
          <MapPin className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#191c1d] mb-2 font-['Manrope']">
          Không tìm thấy sân bóng
        </h1>
        <p className="text-[#575e70] text-sm max-w-md mb-6">
          Sân bóng này không tồn tại hoặc đã bị tạm ngừng hoạt động trên hệ
          thống.
        </p>
        <Link
          href="/fields"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006e2f] text-white font-semibold hover:bg-[#005524] transition-colors shadow-sm"
        >
          Khám phá sân bóng khác
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen pb-16 font-sans">
      {/* ==========================================
          HEADER & BREADCRUMBS
      ========================================== */}
      <div className="bg-white border-b border-[#bccbb9]/40 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-[#575e70] mb-3">
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
            <span className="text-[#191c1d] font-semibold truncate">
              {field.name}
            </span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1d] font-['Manrope']">
                  {field.name}
                </h1>
                <span className="bg-[#22c55e]/15 text-[#006e2f] border border-[#22c55e]/30 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Đã xác thực
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-[#575e70]">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[#006e2f] shrink-0" />
                  <span>{field.address}</span>
                </div>
                <div className="flex items-center gap-1 text-[#006e2f] font-bold">
                  <Star className="w-4 h-4 fill-[#006e2f] text-[#006e2f]" />
                  <span>{field.rating}</span>
                  <span className="text-[#575e70] font-normal">
                    ({field.reviewCount} đánh giá)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#575e70]">
                  <Clock className="w-4 h-4 text-[#575e70] shrink-0" />
                  <span>{field.operatingHours}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleFavoriteToggle}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all ${
                  isFavorite
                    ? 'bg-rose-50 border-rose-300 text-rose-600'
                    : 'bg-white border-[#bccbb9]/60 text-[#575e70] hover:border-rose-400 hover:text-rose-500'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`}
                />
                <span>{isFavorite ? 'Đã lưu' : 'Yêu thích'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#bccbb9]/60 bg-white text-[#575e70] hover:text-[#006e2f] hover:border-[#006e2f] text-xs font-semibold transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          IMAGE GALLERY SECTION (HERO)
      ========================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 h-auto lg:h-[430px]">
          {/* Main Large Image */}
          <div
            onClick={() => setIsLightboxOpen(true)}
            className="lg:col-span-2 relative h-72 sm:h-96 lg:h-full rounded-2xl overflow-hidden shadow-sm border border-[#bccbb9]/40 group cursor-pointer"
          >
            <img
              src={field.images[activeImageIndex] || field.images[0]}
              alt={field.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-white text-xs font-medium bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                Nhấn để xem toàn màn hình
              </span>
            </div>
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium">
              Ảnh {activeImageIndex + 1}/{field.images.length}
            </div>
          </div>

          {/* 2 Middle Thumbnails */}
          <div className="hidden lg:flex flex-col gap-3 h-full">
            <div
              onClick={() => setActiveImageIndex(1 % field.images.length)}
              className="h-1/2 rounded-xl overflow-hidden border border-[#bccbb9]/40 relative group cursor-pointer"
            >
              <img
                src={field.images[1] || field.images[0]}
                alt="Phối cảnh sân"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div
              onClick={() => setActiveImageIndex(2 % field.images.length)}
              className="h-1/2 rounded-xl overflow-hidden border border-[#bccbb9]/40 relative group cursor-pointer"
            >
              <img
                src={field.images[2] || field.images[0]}
                alt="Phòng thay đồ"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Right Thumbnail with "+Ảnh" Overlay */}
          <div
            onClick={() => setIsLightboxOpen(true)}
            className="hidden lg:block h-full rounded-xl overflow-hidden border border-[#bccbb9]/40 relative group cursor-pointer"
          >
            <img
              src={field.images[3] || field.images[0]}
              alt="Hệ thống đèn chiếu sáng"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors flex flex-col items-center justify-center text-white">
              <span className="text-2xl font-bold font-['Manrope']">
                +{field.images.length}
              </span>
              <span className="text-xs font-semibold mt-1">Xem tất cả ảnh</span>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Thumbnail Scroller */}
        <div className="flex lg:hidden gap-2 mt-3 overflow-x-auto pb-2">
          {field.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`w-20 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                activeImageIndex === idx
                  ? 'border-[#006e2f] ring-2 ring-[#006e2f]/20'
                  : 'border-transparent opacity-70'
              }`}
            >
              <img
                src={img}
                alt={`Thumb ${idx}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* ==========================================
          MAIN CONTENT (2-COLUMN GRID)
      ========================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ==========================================
              LEFT COLUMN (8 COLS): DETAILS, AMENITIES, REVIEWS
          ========================================== */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* 1. Giới thiệu sân */}
            <div className="bg-white rounded-2xl p-6 border border-[#bccbb9]/40 shadow-sm">
              <h2 className="text-xl font-bold text-[#191c1d] font-['Manrope'] mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#006e2f]" />
                Giới thiệu & Thông số sân
              </h2>
              <p className="text-[#575e70] text-sm leading-relaxed mb-6">
                {field.description}
              </p>

              {/* Loại sân đang hoạt động */}
              <h3 className="text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-3">
                Các loại sân tại cơ sở
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {field.subPitches.map((pitch) => (
                  <div
                    key={pitch.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      selectedSubPitch === pitch.id
                        ? 'border-[#006e2f] bg-[#006e2f]/5 shadow-sm'
                        : 'border-[#bccbb9]/40 bg-[#f8f9fa] hover:border-[#006e2f]/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#006e2f] border border-[#bccbb9]/40">
                          {pitch.type}
                        </span>
                        <h4 className="font-bold text-sm text-[#191c1d] mt-2">
                          {pitch.name}
                        </h4>
                      </div>
                      <span className="font-extrabold text-[#006e2f] text-sm font-['Manrope']">
                        {pitch.pricePerHour.toLocaleString('vi-VN')}đ
                        <span className="text-xs font-normal text-[#575e70]">
                          /h
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tiện ích sân bóng */}
              <h3 className="text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-3">
                Tiện ích & Dịch vụ đi kèm
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {field.amenities.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f8f9fa] border border-[#bccbb9]/30"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#006e2f]/10 text-[#006e2f] flex items-center justify-center shrink-0">
                      {item.icon === 'Car' && <Car className="w-4 h-4" />}
                      {item.icon === 'Droplets' && (
                        <Droplets className="w-4 h-4" />
                      )}
                      {item.icon === 'Shirt' && <Shirt className="w-4 h-4" />}
                      {item.icon === 'Wifi' && <Wifi className="w-4 h-4" />}
                      {item.icon === 'Lightbulb' && (
                        <Lightbulb className="w-4 h-4" />
                      )}
                      {item.icon === 'Coffee' && <Coffee className="w-4 h-4" />}
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs text-[#191c1d]">
                        {item.label}
                      </h5>
                      <p className="text-[11px] text-[#575e70] mt-0.5 line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Quy định & Nội quy */}
            <div className="bg-white rounded-2xl p-6 border border-[#bccbb9]/40 shadow-sm">
              <h2 className="text-lg font-bold text-[#191c1d] font-['Manrope'] mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#006e2f]" />
                Nội quy & Chính sách đặt sân
              </h2>
              <div className="space-y-2.5">
                {field.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-[#575e70]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#006e2f] shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Vị trí & Bản đồ */}
            <div className="bg-white rounded-2xl p-6 border border-[#bccbb9]/40 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#191c1d] font-['Manrope'] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#006e2f]" />
                  Vị trí sân bóng
                </h2>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(field.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#006e2f] hover:underline flex items-center gap-1"
                >
                  Mở Google Maps <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="relative h-64 rounded-xl overflow-hidden border border-[#bccbb9]/40 bg-slate-100">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNLzIiqbuG_U7K5NpJ_ooV6yInwi26CjDmndTE4w50t8EhHWuTSpFqd4ZbAam_zZ4n8W727b6mCGIXNVq1_Dq4XuolgdyYoreK6L4fe9CGvZaEfo3teSKynOWtro_viGEYxePnYB2BzUvWb_xcLcfyGnuxmwZLNQkHS6a79WXWieJLz47PMBfm1dhmHJKZcUXelvQ-_mqlJWhuPDgFVsrSxKiZxPljr7J5O0mS412KPzEGZgqlNbwBuA"
                  alt="Bản đồ chỉ đường"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-[#bccbb9]/40 shadow flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-4 h-4 text-[#006e2f] shrink-0" />
                    <span className="font-medium text-[#191c1d] truncate">
                      {field.address}
                    </span>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(field.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 ml-2 px-3 py-1 rounded-lg bg-[#006e2f] text-white text-xs font-semibold hover:bg-[#005321] transition-colors"
                  >
                    Chỉ đường
                  </a>
                </div>
              </div>
            </div>

            {/* 4. Đánh giá & Nhận xét từ khách hàng (Tích hợp trọn bộ Design System) */}
            <div className="bg-white rounded-2xl p-6 border border-[#bccbb9]/40 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#bccbb9]/30">
                <div>
                  <h2 className="text-lg font-bold text-[#191c1d] font-['Manrope'] mb-1">
                    Đánh giá từ cầu thủ & đội bóng
                  </h2>
                  <p className="text-xs text-[#575e70]">
                    Đánh giá chân thực từ những người đã hoàn tất đặt sân thực
                    tế
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingReview(null);
                    setIsWriteModalOpen(true);
                  }}
                  className="bg-[#006e2f] hover:bg-[#004b1e] text-white text-xs font-semibold rounded-xl px-4 py-2 self-start sm:self-auto shadow-sm flex items-center gap-1.5"
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

              {/* Customer Reviews List (Top 3 with interactive replies) */}
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
                    Chưa có đánh giá nào cho sân này. Hãy là người đầu tiên đánh
                    giá!
                  </p>
                </div>
              )}

              {/* Link to All Reviews Page */}
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

            {/* Modals for Write/Edit/Delete Reviews */}
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

          {/* ==========================================
              RIGHT COLUMN (4 COLS): STICKY BOOKING WIDGET
          ========================================== */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-6 bg-white rounded-2xl p-6 border border-[#bccbb9]/50 shadow-xl space-y-5">
              {/* Header Widget */}
              <div className="flex justify-between items-end pb-4 border-b border-[#bccbb9]/40">
                <div>
                  <span className="text-xs font-semibold text-[#575e70] uppercase">
                    Giá thuê sân
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#006e2f] font-['Manrope']">
                    {currentRate.toLocaleString('vi-VN')}đ
                    <span className="text-xs font-normal text-[#575e70]">
                      /giờ
                    </span>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#22c55e]/10 text-[#006e2f] font-bold border border-[#22c55e]/20">
                  {currentSubPitch?.type || 'Sân 5'}
                </span>
              </div>

              {/* 1. Chọn Cụm sân / Sub Pitch */}
              <div>
                <label
                  htmlFor="sub-pitch"
                  className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-2"
                >
                  1. Chọn sân thi đấu
                </label>
                <select
                  id="sub-pitch"
                  value={selectedSubPitch}
                  onChange={(e) => handleChangeSubPitch(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#191c1d] outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20 cursor-pointer"
                >
                  {field.subPitches.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.pricePerHour.toLocaleString('vi-VN')}đ/h
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Chọn Ngày (Quick 7 days tabs + Date input) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#191c1d] uppercase tracking-wider">
                    2. Chọn ngày đá
                  </label>
                  <span className="text-[11px] text-[#575e70] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> 7 ngày tới
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-2">
                  {availableDates.map((item) => {
                    const isSelected = selectedDate === item.iso;
                    return (
                      <button
                        key={item.iso}
                        type="button"
                        onClick={() => handleChangeDate(item.iso)}
                        aria-pressed={isSelected}
                        className={`flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-[#006e2f] text-white border-[#006e2f] shadow-sm font-bold scale-[1.03]'
                            : 'bg-[#f8f9fa] text-[#575e70] border-[#bccbb9]/40 hover:border-[#006e2f]/40 text-xs'
                        }`}
                      >
                        <span className="text-[10px] leading-tight font-medium opacity-90">
                          {item.dayName}
                        </span>
                        <span className="text-xs font-bold mt-0.5">
                          {item.dayFormatted}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Chọn Khung giờ (Interactive 30-min slot picker) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#191c1d] uppercase tracking-wider">
                    3. Chọn khung giờ (30p / slot)
                  </label>
                  <div className="flex items-center gap-2 text-[10px] text-[#575e70]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-white border border-[#bccbb9] block" />{' '}
                      Trống
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#006e2f] block" />{' '}
                      Đang chọn
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#edeeef] line-through block" />{' '}
                      Đã đặt
                    </span>
                  </div>
                </div>

                {/* Slot groups */}
                <div className="space-y-2.5 bg-[#f8f9fa] p-3 rounded-xl border border-[#bccbb9]/30">
                  {/* Buổi tối (Giờ cao điểm) */}
                  <div>
                    <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mb-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> Tối & Giờ
                      vàng (17:00 - 23:00)
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIME_INTERVALS.evening.map((slot) => {
                        const isBooked =
                          BOOKED_SLOTS_MAP.default.includes(slot);
                        const isSelected = selectedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            aria-pressed={isSelected}
                            onClick={() => handleToggleSlot(slot)}
                            className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                              isBooked
                                ? 'bg-[#edeeef] text-[#575e70]/50 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'bg-[#006e2f] text-white font-bold shadow-sm'
                                  : 'bg-white text-[#191c1d] border border-[#bccbb9]/50 hover:border-[#006e2f] hover:text-[#006e2f]'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Buổi chiều */}
                  <div>
                    <span className="text-[11px] font-bold text-[#575e70] block mb-1.5">
                      Chiều (12:00 - 17:00)
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIME_INTERVALS.afternoon.map((slot) => {
                        const isBooked =
                          BOOKED_SLOTS_MAP.default.includes(slot);
                        const isSelected = selectedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            aria-pressed={isSelected}
                            onClick={() => handleToggleSlot(slot)}
                            className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                              isBooked
                                ? 'bg-[#edeeef] text-[#575e70]/50 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'bg-[#006e2f] text-white font-bold shadow-sm'
                                  : 'bg-white text-[#191c1d] border border-[#bccbb9]/50 hover:border-[#006e2f] hover:text-[#006e2f]'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Buổi sáng */}
                  <div>
                    <span className="text-[11px] font-bold text-[#575e70] block mb-1.5">
                      Sáng (06:00 - 12:00)
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIME_INTERVALS.morning.map((slot) => {
                        const isBooked =
                          BOOKED_SLOTS_MAP.default.includes(slot);
                        const isSelected = selectedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            aria-pressed={isSelected}
                            onClick={() => handleToggleSlot(slot)}
                            className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                              isBooked
                                ? 'bg-[#edeeef] text-[#575e70]/50 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'bg-[#006e2f] text-white font-bold shadow-sm'
                                  : 'bg-white text-[#191c1d] border border-[#bccbb9]/50 hover:border-[#006e2f] hover:text-[#006e2f]'
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

              {/* 4. Voucher / Mã giảm giá */}
              <div>
                <label
                  htmlFor="voucher-code"
                  className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-2"
                >
                  4. Mã giảm giá
                </label>
                <div className="flex gap-2">
                  <input
                    id="voucher-code"
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Ví dụ: KICKZONE50"
                    className="flex-1 bg-[#f8f9fa] border border-[#bccbb9]/60 rounded-xl px-3 py-2 text-xs uppercase font-bold text-[#191c1d] outline-none focus:border-[#006e2f]"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyVoucher}
                    className="bg-[#006e2f] hover:bg-[#005321] text-white text-xs font-bold px-4 rounded-xl"
                  >
                    Áp dụng
                  </Button>
                </div>
                {/* Gợi ý voucher nhanh */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-[#575e70]">Gợi ý:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherCode('KICKZONE50');
                      setAppliedVoucher({
                        code: 'KICKZONE50',
                        discount: 50000,
                      });
                      toast.success('Đã áp dụng mã KICKZONE50 (-50.000đ)!');
                    }}
                    className="text-[10px] font-bold text-[#006e2f] bg-[#006e2f]/10 px-2 py-0.5 rounded border border-[#006e2f]/20 hover:bg-[#006e2f]/20 transition-colors"
                  >
                    KICKZONE50 (-50k)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherCode('KZ10');
                      const disc = Math.round(originalPrice * 0.1);
                      setAppliedVoucher({ code: 'KZ10', discount: disc });
                      toast.success('Đã áp dụng mã KZ10 (-10%)!');
                    }}
                    className="text-[10px] font-bold text-[#006e2f] bg-[#006e2f]/10 px-2 py-0.5 rounded border border-[#006e2f]/20 hover:bg-[#006e2f]/20 transition-colors"
                  >
                    KZ10 (-10%)
                  </button>
                </div>
              </div>

              {/* 5. Bảng kê tính giá tự động */}
              <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#bccbb9]/40 space-y-2 text-xs">
                <div className="flex justify-between text-[#575e70]">
                  <span>Thời lượng thi đấu:</span>
                  <span className="font-bold text-[#191c1d]">
                    {selectedSlots.length > 0
                      ? `${durationHours} giờ (${selectedSlots.length} slot)`
                      : 'Chưa chọn'}
                  </span>
                </div>
                <div className="flex justify-between text-[#575e70]">
                  <span>Đơn giá sân:</span>
                  <span className="font-medium">
                    {currentRate.toLocaleString('vi-VN')}đ/h
                  </span>
                </div>
                <div className="flex justify-between text-[#575e70]">
                  <span>Tạm tính:</span>
                  <span className="font-bold text-[#191c1d]">
                    {originalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-[#006e2f] font-semibold">
                    <span>Voucher ({appliedVoucher.code}):</span>
                    <span>
                      -{appliedVoucher.discount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#575e70]">
                  <span>Phí dịch vụ & chiếu sáng:</span>
                  <span className="text-[#006e2f] font-semibold">
                    Miễn phí (0đ)
                  </span>
                </div>

                <div className="pt-2 border-t border-[#bccbb9]/40 flex justify-between items-center">
                  <span className="font-extrabold text-sm text-[#191c1d]">
                    Tổng thanh toán:
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-[#006e2f] font-['Manrope'] block">
                      {finalPrice.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-[10px] text-[#575e70]">
                      Đã bao gồm VAT
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary CTA */}
              <Button
                onClick={handleProceedBooking}
                disabled={selectedSlots.length === 0}
                className="w-full py-6 rounded-xl text-base font-bold bg-[#006e2f] hover:bg-[#005321] text-white shadow-lg shadow-[#006e2f]/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Đặt sân ngay
              </Button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-[#575e70] pt-1">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#006e2f]" /> Giữ chỗ tức
                  thì
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#006e2f]" /> Hoàn
                  hủy linh hoạt
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          SIMILAR FIELDS RECOMMENDED (BOTTOM)
      ========================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-[#191c1d] font-['Manrope']">
              Sân bóng tương tự lân cận
            </h3>
            <p className="text-xs text-[#575e70]">
              Các sân bóng cỏ nhân tạo chất lượng tốt khác trong khu vực
            </p>
          </div>
          <Link
            href="/fields"
            className="text-xs font-bold text-[#006e2f] hover:underline flex items-center gap-1"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              id: '2',
              name: 'Sân bóng K34',
              location: 'Nguyễn Thị Minh Khai, Quận 1',
              price: 300000,
              rating: 4.5,
              image:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuC3Rq8ne4IOVVio5VQy3uaUSlBYmkmgetmT20pt5-fgTOOZgnCBxzUc9RzETSFMsbKADKJZSwChjnHmm_sr-7aKTnl8wkNAZtEcwYF__8UJUJdAzeUDOurOC6k1kWsYiPQVdp31h24McPQ5-4rzObUdgsrTNpsJAA_-3KuLkN342DGPvl8jzGzZshku4eDc86lF7BM8ybPOYP5yojP7TGV8RI_HQAqk0TL_BHfbvXa8h3PlqTTqPEOIVA',
            },
            {
              id: '3',
              name: 'Sân ĐH Tôn Đức Thắng',
              location: 'Nguyễn Hữu Thọ, Quận 7',
              price: 800000,
              rating: 4.9,
              image:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuA2xE5yic2QHVvAqARF7Bnyi4HqzWmPfrZDHikx8s3unwe_Ge_sVVJ0ClvSMNaoPL8Fe-1xO9NnM19thd8s-h7uSOUkSSCu1gODikd4Gd-P_mza95dVWCZlhwbFlXdhAiY5m1ljnfxxqwx1loSCGMvEs4WOOG9fu5HhvxQR-37aqtHQ76ihT-Yb35-_2J4oT3iJWU8aoPUzGn9eso_QXWawiSKb436K4Lartu7XiFxnF4I08vv9MXyrOA',
            },
            {
              id: '4',
              name: 'Sân mini Lan Anh',
              location: 'Cách Mạng Tháng 8, Quận 10',
              price: 350000,
              rating: 4.6,
              image:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDrDOm7rj2skKxqydXGm_2fCgpc8cOSpWpfQNWUjSyk-4a8dJ67OgaVYU9_8gXoZ7zVsNGiHktsLNrqgaBE1jMnGFe72lXAoL0bQmZNUNz0h8Wq87FFOo9oVZ2a87dzJkPll6s7TwgQcznmgYmfIyimnqqxY8RK6lLhDcZ4Bit1ySrjYbD52BLS0WIM6cOxPrR_ocu92EJjPiaknq_yREXKh7BKesXc5k_Se9YStukY_4DUzkvKvmPf1Q',
            },
          ].map((item) => (
            <Link key={item.id} href={`/fields/${item.id}`}>
              <div className="bg-white rounded-2xl border border-[#bccbb9]/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                <div className="h-44 relative overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-xs font-semibold bg-[#22c55e] text-[#004b1e]">
                    Còn sân
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#191c1d] group-hover:text-[#006e2f] transition-colors line-clamp-1 mb-1">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[#575e70] text-xs mb-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-[#bccbb9]/30">
                    <span className="text-sm font-extrabold text-[#006e2f] font-['Manrope']">
                      {item.price.toLocaleString('vi-VN')}đ
                      <span className="text-xs font-normal text-[#575e70]">
                        /h
                      </span>
                    </span>
                    <div className="flex items-center text-xs font-bold text-[#006e2f] gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-[#006e2f]" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ==========================================
          MODAL: FULLSCREEN LIGHTBOX IMAGE VIEWER
      ========================================== */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4">
          <div className="flex justify-between items-center text-white pb-3">
            <span className="text-sm font-semibold">
              {field.name} — Ảnh {activeImageIndex + 1}/{field.images.length}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <img
              src={field.images[activeImageIndex]}
              alt="Chi tiết"
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />
          </div>
          <div className="flex justify-center gap-2 overflow-x-auto py-3">
            {field.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  activeImageIndex === idx
                    ? 'border-[#22c55e] scale-105'
                    : 'border-transparent opacity-50'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumb ${idx}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
