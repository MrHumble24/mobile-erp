import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import {
  ExpenseQueryDto,
  ExpenseSummaryQueryDto,
} from './dto/expense-query.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { ExpensesService } from './expenses.service.js';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @RequirePermissions('expense.read')
  list(@Query() query: ExpenseQueryDto) {
    return this.expenses.list(query);
  }

  @Get('summary')
  @RequirePermissions('expense.read')
  summary(@Query() query: ExpenseSummaryQueryDto) {
    return this.expenses.summary(query);
  }

  @Get(':id')
  @RequirePermissions('expense.read')
  get(@Param('id') id: string) {
    return this.expenses.get(id);
  }

  @Post()
  @RequirePermissions('expense.manage')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expenses.create(user.id, dto);
  }

  @Patch(':id')
  @RequirePermissions('expense.manage')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expenses.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions('expense.manage')
  remove(@Param('id') id: string) {
    return this.expenses.remove(id);
  }
}
