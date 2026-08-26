export type UserRole = 'USER' | 'ADMIN';

export interface ReviewUser {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  role: UserRole;
  email?: string;
  isCurrentUser?: boolean;
}

export interface ReviewBookingProof {
  id: string;
  code: string;
  fieldName: string;
  fieldImage?: string;
  matchDate: string; // e.g. "15/10/2024" or ISO string
  timeSlot: string; // e.g. "18:00 - 19:30"
  fieldTypeName?: string; // e.g. "Sân 7 người"
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  userId: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user: ReviewUser;
  replyToUserName?: string | null;
  replies?: ReviewComment[];
  likesCount?: number;
  isLiked?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  fieldId: string;
  bookingId: string;
  rating: number; // 1 to 5
  content: string;
  createdAt: string;
  updatedAt?: string;
  user: ReviewUser;
  booking?: ReviewBookingProof;
  comments: ReviewComment[];
  isOwner?: boolean;
  likesCount?: number;
  isLiked?: boolean;
  verifiedBooking?: boolean;
}

export interface RatingBreakdownItem {
  star: number; // 5, 4, 3, 2, 1
  count: number;
  percentage: number; // 0 to 100
}

export function countTotalComments(comments?: ReviewComment[] | null): number {
  if (!comments || !Array.isArray(comments)) return 0;
  return comments.reduce((acc, c) => {
    return acc + 1 + (c.replies ? countTotalComments(c.replies) : 0);
  }, 0);
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  breakdown: RatingBreakdownItem[];
}

export type ReviewStarFilter = 'all' | 5 | 4 | 3 | 2 | 1;
export type ReviewSortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export interface ReviewFilterState {
  star: ReviewStarFilter;
  sortBy: ReviewSortOption;
  page: number;
  limit: number;
}

export interface CreateReviewInput {
  fieldId: string;
  bookingId: string;
  rating: number;
  content: string;
}

export interface UpdateReviewInput {
  reviewId: string;
  rating: number;
  content: string;
}

export interface CreateCommentInput {
  reviewId: string;
  content: string;
  parentId?: string | null;
  replyToUserName?: string | null;
}

export interface ReviewEligibilityResponse {
  canReview: boolean;
  eligibleBookingId?: string;
  currentProfileId?: string;
  existingReviewId?: string;
  reason?: string;
  message?: string;
  bookingProof?: ReviewBookingProof;
}
