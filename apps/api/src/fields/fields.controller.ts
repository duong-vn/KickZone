import { Controller, Get, Query } from '@nestjs/common';
import { FieldsService } from './fields.service';

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.fieldsService.findAll(query);
  }
}
