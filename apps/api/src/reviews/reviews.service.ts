import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedProfile } from '../auth/supabase-auth.guard';
import { CreateReviewDto, UpdateReviewDto } from './dto/reviews.dto';
import {
  CreateReviewCommentDto,
  UpdateReviewCommentDto,
} from './dto/comments.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatFieldTypeName(name?: string | null): string {
  if (!name) return 'Sân tiêu chuẩn';
  const clean = name.trim().toLowerCase();
  if (clean === '5-a-side' || clean === '5' || clean.includes('5')) {
    return 'Sân 5 người';
  }
  if (clean === '7-a-side' || clean === '7' || clean.includes('7')) {
    return 'Sân 7 người';
  }
  if (clean === '11-a-side' || clean === '11' || clean.includes('11')) {
    return 'Sân 11 người';
  }
  return name;
}

export interface ReviewUserData {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  role: string;
  isCurrentUser?: boolean;
}

export interface ReviewBookingProofData {
  id: string;
  code: string;
  fieldName: string;
  matchDate: string;
  timeSlot: string;
  fieldTypeName: string;
}

export interface ReviewCommentData {
  id: string;
  reviewId: string;
  userId: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user: ReviewUserData;
  replyToUserName?: string | null;
  replies?: ReviewCommentData[];
}

export interface ReviewData {
  id: string;
  userId: string;
  fieldId: string;
  bookingId: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  verifiedBooking: boolean;
  user: ReviewUserData;
  booking?: ReviewBookingProofData;
  comments: ReviewCommentData[];
}

export interface ReviewResponse {
  data: ReviewData;
  message: string;
}

export interface ReviewCommentResponse {
  data: ReviewCommentData;
  message: string;
}

export interface DeleteCommentResponse {
  success: boolean;
  message: string;
  id: string;
}

export interface RawReviewCommentWithProfile {
  id: string;
  review_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: Date;
  updated_at: Date;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_path: string | null;
    role: string;
  } | null;
}

export function buildCommentsTree(
  rawComments: RawReviewCommentWithProfile[],
  currentUserId?: string,
): ReviewCommentData[] {
  const userNamesMap = new Map<string, string>();
  for (const c of rawComments) {
    userNamesMap.set(c.id, c.profiles?.full_name || 'Người dùng');
  }

  const map = new Map<string, ReviewCommentData>();
  const roots: ReviewCommentData[] = [];

  for (const c of rawComments) {
    const formatted: ReviewCommentData = {
      id: c.id,
      reviewId: c.review_id,
      userId: c.user_id,
      parentId: c.parent_id,
      content: c.content,
      createdAt: c.created_at
        ? new Date(c.created_at).toISOString()
        : new Date().toISOString(),
      updatedAt: c.updated_at
        ? new Date(c.updated_at).toISOString()
        : undefined,
      user: {
        id: c.profiles?.id || c.user_id,
        fullName: c.profiles?.full_name || 'Người dùng',
        avatarUrl: c.profiles?.avatar_path || null,
        role: c.profiles?.role || 'USER',
        isCurrentUser: currentUserId
          ? c.profiles?.id === currentUserId || c.user_id === currentUserId
          : undefined,
      },
      replyToUserName: c.parent_id
        ? userNamesMap.get(c.parent_id) || null
        : null,
      replies: [],
    };
    map.set(c.id, formatted);
  }

  for (const c of rawComments) {
    const node = map.get(c.id);
    if (!node) continue;
    if (c.parent_id && map.has(c.parent_id)) {
      const parentNode = map.get(c.parent_id);
      parentNode?.replies?.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export interface DeleteReviewResponse {
  success: boolean;
  message: string;
  id: string;
}

export interface ReviewEligibilityResponse {
  canReview: boolean;
  eligibleBookingId?: string;
  currentProfileId?: string;
  existingReviewId?: string;
  reason?: string;
  message?: string;
  bookingProof?: ReviewBookingProofData;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(
    fieldId: string,
    dto: CreateReviewDto,
    profile: AuthenticatedProfile,
  ): Promise<ReviewResponse> {
    if (!fieldId || !UUID_REGEX.test(fieldId)) {
      throw new NotFoundException('Sân bóng không tồn tại.');
    }

    // 1. Check if field exists & active
    const field = await this.prisma.fields.findFirst({
      where: {
        id: fieldId,
        deleted_at: null,
      },
      include: {
        field_types: {
          select: { name: true },
        },
      },
    });

    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại hoặc đã bị xóa.');
    }

    // 2. Resolve & validate eligible booking
    let bookingIdToUse = dto.bookingId;

    if (bookingIdToUse) {
      const booking = await this.prisma.bookings.findFirst({
        where: {
          id: bookingIdToUse,
          user_id: profile.id,
          field_id: fieldId,
        },
        include: {
          reviews: true,
        },
      });

      if (!booking) {
        throw new BadRequestException(
          'Lượt đặt sân không hợp lệ hoặc không thuộc về tài khoản của bạn.',
        );
      }

      if (booking.status !== 'COMPLETED') {
        throw new ForbiddenException(
          'Chỉ lượt đặt sân đã hoàn thành mới có thể gửi đánh giá.',
        );
      }

      if (booking.reviews) {
        throw new BadRequestException('Lượt đặt sân này đã được đánh giá.');
      }
    } else {
      // Find the latest eligible completed booking without a review
      const eligibleBooking = await this.prisma.bookings.findFirst({
        where: {
          user_id: profile.id,
          field_id: fieldId,
          status: 'COMPLETED',
          reviews: null,
        },
        orderBy: {
          start_time: 'desc',
        },
      });

      if (!eligibleBooking) {
        const anyBooking = await this.prisma.bookings.findFirst({
          where: { user_id: profile.id, field_id: fieldId },
        });

        if (!anyBooking) {
          throw new ForbiddenException(
            'Bạn cần có ít nhất một lượt đặt sân đã hoàn thành tại sân này để có thể gửi đánh giá.',
          );
        }

        const anyCompleted = await this.prisma.bookings.findFirst({
          where: {
            user_id: profile.id,
            field_id: fieldId,
            status: 'COMPLETED',
          },
        });

        if (!anyCompleted) {
          throw new ForbiddenException(
            'Lượt đặt sân của bạn chưa hoàn tất trận đấu.',
          );
        }

        throw new BadRequestException(
          'Tất cả các lượt đặt sân đã hoàn thành của bạn tại sân này đều đã được đánh giá.',
        );
      }

      bookingIdToUse = eligibleBooking.id;
    }

    // 3. Create review record
    const review = await this.prisma.reviews.create({
      data: {
        user_id: profile.id,
        field_id: fieldId,
        booking_id: bookingIdToUse,
        rating: dto.rating,
        content: dto.content,
      },
      include: {
        profiles: {
          select: {
            id: true,
            full_name: true,
            avatar_path: true,
            role: true,
          },
        },
        bookings: {
          select: {
            id: true,
            code: true,
            start_time: true,
            end_time: true,
          },
        },
        fields: {
          select: {
            id: true,
            name: true,
            field_types: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      data: {
        id: review.id,
        userId: review.user_id,
        fieldId: review.field_id,
        bookingId: review.booking_id,
        rating: review.rating,
        content: review.content,
        createdAt: review.created_at.toISOString(),
        updatedAt: review.updated_at.toISOString(),
        isOwner: true,
        verifiedBooking: true,
        user: {
          id: review.profiles.id,
          fullName: review.profiles.full_name || 'Khách hàng',
          avatarUrl: review.profiles.avatar_path,
          role: review.profiles.role,
          isCurrentUser: profile
            ? review.profiles.id === profile.id
            : undefined,
        },
        booking: review.bookings
          ? {
              id: review.bookings.id,
              code: review.bookings.code,
              fieldName: review.fields.name,
              matchDate: review.bookings.start_time.toISOString().split('T')[0],
              timeSlot: `${review.bookings.start_time.toISOString().substring(11, 16)} - ${review.bookings.end_time.toISOString().substring(11, 16)}`,
              fieldTypeName: formatFieldTypeName(
                review.fields.field_types?.name,
              ),
            }
          : undefined,
        comments: [],
      },
      message: 'Gửi đánh giá thành công!',
    };
  }

  async updateReview(
    id: string,
    dto: UpdateReviewDto,
    profile: AuthenticatedProfile,
  ): Promise<ReviewResponse> {
    if (!id || !UUID_REGEX.test(id)) {
      throw new NotFoundException('Không tìm thấy bài đánh giá.');
    }

    const review = await this.prisma.reviews.findUnique({
      where: { id },
      include: {
        profiles: {
          select: {
            id: true,
            full_name: true,
            avatar_path: true,
            role: true,
          },
        },
        bookings: {
          select: {
            id: true,
            code: true,
            start_time: true,
            end_time: true,
          },
        },
        fields: {
          select: {
            id: true,
            name: true,
            field_types: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy bài đánh giá.');
    }

    if (review.user_id !== profile.id && profile.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa bài đánh giá này.',
      );
    }

    const updated = await this.prisma.reviews.update({
      where: { id },
      data: {
        ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        updated_at: new Date(),
      },
      include: {
        profiles: {
          select: {
            id: true,
            full_name: true,
            avatar_path: true,
            role: true,
          },
        },
        bookings: {
          select: {
            id: true,
            code: true,
            start_time: true,
            end_time: true,
          },
        },
        fields: {
          select: {
            id: true,
            name: true,
            field_types: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      data: {
        id: updated.id,
        userId: updated.user_id,
        fieldId: updated.field_id,
        bookingId: updated.booking_id,
        rating: updated.rating,
        content: updated.content,
        createdAt: updated.created_at.toISOString(),
        updatedAt: updated.updated_at.toISOString(),
        isOwner: true,
        verifiedBooking: true,
        user: {
          id: updated.profiles.id,
          fullName: updated.profiles.full_name || 'Khách hàng',
          avatarUrl: updated.profiles.avatar_path,
          role: updated.profiles.role,
          isCurrentUser: profile
            ? updated.profiles.id === profile.id
            : undefined,
        },
        booking: updated.bookings
          ? {
              id: updated.bookings.id,
              code: updated.bookings.code,
              fieldName: updated.fields.name,
              matchDate: updated.bookings.start_time
                .toISOString()
                .split('T')[0],
              timeSlot: `${updated.bookings.start_time.toISOString().substring(11, 16)} - ${updated.bookings.end_time.toISOString().substring(11, 16)}`,
              fieldTypeName: formatFieldTypeName(
                updated.fields.field_types?.name,
              ),
            }
          : undefined,
        comments: [],
      },
      message: 'Cập nhật bài đánh giá thành công!',
    };
  }

  async deleteReview(
    id: string,
    profile: AuthenticatedProfile,
  ): Promise<DeleteReviewResponse> {
    if (!id || !UUID_REGEX.test(id)) {
      throw new NotFoundException('Không tìm thấy bài đánh giá.');
    }

    const review = await this.prisma.reviews.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy bài đánh giá.');
    }

    if (review.user_id !== profile.id && profile.role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền xóa bài đánh giá này.');
    }

    await this.prisma.reviews.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Đã xóa bài đánh giá thành công.',
      id,
    };
  }

  async checkEligibility(
    fieldId: string,
    profile: AuthenticatedProfile,
  ): Promise<ReviewEligibilityResponse> {
    if (!fieldId || !UUID_REGEX.test(fieldId)) {
      throw new NotFoundException('Sân bóng không tồn tại.');
    }

    const field = await this.prisma.fields.findFirst({
      where: { id: fieldId, deleted_at: null },
      include: { field_types: true },
    });

    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại hoặc đã bị xóa.');
    }

    // Find unreviewed completed booking
    const eligibleBooking = await this.prisma.bookings.findFirst({
      where: {
        user_id: profile.id,
        field_id: fieldId,
        status: 'COMPLETED',
        reviews: null,
      },
      orderBy: {
        start_time: 'desc',
      },
    });

    if (!eligibleBooking) {
      const existingReview = await this.prisma.reviews.findFirst({
        where: {
          user_id: profile.id,
          field_id: fieldId,
        },
        select: { id: true },
      });

      if (existingReview) {
        return {
          canReview: false,
          currentProfileId: profile.id,
          existingReviewId: existingReview.id,
          reason: 'already_reviewed',
          message:
            'Bạn đã đánh giá các lượt đặt sân đã hoàn thành của mình tại sân này.',
        };
      }

      return {
        canReview: false,
        currentProfileId: profile.id,
        reason: 'no_completed_booking',
        message:
          'Bạn cần có ít nhất một lượt đặt sân đã hoàn thành tại sân này để viết đánh giá.',
      };
    }

    return {
      canReview: true,
      currentProfileId: profile.id,
      eligibleBookingId: eligibleBooking.id,
      bookingProof: {
        id: eligibleBooking.id,
        code: eligibleBooking.code,
        fieldName: field.name,
        matchDate: eligibleBooking.start_time.toISOString().split('T')[0],
        timeSlot: `${eligibleBooking.start_time.toISOString().substring(11, 16)} - ${eligibleBooking.end_time.toISOString().substring(11, 16)}`,
        fieldTypeName: formatFieldTypeName(field.field_types?.name),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Nested Review Comments
  // ---------------------------------------------------------------------------

  async createComment(
    reviewId: string,
    dto: CreateReviewCommentDto,
    profile: AuthenticatedProfile,
  ): Promise<ReviewCommentResponse> {
    if (!reviewId || !UUID_REGEX.test(reviewId)) {
      throw new NotFoundException('Không tìm thấy bài đánh giá.');
    }

    const review = await this.prisma.reviews.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!review) {
      throw new NotFoundException('Bài đánh giá không tồn tại.');
    }

    let parentComment: {
      id: string;
      review_id: string;
      profiles?: { full_name: string | null } | null;
    } | null = null;

    if (dto.parentId) {
      if (!UUID_REGEX.test(dto.parentId)) {
        throw new BadRequestException('Parent ID không hợp lệ.');
      }

      parentComment = await this.prisma.review_comments.findUnique({
        where: { id: dto.parentId },
        select: {
          id: true,
          review_id: true,
          profiles: { select: { full_name: true } },
        },
      });

      if (!parentComment) {
        throw new NotFoundException(
          'Không tìm thấy bình luận gốc được phản hồi.',
        );
      }

      if (parentComment.review_id !== reviewId) {
        throw new BadRequestException(
          'Bình luận được phản hồi không thuộc bài đánh giá này.',
        );
      }
    }

    const comment = await this.prisma.review_comments.create({
      data: {
        review_id: reviewId,
        user_id: profile.id,
        parent_id: dto.parentId || null,
        content: dto.content,
      },
      include: {
        profiles: {
          select: {
            id: true,
            full_name: true,
            avatar_path: true,
            role: true,
          },
        },
      },
    });

    return {
      data: {
        id: comment.id,
        reviewId: comment.review_id,
        userId: comment.user_id,
        parentId: comment.parent_id,
        content: comment.content,
        createdAt: comment.created_at.toISOString(),
        updatedAt: comment.updated_at.toISOString(),
        user: {
          id: comment.profiles?.id || comment.user_id,
          fullName: comment.profiles?.full_name || 'Khách hàng',
          avatarUrl: comment.profiles?.avatar_path || null,
          role: comment.profiles?.role || 'USER',
          isCurrentUser: profile
            ? comment.profiles?.id === profile.id ||
              comment.user_id === profile.id
            : undefined,
        },
        replyToUserName: parentComment?.profiles?.full_name || null,
        replies: [],
      },
      message: 'Gửi bình luận thành công!',
    };
  }

  async getComments(
    reviewId: string,
    profile?: AuthenticatedProfile,
  ): Promise<{ data: ReviewCommentData[] }> {
    if (!reviewId || !UUID_REGEX.test(reviewId)) {
      throw new NotFoundException('Không tìm thấy bài đánh giá.');
    }

    const review = await this.prisma.reviews.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!review) {
      throw new NotFoundException('Bài đánh giá không tồn tại.');
    }

    const comments = await this.prisma.review_comments.findMany({
      where: { review_id: reviewId },
      orderBy: { created_at: 'asc' },
      include: {
        profiles: {
          select: {
            id: true,
            full_name: true,
            avatar_path: true,
            role: true,
          },
        },
      },
    });

    return {
      data: buildCommentsTree(comments, profile?.id),
    };
  }

  async updateComment(
    commentId: string,
    dto: UpdateReviewCommentDto,
    profile: AuthenticatedProfile,
  ): Promise<ReviewCommentResponse> {
    if (!commentId || !UUID_REGEX.test(commentId)) {
      throw new NotFoundException('Không tìm thấy bình luận.');
    }

    const comment = await this.prisma.review_comments.findUnique({
      where: { id: commentId },
      include: {
        parent: {
          select: {
            profiles: { select: { full_name: true } },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận.');
    }

    if (comment.user_id !== profile.id && profile.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa bình luận này.',
      );
    }

    const updated = await this.prisma.review_comments.update({
      where: { id: commentId },
      data: {
        content: dto.content,
        updated_at: new Date(),
      },
      include: {
        profiles: {
          select: {
            id: true,
            full_name: true,
            avatar_path: true,
            role: true,
          },
        },
        parent: {
          select: {
            profiles: { select: { full_name: true } },
          },
        },
      },
    });

    return {
      data: {
        id: updated.id,
        reviewId: updated.review_id,
        userId: updated.user_id,
        parentId: updated.parent_id,
        content: updated.content,
        createdAt: updated.created_at.toISOString(),
        updatedAt: updated.updated_at.toISOString(),
        user: {
          id: updated.profiles?.id || updated.user_id,
          fullName: updated.profiles?.full_name || 'Khách hàng',
          avatarUrl: updated.profiles?.avatar_path || null,
          role: updated.profiles?.role || 'USER',
          isCurrentUser: profile
            ? updated.profiles?.id === profile.id ||
              updated.user_id === profile.id
            : undefined,
        },
        replyToUserName: updated.parent?.profiles?.full_name || null,
        replies: [],
      },
      message: 'Cập nhật bình luận thành công!',
    };
  }

  async deleteComment(
    commentId: string,
    profile: AuthenticatedProfile,
  ): Promise<DeleteCommentResponse> {
    if (!commentId || !UUID_REGEX.test(commentId)) {
      throw new NotFoundException('Không tìm thấy bình luận.');
    }

    const comment = await this.prisma.review_comments.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận.');
    }

    if (comment.user_id !== profile.id && profile.role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này.');
    }

    await this.prisma.review_comments.delete({
      where: { id: commentId },
    });

    return {
      success: true,
      message: 'Đã xóa bình luận thành công.',
      id: commentId,
    };
  }
}
