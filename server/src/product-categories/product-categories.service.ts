import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductCategoryDto } from './dto/create-product-category.dto.js';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto.js';
import { ProductCategoriesRepository } from './product-categories.repository.js';

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly repo: ProductCategoriesRepository) {}

  list() {
    return this.repo.findAll();
  }

  /** Returns the category or throws 404 — used by device-models to validate FKs. */
  async require(id: string) {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Product category ${id} not found`);
    return found;
  }

  async create(dto: CreateProductCategoryDto) {
    await this.assertNameFree(dto.name);
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateProductCategoryDto) {
    await this.require(id);
    if (dto.name) await this.assertNameFree(dto.name, id);
    return this.repo.update(id, dto);
  }

  private async assertNameFree(name: string, exceptId?: string) {
    const existing = await this.repo.findByName(name);
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`Category "${name}" already exists`);
    }
  }
}
