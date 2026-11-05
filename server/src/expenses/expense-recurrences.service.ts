import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service.js';
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
    private readonly ledger: LedgerService,
  ) {}

  async list() {
    const storeIds = await this.stores.currentStoreIds();
    return this.repo.findAll(storeIds);
  }

  async create(createdById: string, dto: CreateExpenseRecurrenceDto) {
    await this.assertAccount(dto.accountCode);
    return this.repo.create({
      ...dto,
      storeId: await this.stores.currentStoreId(),
      nextDueAt: new Date(dto.nextDueAt),
      createdById,
    });
  }

  async update(id: string, dto: UpdateExpenseRecurrenceDto) {
    await this.require(id);
    if (dto.accountCode) await this.assertAccount(dto.accountCode);
    const { nextDueAt, ...rest } = dto;
    return this.repo.update(id, {
      ...rest,
      ...(nextDueAt ? { nextDueAt: new Date(nextDueAt) } : {}),
    });
  }

  private async assertAccount(code?: string): Promise<void> {
    if (!code) return;
    if (!(await this.ledger.activeAccountCodes()).includes(code)) {
      throw new BadRequestException(`Unknown or inactive account ${code}`);
    }
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
    const storeIds = await this.stores.currentStoreIds();
    const found = await this.repo.findById(id, storeIds);
    if (!found) {
      throw new NotFoundException(`Recurrence ${id} not found`);
    }
    return found;
  }
}
