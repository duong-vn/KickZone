import { Controller, Get, Query } from '@nestjs/common';
import { FieldsService } from './fields.service';

export interface GetFieldsQueryDto {
  search?: string;
  type?: string;
  district?: string;
  minPrice?: string;
  maxPrice?: string;
  date?: string;
  timeSlot?: string;
  page?: string;
  limit?: string;
}

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  findAll(@Query() query: GetFieldsQueryDto) {
    return this.fieldsService.findAll(query);
  }
}
