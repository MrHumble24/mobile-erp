import { Module } from '@nestjs/common';
import { ExpenseCategoriesModule } from '../expense-categories/expense-categories.module.js';
import { LedgerModule } from '../ledger/ledger.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { ExpenseRecurrencesController } from './expense-recurrences.controller.js';
import { ExpenseRecurrencesRepository } from './expense-recurrences.repository.js';
import { ExpenseRecurrencesService } from './expense-recurrences.service.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesRepository } from './expenses.repository.js';
import { ExpensesService } from './expenses.service.js';

@Module({
  imports: [ExpenseCategoriesModule, StoresModule, LedgerModule],
  controllers: [ExpensesController, ExpenseRecurrencesController],
  providers: [
    ExpensesService,
    ExpensesRepository,
    ExpenseRecurrencesService,
    ExpenseRecurrencesRepository,
  ],
})
export class ExpensesModule {}
