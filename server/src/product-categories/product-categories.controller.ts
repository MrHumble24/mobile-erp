import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { CreateProductCategoryDto } from './dto/create-product-category.dto.js';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto.js';
import { ProductCategoriesService } from './product-categories.service.js';

@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly categories: ProductCategoriesService) {}

  @Get()
  @RequirePermissions('device.read')
  list() {
    return this.categories.list();
  }

  @Post()
  @RequirePermissions('device.update')
  create(@Body() dto: CreateProductCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('device.update')
  update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.categories.update(id, dto);
  }
}
