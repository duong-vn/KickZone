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
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('fields/:id/reviews')
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
}
