import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentProfile } from '../auth/current-profile.decorator';
import {
  SupabaseAuthGuard,
  type AuthenticatedProfile,
} from '../auth/supabase-auth.guard';
import { CreateReviewDto, UpdateReviewDto } from './dto/reviews.dto';
import {
  CreateReviewCommentDto,
  UpdateReviewCommentDto,
} from './dto/comments.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ---------------------------------------------------------------------------
  // Reviews Endpoints
  // ---------------------------------------------------------------------------

  @Post('fields/:id/reviews')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Tạo bài đánh giá mới cho sân bóng (yêu cầu đã từng đặt sân)',
  })
  @ApiParam({ name: 'id', description: 'ID của sân bóng (UUID)' })
  @ApiResponse({ status: 201, description: 'Gửi đánh giá thành công' })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc lượt đặt sân đã được đánh giá',
  })
  @ApiResponse({
    status: 403,
    description: 'Chưa đủ điều kiện đặt sân để đánh giá',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sân bóng' })
  createReview(
    @Param('id', new ParseUUIDPipe()) fieldId: string,
    @Body() dto: CreateReviewDto,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.reviewsService.createReview(fieldId, dto, profile);
  }

  @Get('fields/:id/reviews/eligibility')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Kiểm tra điều kiện gửi đánh giá cho sân của tài khoản hiện tại',
  })
  @ApiParam({ name: 'id', description: 'ID của sân bóng (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Kiểm tra điều kiện thành công',
  })
  checkEligibility(
    @Param('id', new ParseUUIDPipe()) fieldId: string,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.reviewsService.checkEligibility(fieldId, profile);
  }

  @Patch('reviews/:id')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Chỉnh sửa bài đánh giá (chỉ chủ sở hữu bài đánh giá)',
  })
  @ApiParam({ name: 'id', description: 'ID của bài đánh giá (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật bài đánh giá thành công',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền chỉnh sửa bài đánh giá',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài đánh giá' })
  updateReview(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.reviewsService.updateReview(id, dto, profile);
  }

  @Delete('reviews/:id')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Xóa bài đánh giá (chỉ chủ sở hữu bài đánh giá)',
  })
  @ApiParam({ name: 'id', description: 'ID của bài đánh giá (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Xóa bài đánh giá thành công',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xóa bài đánh giá',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài đánh giá' })
  deleteReview(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.reviewsService.deleteReview(id, profile);
  }

  // ---------------------------------------------------------------------------
  // Nested Review Comments Endpoints
  // ---------------------------------------------------------------------------

  @Get('reviews/:id/comments')
  @ApiOperation({
    summary: 'Lấy danh sách bình luận dạng cây phân cấp của một bài đánh giá',
  })
  @ApiParam({ name: 'id', description: 'ID của bài đánh giá (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách bình luận thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài đánh giá' })
  getComments(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reviewsService.getComments(id);
  }

  @Post('reviews/:id/comments')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Gửi bình luận hoặc phản hồi bình luận cho bài đánh giá',
  })
  @ApiParam({ name: 'id', description: 'ID của bài đánh giá (UUID)' })
  @ApiResponse({ status: 201, description: 'Gửi bình luận thành công' })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc parent comment không khớp',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài đánh giá' })
  createComment(
    @Param('id', new ParseUUIDPipe()) reviewId: string,
    @Body() dto: CreateReviewCommentDto,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.reviewsService.createComment(reviewId, dto, profile);
  }

  @Patch('reviews/comments/:commentId')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Chỉnh sửa nội dung bình luận (chủ sở hữu hoặc Admin)',
  })
  @ApiParam({ name: 'commentId', description: 'ID của bình luận (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật bình luận thành công',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền chỉnh sửa bình luận',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bình luận' })
  updateComment(
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @Body() dto: UpdateReviewCommentDto,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.reviewsService.updateComment(commentId, dto, profile);
  }

  @Delete('reviews/comments/:commentId')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Xóa bình luận (chủ sở hữu hoặc Admin)',
  })
  @ApiParam({ name: 'commentId', description: 'ID của bình luận (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Xóa bình luận thành công',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xóa bình luận',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bình luận' })
  deleteComment(
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.reviewsService.deleteComment(commentId, profile);
  }
}
