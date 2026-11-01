import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto.js';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto.js';
import { ExpenseCategoriesRepository } from './expense-categories.repository.js';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly repo: ExpenseCategoriesRepository) {}

  list() {
    return this.repo.findAll();
  }

  async create(dto: CreateExpenseCategoryDto) {
    await this.assertNameFree(dto.name);
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateExpenseCategoryDto) {
    await this.require(id);
    if (dto.name) await this.assertNameFree(dto.name, id);
    return this.repo.update(id, dto);
  }

  private async require(id: string) {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Expense category ${id} not found`);
    return found;
  }

  private async assertNameFree(name: string, exceptId?: string) {
    const existing = await this.repo.findByName(name);
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`Category "${name}" already exists`);
    }
  }
}
