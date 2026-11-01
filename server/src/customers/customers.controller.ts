import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { SalesService } from '../sales/sales.service.js';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customers: CustomersService,
    private readonly sales: SalesService,
  ) {}

  @Get()
  @RequirePermissions('customer.read')
  search(@Query('q') q?: string) {
    return this.customers.search(q);
  }

  @Get(':id')
  @RequirePermissions('customer.read')
  get(@Param('id') id: string) {
    return this.customers.get(id);
  }

  @Get(':id/sales')
  @RequirePermissions('customer.read')
  async sales_(@Param('id') id: string) {
    await this.customers.get(id);
    return this.sales.listByCustomer(id);
  }

  @Post()
  @RequirePermissions('customer.manage')
  create(@Body() dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('customer.manage')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }
}
