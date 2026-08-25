import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedProfile } from '../auth/supabase-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  const mockUser: AuthenticatedProfile = {
    id: '11111111-1111-4111-8111-111111111111',
    authUserId: 'auth-1',
    email: 'user@kickzone.vn',
    role: 'USER',
    status: 'ACTIVE',
  };

  const mockOtherUser: AuthenticatedProfile = {
    id: '22222222-2222-4222-8222-222222222222',
    authUserId: 'auth-2',
    email: 'other@kickzone.vn',
    role: 'USER',
    status: 'ACTIVE',
  };

  const fieldId = '33333333-3333-4333-8333-333333333333';
  const bookingId = '44444444-4444-4444-8444-444444444444';
  const reviewId = '55555555-5555-4555-8555-555555555555';

  const createService = () => {
    const findFirstField = jest.fn();
    const findFirstBooking = jest.fn();
    const findUniqueReview = jest.fn();
    const findFirstReview = jest.fn();
    const createReview = jest.fn();
    const updateReview = jest.fn();
    const deleteReview = jest.fn();

    const prisma = {
      fields: {
        findFirst: findFirstField,
      },
      bookings: {
        findFirst: findFirstBooking,
      },
      reviews: {
        findUnique: findUniqueReview,
        findFirst: findFirstReview,
        create: createReview,
        update: updateReview,
        delete: deleteReview,
      },
    } as unknown as PrismaService;

    const service = new ReviewsService(prisma);

    return {
      service,
      findFirstField,
      findFirstBooking,
      findUniqueReview,
      findFirstReview,
      createReview,
      updateReview,
      deleteReview,
    };
  };

  describe('createReview', () => {
    it('throws NotFoundException when field does not exist', async () => {
      const { service, findFirstField } = createService();
      findFirstField.mockResolvedValue(null);

      await expect(
        service.createReview(
          fieldId,
          { rating: 5, content: 'Sân cỏ rất đẹp' },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user has no completed booking for the field', async () => {
      const { service, findFirstField, findFirstBooking } = createService();
      findFirstField.mockResolvedValue({
        id: fieldId,
        name: 'Sân Chảo Lửa',
        field_types: { name: 'Sân 7 người' },
      });
      findFirstBooking.mockResolvedValue(null);

      await expect(
        service.createReview(
          fieldId,
          { rating: 5, content: 'Sân cỏ rất đẹp' },
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates review successfully when user has an eligible completed booking', async () => {
      const { service, findFirstField, findFirstBooking, createReview } =
        createService();

      findFirstField.mockResolvedValue({
        id: fieldId,
        name: 'Sân Chảo Lửa',
        field_types: { name: 'Sân 7 người' },
      });

      findFirstBooking.mockResolvedValue({
        id: bookingId,
        user_id: mockUser.id,
        field_id: fieldId,
        status: 'COMPLETED',
        reviews: null,
      });

      const now = new Date();
      createReview.mockResolvedValue({
        id: reviewId,
        user_id: mockUser.id,
        field_id: fieldId,
        booking_id: bookingId,
        rating: 5,
        content: 'Mặt cỏ rất đẹp và ánh sáng tốt.',
        created_at: now,
        updated_at: now,
        profiles: {
          id: mockUser.id,
          full_name: 'Nguyễn Văn A',
          avatar_path: 'https://example.com/avatar.jpg',
          role: mockUser.role,
        },
        bookings: {
          id: bookingId,
          code: 'KZ-BK-123',
          start_time: new Date('2026-08-25T18:00:00.000Z'),
          end_time: new Date('2026-08-25T19:30:00.000Z'),
        },
        fields: {
          id: fieldId,
          name: 'Sân Chảo Lửa',
          field_types: { name: 'Sân 7 người' },
        },
      });

      const result = await service.createReview(
        fieldId,
        { rating: 5, content: 'Mặt cỏ rất đẹp và ánh sáng tốt.' },
        mockUser,
      );

      expect(result).toEqual({
        data: {
          id: reviewId,
          userId: mockUser.id,
          fieldId,
          bookingId,
          rating: 5,
          content: 'Mặt cỏ rất đẹp và ánh sáng tốt.',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          isOwner: true,
          verifiedBooking: true,
          user: {
            id: mockUser.id,
            fullName: 'Nguyễn Văn A',
            avatarUrl: 'https://example.com/avatar.jpg',
            role: mockUser.role,
            isCurrentUser: true,
          },
          booking: {
            id: bookingId,
            code: 'KZ-BK-123',
            fieldName: 'Sân Chảo Lửa',
            matchDate: '2026-08-25',
            timeSlot: '18:00 - 19:30',
            fieldTypeName: 'Sân 7 người',
          },
          comments: [],
        },
        message: 'Gửi đánh giá thành công!',
      });
      expect(createReview).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateReview', () => {
    it('throws NotFoundException when review does not exist', async () => {
      const { service, findUniqueReview } = createService();
      findUniqueReview.mockResolvedValue(null);

      await expect(
        service.updateReview(
          reviewId,
          { rating: 4, content: 'Cập nhật đánh giá' },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when another user attempts to edit the review', async () => {
      const { service, findUniqueReview } = createService();
      findUniqueReview.mockResolvedValue({
        id: reviewId,
        user_id: mockUser.id,
        rating: 5,
        content: 'Nội dung cũ',
      });

      await expect(
        service.updateReview(
          reviewId,
          { rating: 4, content: 'Cố ý sửa bài người khác' },
          mockOtherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates review successfully when owner edits their own review', async () => {
      const { service, findUniqueReview, updateReview } = createService();

      findUniqueReview.mockResolvedValue({
        id: reviewId,
        user_id: mockUser.id,
        rating: 5,
        content: 'Nội dung cũ',
      });

      const now = new Date();
      updateReview.mockResolvedValue({
        id: reviewId,
        user_id: mockUser.id,
        field_id: fieldId,
        booking_id: bookingId,
        rating: 4,
        content: 'Nội dung mới sau khi sửa',
        created_at: now,
        updated_at: now,
        profiles: {
          id: mockUser.id,
          full_name: 'Nguyễn Văn A',
          avatar_path: 'https://example.com/avatar.jpg',
          role: mockUser.role,
        },
        bookings: null,
        fields: {
          id: fieldId,
          name: 'Sân Chảo Lửa',
          field_types: null,
        },
      });

      const result = await service.updateReview(
        reviewId,
        { rating: 4, content: 'Nội dung mới sau khi sửa' },
        mockUser,
      );

      expect(result).toEqual({
        data: {
          id: reviewId,
          userId: mockUser.id,
          fieldId,
          bookingId,
          rating: 4,
          content: 'Nội dung mới sau khi sửa',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          isOwner: true,
          verifiedBooking: true,
          user: {
            id: mockUser.id,
            fullName: 'Nguyễn Văn A',
            avatarUrl: 'https://example.com/avatar.jpg',
            role: mockUser.role,
            isCurrentUser: true,
          },
          booking: undefined,
          comments: [],
        },
        message: 'Cập nhật bài đánh giá thành công!',
      });
      expect(updateReview).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteReview', () => {
    it('throws NotFoundException when review does not exist', async () => {
      const { service, findUniqueReview } = createService();
      findUniqueReview.mockResolvedValue(null);

      await expect(service.deleteReview(reviewId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when another user attempts to delete the review', async () => {
      const { service, findUniqueReview } = createService();
      findUniqueReview.mockResolvedValue({
        id: reviewId,
        user_id: mockUser.id,
      });

      await expect(
        service.deleteReview(reviewId, mockOtherUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deletes review successfully when owner deletes their review', async () => {
      const { service, findUniqueReview, deleteReview } = createService();
      findUniqueReview.mockResolvedValue({
        id: reviewId,
        user_id: mockUser.id,
      });
      deleteReview.mockResolvedValue({ id: reviewId });

      const result = await service.deleteReview(reviewId, mockUser);

      expect(result).toEqual({
        success: true,
        message: 'Đã xóa bài đánh giá thành công.',
        id: reviewId,
      });
      expect(deleteReview).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
    });
  });

  describe('checkEligibility', () => {
    it('returns canReview true when eligible unreviewed completed booking exists', async () => {
      const { service, findFirstField, findFirstBooking } = createService();

      findFirstField.mockResolvedValue({
        id: fieldId,
        name: 'Sân Chảo Lửa',
        field_types: { name: 'Sân 7 người' },
      });

      findFirstBooking.mockResolvedValue({
        id: bookingId,
        code: 'KZ-BK-999',
        start_time: new Date('2026-08-25T18:00:00.000Z'),
        end_time: new Date('2026-08-25T19:30:00.000Z'),
      });

      const result = await service.checkEligibility(fieldId, mockUser);

      expect(result).toEqual({
        canReview: true,
        currentProfileId: mockUser.id,
        eligibleBookingId: bookingId,
        bookingProof: {
          id: bookingId,
          code: 'KZ-BK-999',
          fieldName: 'Sân Chảo Lửa',
          matchDate: '2026-08-25',
          timeSlot: '18:00 - 19:30',
          fieldTypeName: 'Sân 7 người',
        },
      });
    });

    it('returns canReview false with already_reviewed when existing review exists', async () => {
      const { service, findFirstField, findFirstBooking, findFirstReview } =
        createService();

      findFirstField.mockResolvedValue({
        id: fieldId,
        name: 'Sân Chảo Lửa',
        field_types: { name: 'Sân 7 người' },
      });

      findFirstBooking.mockResolvedValue(null);
      findFirstReview.mockResolvedValue({ id: reviewId });

      const result = await service.checkEligibility(fieldId, mockUser);

      expect(result).toEqual({
        canReview: false,
        currentProfileId: mockUser.id,
        existingReviewId: reviewId,
        reason: 'already_reviewed',
        message:
          'Bạn đã đánh giá các lượt đặt sân đã hoàn thành của mình tại sân này.',
      });
    });

    it('returns canReview false when no completed booking exists', async () => {
      const { service, findFirstField, findFirstBooking, findFirstReview } =
        createService();

      findFirstField.mockResolvedValue({
        id: fieldId,
        name: 'Sân Chảo Lửa',
        field_types: { name: 'Sân 7 người' },
      });

      findFirstBooking.mockResolvedValue(null);
      findFirstReview.mockResolvedValue(null);

      const result = await service.checkEligibility(fieldId, mockUser);

      expect(result).toEqual({
        canReview: false,
        currentProfileId: mockUser.id,
        reason: 'no_completed_booking',
        message:
          'Bạn cần có ít nhất một lượt đặt sân đã hoàn thành tại sân này để viết đánh giá.',
      });
    });
  });
});
