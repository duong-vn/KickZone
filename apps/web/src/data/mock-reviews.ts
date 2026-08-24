import type {
  Review,
  ReviewSummary,
  ReviewFilterState,
  ReviewBookingProof,
  ReviewUser,
} from '@/types/review';

export const CURRENT_USER: ReviewUser = {
  id: 'usr-current',
  fullName: 'Trần Thanh Vinh',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAgYm0K123lGXsKZu0pl64X1yC3laRZtalHWpzBuOD7kLldqqC7wpbyNkhcjWscVVQWQLV91h46Z9J7AXSfJ_QkORVsZqDyGXbqlrCAE37H9u-b0aGy4CQyGVN7LLfZyRV-SLM21ypfxo2rF_igwF2CyHtPmyoZdc-aLw2gIga7oj8U2B7KPk--wplVn9Y6Yo9l9GACrZYjM04Lu3OgQ2oamPqN-XXyCzf5efT15YC9eeCxSyJ4vKqX8Q',
  role: 'USER',
  email: 'vinh.kickzone@gmail.com',
  isCurrentUser: true,
};

export const ADMIN_USER: ReviewUser = {
  id: 'usr-admin-01',
  fullName: 'Quản lý Sân (Admin)',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDlTmUXdV3yJ8YOHvv8B5tMMyUCUhBh29fs1XkXjJp9Cs9cHzGFjUSLANR95ybkzcqKzJOYVlIDhoPTA1S1MTTdwFUkY3mCLXx2NN4i08YiPviQaRbC_uD-4aFgtIdFcKhY9Vl-xM_Pw5cSjNlkPqHK9SnFE5A_gcm4F9wDiVbxxWxYoqSazk0HJUS8D-01IuVzCGGI2padLhU34ouC9fokAgitonf95GeZqSVtw8gg4hgvMfBRpst2jg',
  role: 'ADMIN',
  email: 'admin@kickzone.vn',
};

export const MOCK_BOOKING_PROOF: ReviewBookingProof = {
  id: 'bk-comp-889',
  code: 'KZ-BK-889',
  fieldName: 'Sân Bóng Chảo Lửa',
  fieldImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBkmatfM6g1ii50zTvB6R9j-6k2skc4U286lGAWQAhd36SohYfvYu21nkAmW2TdrQXkoca2gl9LEgwuKXbA22I4Au4P8ZtxUQkx4ErUs9ALbCwFEjGNAdETf-GBfeTFK4zHPXqdMFG_919m9H5IbpMoppwNas3sebbHY436wU4z-iOjJTl_Wzwksx1q6zvGfDIahLxhqCn0FWaY7wybmZrbfJShBt9fqNKmKB78budjwfsXbdP-QEH4TQ',
  matchDate: '15/10/2024',
  timeSlot: '18:00 - 19:30',
  fieldTypeName: 'Sân 7 người',
};

export const INITIAL_MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-01',
    userId: 'usr-01',
    fieldId: '1',
    bookingId: 'bk-01',
    rating: 5,
    content:
      'Sân đẹp, cỏ êm, đèn sáng rõ. Anh chủ sân rất nhiệt tình. Chắc chắn sẽ quay lại dài hạn.',
    createdAt: '2026-08-22T14:30:00.000Z',
    verifiedBooking: true,
    user: {
      id: 'usr-01',
      fullName: 'Nguyễn Văn A',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCRGZF6mrxAK5ddDS_YpFBLq_PQ1nQh-2UPtO3hbBZP2R559AItxz_fnc74YLTcMO68fU005UbSfgebEfFlx-52p9ymaWcxXWzu6ExioQqmNsR1mlQuuCNRj-OvJp3a_EIB4XL4F-o3kgCkBozIK1aAFSMhqzpox71ej5Xl_YmwSCxhKgkPSQPSlXVVeeskpV9b5Ee6ttr6akmKO4hY53_27uWA_BrlzZcZESXOaYvsaQOrP9Mc1jOLOw',
      role: 'USER',
    },
    booking: {
      id: 'bk-01',
      code: 'KZ-BK-001',
      fieldName: 'Sân Bóng Chảo Lửa',
      matchDate: '20/08/2026',
      timeSlot: '18:30 - 20:00',
      fieldTypeName: 'Sân 7 người',
    },
    comments: [
      {
        id: 'comm-01',
        reviewId: 'rev-01',
        userId: 'usr-admin-01',
        content:
          'Cảm ơn bạn đã ủng hộ sân! Rất mong được đón tiếp đội mình lần tới.',
        createdAt: '2026-08-23T08:15:00.000Z',
        user: ADMIN_USER,
      },
      {
        id: 'comm-02',
        reviewId: 'rev-01',
        userId: 'usr-03',
        content: 'Sân này có hay đông vào cuối tuần không bạn?',
        createdAt: '2026-08-23T14:00:00.000Z',
        user: {
          id: 'usr-03',
          fullName: 'Hoàng Nam',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBQyLMtRycLd2T-naLhPg9QNIXSMx48RJmCfOHY4R4U8A5QI6m2SABy0tmbhq8Fkc5uYRMDC0SpoUHM1kfWkmv-vC_RnD2vExhUkd4hIhaijbbKg_p4HKgZ2qWIFZ_ylJt9FbT5vn3Vjc26TSdNI9lpcwTxp4-TmyMDx_fTpRceSuNBoweWcB2woaENcjKOdz0xd2fbaPh5ofnJYFxLoq9285b5biRx-Ymr8aIJ4HgJk6NUb98VmlTABw',
          role: 'USER',
        },
        replies: [
          {
            id: 'comm-03',
            reviewId: 'rev-01',
            userId: 'usr-01',
            parentId: 'comm-02',
            replyToUserName: 'Hoàng Nam',
            content:
              '@Hoàng Nam Cuối tuần khá đông bạn nhé, bạn nên đặt trước khoảng 2-3 ngày để giữ được khung giờ vàng.',
            createdAt: '2026-08-23T16:20:00.000Z',
            user: {
              id: 'usr-01',
              fullName: 'Nguyễn Văn A',
              avatarUrl:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCRGZF6mrxAK5ddDS_YpFBLq_PQ1nQh-2UPtO3hbBZP2R559AItxz_fnc74YLTcMO68fU005UbSfgebEfFlx-52p9ymaWcxXWzu6ExioQqmNsR1mlQuuCNRj-OvJp3a_EIB4XL4F-o3kgCkBozIK1aAFSMhqzpox71ej5Xl_YmwSCxhKgkPSQPSlXVVeeskpV9b5Ee6ttr6akmKO4hY53_27uWA_BrlzZcZESXOaYvsaQOrP9Mc1jOLOw',
              role: 'USER',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'rev-02',
    userId: 'usr-02',
    fieldId: '1',
    bookingId: 'bk-02',
    rating: 4,
    content:
      'Vị trí trung tâm, dễ tìm. Tuy nhiên giờ cao điểm hơi đông đúc ở khu vực gửi xe.',
    createdAt: '2026-08-17T09:10:00.000Z',
    verifiedBooking: true,
    user: {
      id: 'usr-02',
      fullName: 'Trần Thị B',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBQyLMtRycLd2T-naLhPg9QNIXSMx48RJmCfOHY4R4U8A5QI6m2SABy0tmbhq8Fkc5uYRMDC0SpoUHM1kfWkmv-vC_RnD2vExhUkd4hIhaijbbKg_p4HKgZ2qWIFZ_ylJt9FbT5vn3Vjc26TSdNI9lpcwTxp4-TmyMDx_fTpRceSuNBoweWcB2woaENcjKOdz0xd2fbaPh5ofnJYFxLoq9285b5biRx-Ymr8aIJ4HgJk6NUb98VmlTABw',
      role: 'USER',
    },
    booking: {
      id: 'bk-02',
      code: 'KZ-BK-002',
      fieldName: 'Sân Bóng Chảo Lửa',
      matchDate: '16/08/2026',
      timeSlot: '17:00 - 18:30',
      fieldTypeName: 'Sân 5 người',
    },
    comments: [
      {
        id: 'comm-04',
        reviewId: 'rev-02',
        userId: 'usr-admin-01',
        content:
          'Cảm ơn bạn đã ủng hộ sân. Về vấn đề bãi đỗ xe, sân đang tiến hành mở rộng thêm khu vực phía sau, dự kiến hoàn thành vào tháng tới. Rất mong được đón tiếp team bạn lần sau!',
        createdAt: '2026-08-17T15:30:00.000Z',
        user: ADMIN_USER,
        replies: [
          {
            id: 'comm-05',
            reviewId: 'rev-02',
            userId: 'usr-01',
            parentId: 'comm-04',
            replyToUserName: 'Quản lý Sân (Admin)',
            content:
              '@Quản lý Sân (Admin) Tuyệt vời quá, cảm ơn admin đã phản hồi nhanh chóng!',
            createdAt: '2026-08-18T08:00:00.000Z',
            user: {
              id: 'usr-01',
              fullName: 'Nguyễn Văn A',
              avatarUrl:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAMFP4kiuyEA8t8nkTov_UIMQDT22IQYNy3mMMZhtvcsz-PGUsF4sz4nbhnG-n3N4QcZo04ut5PcHbSYVISguqjLHc4bXdeGkP5Oupy6171DcIQfFpvYyNtw3j-0wufqbLC8X6l8i2V3GfgJKi5a4k71dR2dWDsj_qOaS6WNZCPb4mOY8eJApNTVoHDx6mcWF7nXtuESTzzI8aNikIG65odPTEPvrzP9dHuiKXay9ekyksmp4C6yog20A',
              role: 'USER',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'rev-03',
    userId: 'usr-04',
    fieldId: '1',
    bookingId: 'bk-03',
    rating: 5,
    content:
      'Chất lượng mặt cỏ khá tốt so với mặt bằng chung. Nước uống ở căng tin giá cả hợp lý. Đội mình hay đá sân 7 ở đây thấy rất ưng ý.',
    createdAt: '2026-08-10T19:45:00.000Z',
    verifiedBooking: true,
    user: {
      id: 'usr-04',
      fullName: 'Lê Văn C',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDW78_ekrho6Zad1wvREhFCY8tapItNzzp10tSOQjhtaW-2cBDeHDeYeIYHLuCUTfPbH1zklJp1ONf8IpYyzhoajv8nbDwFTsbHgU8uhlsBXLelqaZf4Rv9auiszCyAGbWGISjqQVbUVGx0QmDffbTEuJD64mklZcbGokc9OUJEtm3YhjK7NvV0LZL0cMen6N5n9Hz0gS8GWpyiTqpAewnTnBz6Nlx1GFl1F6iWmDKpagSkv5w7atXcHg',
      role: 'USER',
    },
    booking: {
      id: 'bk-03',
      code: 'KZ-BK-003',
      fieldName: 'Sân Bóng Chảo Lửa',
      matchDate: '09/08/2026',
      timeSlot: '19:30 - 21:00',
      fieldTypeName: 'Sân 7 người',
    },
    comments: [
      {
        id: 'comm-06',
        reviewId: 'rev-03',
        userId: 'usr-05',
        content:
          'Sân này giá rổ thế nào vậy bạn? Đang định rủ team đá tối thứ 6.',
        createdAt: '2026-08-11T10:00:00.000Z',
        user: {
          id: 'usr-05',
          fullName: 'Trần Bình',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuC-fKc7nA3vxPoZI6bp6V3YMuZEOnAiQ7xkiohER5wSo1X2QlzR269WN5JcXg6W9mLYGOzCcq6wsRz9sabz-489dMukHkWVDVcZk0U_BsgWsqBwioYDE9oON4ckToLRcRCp3a_ZlfyiCB_7d8G8xDNAIac-AMMs1o_7G8xpbOYkDMSfizstBuesvz_XnreJw-PVI6WOEUrZAf58olcgcoIc4R7_KVdrssIwQlwuukEzNb2fSeFGZ-bI-A',
          role: 'USER',
        },
      },
    ],
  },
  {
    id: 'rev-04',
    userId: 'usr-06',
    fieldId: '1',
    bookingId: 'bk-04',
    rating: 5,
    content:
      'Đặt sân qua app nhanh gọn, đến nơi là đá luôn không phải chờ đợi. Sân mới nâng cấp dàn đèn pha nên đá tối rất sướng mắt.',
    createdAt: '2026-07-25T11:00:00.000Z',
    verifiedBooking: true,
    user: {
      id: 'usr-06',
      fullName: 'Phạm Đình D',
      avatarUrl: null,
      role: 'USER',
    },
    booking: {
      id: 'bk-04',
      code: 'KZ-BK-004',
      fieldName: 'Sân Bóng Chảo Lửa',
      matchDate: '24/07/2026',
      timeSlot: '20:00 - 21:30',
      fieldTypeName: 'Sân 5 người',
    },
    comments: [],
  },
  {
    id: 'rev-05',
    userId: CURRENT_USER.id,
    fieldId: '1',
    bookingId: 'bk-05',
    rating: 5,
    content:
      'Dịch vụ rất chu đáo, sân mới thay cỏ nên chạy rất bám giày, không bị trơn trượt. Sẽ đặt định kỳ hàng tuần cho anh em công ty.',
    createdAt: '2026-08-23T20:00:00.000Z',
    verifiedBooking: true,
    isOwner: true,
    user: CURRENT_USER,
    booking: {
      id: 'bk-05',
      code: 'KZ-BK-005',
      fieldName: 'Sân Bóng Chảo Lửa',
      matchDate: '23/08/2026',
      timeSlot: '19:00 - 20:30',
      fieldTypeName: 'Sân 7 người',
    },
    comments: [],
  },
];

// In-memory reviews store to support interactive client state across components
let reviewsStore: Review[] = [...INITIAL_MOCK_REVIEWS];

export function getReviewsStore(): Review[] {
  return reviewsStore;
}

export function setReviewsStore(newReviews: Review[]): void {
  reviewsStore = newReviews;
}

export function getReviewsByFieldId(fieldId: string): Review[] {
  // Normalize fieldId (match '1', 'field-01', 'san-chao-lua', or fallback to all for demo)
  const matched = reviewsStore.filter(
    (r) =>
      r.fieldId === fieldId ||
      (fieldId === '1' && r.fieldId === 'field-01') ||
      (fieldId === 'field-01' && r.fieldId === '1'),
  );
  return matched.length > 0 ? matched : reviewsStore;
}

export function getReviewById(reviewId: string): Review | undefined {
  return reviewsStore.find((r) => r.id === reviewId);
}

export function calculateReviewSummary(reviews: Review[]): ReviewSummary {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 5.0,
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

  // Base counts
  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRatingSum = 0;

  reviews.forEach((rev) => {
    const star = Math.min(5, Math.max(1, Math.round(rev.rating)));
    starCounts[star] = (starCounts[star] || 0) + 1;
    totalRatingSum += rev.rating;
  });

  const total = reviews.length;
  const avg = Number((totalRatingSum / total).toFixed(1));

  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = starCounts[star] || 0;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return { star, count, percentage };
  });

  return {
    averageRating: avg,
    totalReviews: total,
    breakdown,
  };
}

export function filterAndSortReviews(
  reviews: Review[],
  filter: ReviewFilterState,
): { items: Review[]; total: number; totalPages: number } {
  let filtered = [...reviews];

  // 1. Star Filter
  if (filter.star !== 'all') {
    filtered = filtered.filter((r) => Math.round(r.rating) === filter.star);
  }

  // 2. Sort
  filtered.sort((a, b) => {
    switch (filter.sortBy) {
      case 'newest':
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / filter.limit) || 1;
  const startIndex = (filter.page - 1) * filter.limit;
  const items = filtered.slice(startIndex, startIndex + filter.limit);

  return {
    items,
    total,
    totalPages,
  };
}
