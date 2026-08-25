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

    const findUniqueComment = jest.fn();
    const findManyComments = jest.fn();
    const createComment = jest.fn();
    const updateComment = jest.fn();
    const deleteComment = jest.fn();

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
      review_comments: {
        findUnique: findUniqueComment,
        findMany: findManyComments,
        create: createComment,
        update: updateComment,
        delete: deleteComment,
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
      findUniqueComment,
      findManyComments,
      createComment,
      updateComment,
      deleteComment,
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

  describe('createComment', () => {
    const commentId = '66666666-6666-4666-8666-666666666666';
    const parentCommentId = '77777777-7777-4777-8777-777777777777';

    it('throws NotFoundException when review does not exist', async () => {
      const { service, findUniqueReview } = createService();
      findUniqueReview.mockResolvedValue(null);

      await expect(
        service.createComment(
          reviewId,
          { content: 'Bình luận thử nghiệm' },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when parent comment is not found', async () => {
      const { service, findUniqueReview, findUniqueComment } = createService();
      findUniqueReview.mockResolvedValue({ id: reviewId });
      findUniqueComment.mockResolvedValue(null);

      await expect(
        service.createComment(
          reviewId,
          { content: 'Bình luận trả lời', parentId: parentCommentId },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a root comment successfully', async () => {
      const { service, findUniqueReview, createComment } = createService();
      findUniqueReview.mockResolvedValue({ id: reviewId });
      createComment.mockResolvedValue({
        id: commentId,
        review_id: reviewId,
        user_id: mockUser.id,
        parent_id: null,
        content: 'Bình luận gốc',
        created_at: new Date('2026-08-25T10:00:00Z'),
        updated_at: new Date('2026-08-25T10:00:00Z'),
        profiles: {
          id: mockUser.id,
          full_name: 'Nguyễn Văn A',
          avatar_path: '/avatars/a.jpg',
          role: 'USER',
        },
      });

      const res = await service.createComment(
        reviewId,
        { content: 'Bình luận gốc' },
        mockUser,
      );

      expect(res.data.id).toBe(commentId);
      expect(res.data.content).toBe('Bình luận gốc');
      expect(res.data.user.fullName).toBe('Nguyễn Văn A');
      expect(res.data.parentId).toBeNull();
    });

    it('creates a nested reply comment successfully with replyToUserName', async () => {
      const { service, findUniqueReview, findUniqueComment, createComment } =
        createService();
      findUniqueReview.mockResolvedValue({ id: reviewId });
      findUniqueComment.mockResolvedValue({
        id: parentCommentId,
        review_id: reviewId,
        profiles: { full_name: 'Trần Thị B' },
      });
      createComment.mockResolvedValue({
        id: commentId,
        review_id: reviewId,
        user_id: mockUser.id,
        parent_id: parentCommentId,
        content: 'Phản hồi cho bạn B',
        created_at: new Date('2026-08-25T10:05:00Z'),
        updated_at: new Date('2026-08-25T10:05:00Z'),
        profiles: {
          id: mockUser.id,
          full_name: 'Nguyễn Văn A',
          avatar_path: null,
          role: 'USER',
        },
      });

      const res = await service.createComment(
        reviewId,
        { content: 'Phản hồi cho bạn B', parentId: parentCommentId },
        mockUser,
      );

      expect(res.data.parentId).toBe(parentCommentId);
      expect(res.data.replyToUserName).toBe('Trần Thị B');
    });
  });

  describe('getComments', () => {
    it('returns a hierarchical tree of comments', async () => {
      const { service, findUniqueReview, findManyComments } = createService();
      findUniqueReview.mockResolvedValue({ id: reviewId });

      const c1Id = '11111111-0000-0000-0000-000000000001';
      const c2Id = '11111111-0000-0000-0000-000000000002';

      findManyComments.mockResolvedValue([
        {
          id: c1Id,
          review_id: reviewId,
          user_id: mockUser.id,
          parent_id: null,
          content: 'Comment 1',
          created_at: new Date('2026-08-25T10:00:00Z'),
          updated_at: new Date('2026-08-25T10:00:00Z'),
          profiles: {
            id: mockUser.id,
            full_name: 'User 1',
            avatar_path: null,
            role: 'USER',
          },
        },
        {
          id: c2Id,
          review_id: reviewId,
          user_id: mockOtherUser.id,
          parent_id: c1Id,
          content: 'Reply to 1',
          created_at: new Date('2026-08-25T10:05:00Z'),
          updated_at: new Date('2026-08-25T10:05:00Z'),
          profiles: {
            id: mockOtherUser.id,
            full_name: 'User 2',
            avatar_path: null,
            role: 'USER',
          },
        },
      ]);

      const res = await service.getComments(reviewId, mockUser);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe(c1Id);
      expect(res.data[0].replies).toHaveLength(1);
      expect(res.data[0].replies?.[0].id).toBe(c2Id);
      expect(res.data[0].replies?.[0].replyToUserName).toBe('User 1');
    });
  });

  describe('updateComment', () => {
    const commentId = '66666666-6666-4666-8666-666666666666';

    it('throws ForbiddenException when user does not own comment and is not ADMIN', async () => {
      const { service, findUniqueComment } = createService();
      findUniqueComment.mockResolvedValue({
        id: commentId,
        user_id: mockOtherUser.id,
        content: 'Original',
      });

      await expect(
        service.updateComment(
          commentId,
          { content: 'Hacked content' },
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates comment when user is owner', async () => {
      const { service, findUniqueComment, updateComment } = createService();
      findUniqueComment.mockResolvedValue({
        id: commentId,
        user_id: mockUser.id,
        content: 'Original',
      });
      updateComment.mockResolvedValue({
        id: commentId,
        review_id: reviewId,
        user_id: mockUser.id,
        parent_id: null,
        content: 'Updated content',
        created_at: new Date('2026-08-25T10:00:00Z'),
        updated_at: new Date('2026-08-25T10:10:00Z'),
        profiles: {
          id: mockUser.id,
          full_name: 'Nguyễn Văn A',
          avatar_path: null,
          role: 'USER',
        },
      });

      const res = await service.updateComment(
        commentId,
        { content: 'Updated content' },
        mockUser,
      );

      expect(res.data.content).toBe('Updated content');
    });
  });

  describe('deleteComment', () => {
    const commentId = '66666666-6666-4666-8666-666666666666';

    it('throws ForbiddenException when deleting someone else comment', async () => {
      const { service, findUniqueComment } = createService();
      findUniqueComment.mockResolvedValue({
        id: commentId,
        user_id: mockOtherUser.id,
      });

      await expect(service.deleteComment(commentId, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deletes comment successfully when owner requests', async () => {
      const { service, findUniqueComment, deleteComment } = createService();
      findUniqueComment.mockResolvedValue({
        id: commentId,
        user_id: mockUser.id,
      });
      deleteComment.mockResolvedValue({ id: commentId });

      const res = await service.deleteComment(commentId, mockUser);
      expect(res.success).toBe(true);
      expect(res.id).toBe(commentId);
    });
  });
});
