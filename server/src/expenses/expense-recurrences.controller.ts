import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateExpenseRecurrenceDto } from './dto/create-expense-recurrence.dto.js';
import { UpdateExpenseRecurrenceDto } from './dto/update-expense-recurrence.dto.js';
import { ExpenseRecurrencesService } from './expense-recurrences.service.js';

@Controller('expense-recurrences')
export class ExpenseRecurrencesController {
  constructor(private readonly recurrences: ExpenseRecurrencesService) {}

  @Get()
  @RequirePermissions('expense.read')
  list() {
    return this.recurrences.list();
  }

  @Post()
  @RequirePermissions('expense.manage')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseRecurrenceDto,
  ) {
    return this.recurrences.create(user.id, dto);
  }

  @Post('generate')
  @RequirePermissions('expense.manage')
  generate(@CurrentUser() user: AuthenticatedUser) {
    return this.recurrences.generateDue(user.id);
  }

  @Patch(':id')
  @RequirePermissions('expense.manage')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseRecurrenceDto) {
    return this.recurrences.update(id, dto);
  }
}
