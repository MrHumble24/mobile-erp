import {
  BadRequestException,
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
    const { reassignToId, ...rest } = dto;
    if (rest.isActive === false) {
      await this.handleDeactivate(id, reassignToId);
    }
    return this.repo.update(id, rest);
  }

  /** Deactivating a category in use requires moving its rows to another category first. */
  private async handleDeactivate(id: string, reassignToId?: string) {
    const inUse = await this.repo.countExpenses(id);
    if (inUse === 0) return;
    if (!reassignToId) {
      throw new ConflictException(
        `Category has ${inUse} expense(s); supply reassignToId to deactivate`,
      );
    }
    if (reassignToId === id) {
      throw new BadRequestException('Cannot reassign a category to itself');
    }
    await this.require(reassignToId);
    await this.repo.reassign(id, reassignToId);
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
