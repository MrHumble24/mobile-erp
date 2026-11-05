import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductCategoryDto } from './dto/create-product-category.dto.js';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto.js';

/** All Prisma access for product categories. */
@Injectable()
export class ProductCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.productCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.productCategory.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.productCategory.findUnique({ where: { name } });
  }

  create(dto: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({ data: dto });
  }

  update(id: string, dto: UpdateProductCategoryDto) {
    return this.prisma.productCategory.update({ where: { id }, data: dto });
  }
}
