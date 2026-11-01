import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto.js';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto.js';
import { ExpenseCategoriesService } from './expense-categories.service.js';

@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly categories: ExpenseCategoriesService) {}

  @Get()
  @RequirePermissions('expense.read')
  list() {
    return this.categories.list();
  }

  @Post()
  @RequirePermissions('expense.category.manage')
  create(@Body() dto: CreateExpenseCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('expense.category.manage')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseCategoryDto) {
    return this.categories.update(id, dto);
  }
}
