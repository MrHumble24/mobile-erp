import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StoresService } from '../stores/stores.service.js';
import { ListShiftsQueryDto } from './dto/list-shifts.query.dto.js';
import { toListItem, toReportView } from './lib/shift-mapper.js';
import { ShiftsRepository, type ShiftRow } from './shifts.repository.js';
import type { ShiftListResult, ShiftReportView } from './types/shift.types.js';

const MANAGE = 'shift.manage';

/** Shift reads: my current shift (live), one shift's report, and the list. */
@Injectable()
export class ShiftsReadService {
  constructor(
    private readonly repo: ShiftsRepository,
    private readonly ledger: LedgerService,
    private readonly stores: StoresService,
  ) {}

  /** My open shift with its live figures, or null when none is open. */
  async current(caller: AuthenticatedUser): Promise<ShiftReportView | null> {
    const storeId = await this.stores.currentStoreId();
    const shift = await this.repo.findOpenByCashier(caller.id, storeId);
    return shift ? this.buildReport(shift) : null;
  }

  /** One shift's report; own, or any with shift.manage (403 otherwise). */
  async report(
    caller: AuthenticatedUser,
    id: string,
  ): Promise<ShiftReportView> {
    const shift = await this.requireVisible(caller, id);
    return this.buildReport(shift);
  }

  async requireVisible(
    caller: AuthenticatedUser,
    id: string,
  ): Promise<ShiftRow> {
    const storeIds = await this.stores.currentStoreIds();
    const shift = await this.repo.findById(id, storeIds);
    if (!shift) throw new NotFoundException(`Shift ${id} not found`);
    if (shift.cashierId !== caller.id && !caller.permissions.has(MANAGE)) {
      throw new ForbiddenException('You may only view your own shifts');
    }
    return shift;
  }

  /** Build the full figures by grouping the cashier's cash rows in the window. */
  async buildReport(shift: ShiftRow): Promise<ShiftReportView> {
    const to = shift.closedAt ?? new Date();
    const rows = await this.ledger.shiftRows(
      shift.cashierId,
      shift.openedAt,
      to,
    );
    return toReportView(shift, rows);
  }

  /** Newest first, paginated. A cashier without shift.manage sees only their own. */
  async list(
    caller: AuthenticatedUser,
    query: ListShiftsQueryDto,
  ): Promise<ShiftListResult> {
    const canManage = caller.permissions.has(MANAGE);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const { items, total } = await this.repo.list({
      storeId: await this.stores.currentStoreId(),
      cashierId: canManage ? query.cashierId : caller.id,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page,
      pageSize,
    });
    const diffs = await this.ledger.shiftDifferences(items.map((s) => s.id));
    return {
      items: items.map((s) => toListItem(s, diffs.get(s.id))),
      total,
      page,
      pageSize,
    };
  }
}
