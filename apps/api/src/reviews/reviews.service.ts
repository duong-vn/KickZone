import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedProfile } from '../auth/supabase-auth.guard';
import { CreateReviewDto, UpdateReviewDto } from './dto/reviews.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  comments: unknown[];
}

export interface ReviewResponse {
  data: ReviewData;
  message: string;
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
          isCurrentUser: true,
        },
        booking: review.bookings
          ? {
              id: review.bookings.id,
              code: review.bookings.code,
              fieldName: review.fields.name,
              matchDate: review.bookings.start_time.toISOString().split('T')[0],
              timeSlot: `${review.bookings.start_time.toISOString().substring(11, 16)} - ${review.bookings.end_time.toISOString().substring(11, 16)}`,
              fieldTypeName:
                review.fields.field_types?.name || 'Sân tiêu chuẩn',
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
          isCurrentUser: true,
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
              fieldTypeName:
                updated.fields.field_types?.name || 'Sân tiêu chuẩn',
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
        fieldTypeName: field.field_types?.name || 'Sân tiêu chuẩn',
      },
    };
  }
}
