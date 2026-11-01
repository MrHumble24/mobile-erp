import { Module } from '@nestjs/common';
import { ExpenseCategoriesController } from './expense-categories.controller.js';
import { ExpenseCategoriesRepository } from './expense-categories.repository.js';
import { ExpenseCategoriesService } from './expense-categories.service.js';

@Module({
  controllers: [ExpenseCategoriesController],
  providers: [ExpenseCategoriesService, ExpenseCategoriesRepository],
  exports: [ExpenseCategoriesService],
})
export class ExpenseCategoriesModule {}
