import { Module } from '@nestjs/common';
import { ProductCategoriesController } from './product-categories.controller.js';
import { ProductCategoriesRepository } from './product-categories.repository.js';
import { ProductCategoriesService } from './product-categories.service.js';

@Module({
  controllers: [ProductCategoriesController],
  providers: [ProductCategoriesService, ProductCategoriesRepository],
  exports: [ProductCategoriesService],
})
export class ProductCategoriesModule {}
