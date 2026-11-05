import { Injectable, NotFoundException } from '@nestjs/common';
import { StoresService } from '../stores/stores.service.js';
import { CreateExpenseRecurrenceDto } from './dto/create-expense-recurrence.dto.js';
import { UpdateExpenseRecurrenceDto } from './dto/update-expense-recurrence.dto.js';
import { ExpenseRecurrencesRepository } from './expense-recurrences.repository.js';
import { nextDueDate } from './lib/recurrence.lib.js';

@Injectable()
export class ExpenseRecurrencesService {
  constructor(
    private readonly repo: ExpenseRecurrencesRepository,
    private readonly stores: StoresService,
  ) {}

  list() {
    return this.repo.findAll();
  }

  async create(createdById: string, dto: CreateExpenseRecurrenceDto) {
    return this.repo.create({
      ...dto,
      storeId: await this.stores.currentStoreId(),
      nextDueAt: new Date(dto.nextDueAt),
      createdById,
    });
  }

  async update(id: string, dto: UpdateExpenseRecurrenceDto) {
    await this.require(id);
    const { nextDueAt, ...rest } = dto;
    return this.repo.update(id, {
      ...rest,
      ...(nextDueAt ? { nextDueAt: new Date(nextDueAt) } : {}),
    });
  }

  /**
   * Create real expenses for every active template whose nextDueAt has passed,
   * advancing each by one period.
   * ponytail: one occurrence per template per call; run again to catch up a
   * multi-period backlog. Upgrade to a bounded while-loop if cron-driven.
   */
  async generateDue(createdById: string) {
    const now = new Date();
    const due = await this.repo.findDue(now);
    for (const r of due) {
      await this.repo.spawnOccurrence({
        recurrence: r,
        createdById,
        nextDueAt: nextDueDate(
          r.nextDueAt,
          r.frequency as 'monthly' | 'weekly',
        ),
      });
    }
    return { generated: due.length };
  }

  private async require(id: string) {
    const found = await this.repo.findById(id);
    if (!found) {
      throw new NotFoundException(`Recurrence ${id} not found`);
    }
    return found;
  }
}
