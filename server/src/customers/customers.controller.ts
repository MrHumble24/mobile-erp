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
import { ListCustomersQueryDto } from './dto/list-customers.query.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customers: CustomersService,
    private readonly sales: SalesService,
  ) {}

  @Get()
  @RequirePermissions('customer.read')
  list(@Query() query: ListCustomersQueryDto) {
    return this.customers.list(query);
  }

  @Get('lookup')
  @RequirePermissions('customer.read')
  lookup(@Query('q') q?: string) {
    return this.customers.lookup(q);
  }

  @Get('stats')
  @RequirePermissions('customer.read')
  stats() {
    return this.customers.stats();
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
