import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AdminVouchersService } from './admin-vouchers.service';
import {
  CreateVoucherDto,
  ListVouchersQueryDto,
  SetVoucherStatusDto,
  UpdateVoucherDto,
} from './dto/voucher.dto';

@ApiTags('Admin Vouchers')
@ApiBearerAuth()
@Controller('admin/vouchers')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminVouchersController {
  constructor(private readonly service: AdminVouchersService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: List vouchers' })
  findAll(@Query() query: ListVouchersQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: Create voucher' })
  create(@Body() dto: CreateVoucherDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: Update voucher' })
  update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Activate or deactivate voucher' })
  setStatus(@Param('id') id: string, @Body() body: SetVoucherStatusDto) {
    return this.service.setStatus(id, body.isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Deactivate voucher and preserve history' })
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
