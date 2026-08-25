import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { profiles } from '../generated/prisma/client';
import { FavoritesService } from './favorites.service';

export interface GetFavoritesQueryDto {
  page?: string;
  limit?: string;
}

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller()
@UseGuards(AuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('fields/:id/favorite')
  @ApiOperation({
    summary:
      'Toggle favorite status for a field (add if not favorited, remove if favorited)',
  })
  toggleFavorite(
    @Param('id', new ParseUUIDPipe()) fieldId: string,
    @CurrentUser() user: profiles,
  ) {
    return this.favoritesService.toggleFavorite(user.id, fieldId);
  }

  @Get('fields/:id/favorite')
  @ApiOperation({ summary: 'Get current user favorite status for a field' })
  getFavoriteStatus(
    @Param('id', new ParseUUIDPipe()) fieldId: string,
    @CurrentUser() user: profiles,
  ) {
    return this.favoritesService.getFavoriteStatus(user.id, fieldId);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get list of favorite fields of the current user' })
  getUserFavorites(
    @Query() query: GetFavoritesQueryDto,
    @CurrentUser() user: profiles,
  ) {
    return this.favoritesService.getUserFavorites(user.id, query);
  }
}
