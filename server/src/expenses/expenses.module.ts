import { Module } from '@nestjs/common';
import { ExpenseCategoriesModule } from '../expense-categories/expense-categories.module.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesRepository } from './expenses.repository.js';
import { ExpensesService } from './expenses.service.js';

@Module({
  imports: [ExpenseCategoriesModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository],
})
export class ExpensesModule {}
