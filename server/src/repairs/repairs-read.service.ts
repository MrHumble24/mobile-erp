import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerRepairReadService } from '../ledger/ledger-repair-read.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { StoresService } from '../stores/stores.service.js';
import { RepairReportQueryDto } from './dto/report.query.dto.js';
import { ListRepairsQueryDto } from './dto/list-repairs.query.dto.js';
import { toListItem, toRepairView } from './lib/repair.mapper.js';
import { RepairsRepository, type RepairRaw } from './repairs.repository.js';
import type {
  RepairPage,
  RepairReport,
  RepairView,
} from './types/repair.types.js';

const ZERO = new Prisma.Decimal(0);

/** The code clients watch for when repairs are switched off (ADR 0040). */
export const REPAIRS_DISABLED = 'REPAIRS_DISABLED';

/** Reads for repairs, plus the one "repairs are on?" gate every path calls. */
@Injectable()
export class RepairsReadService {
  constructor(
    private readonly repo: RepairsRepository,
    private readonly stores: StoresService,
    private readonly settings: SettingsService,
    private readonly ledgerRepair: LedgerRepairReadService,
  ) {}

  /** 403 REPAIRS_DISABLED unless the repairs setting is on. */
  async assertEnabled(): Promise<void> {
    const { repairsEnabled } = await this.settings.get();
    if (!repairsEnabled) {
      throw new ForbiddenException({
        code: REPAIRS_DISABLED,
        message: 'Repairs are disabled',
      });
    }
  }

  /** The raw ticket (for the write services' rules); 404 if missing. */
  async require(id: string): Promise<RepairRaw> {
    const storeIds = await this.stores.currentStoreIds();
    const raw = await this.repo.findRawById(id, storeIds);
    if (!raw) throw new NotFoundException(`Repair ${id} not found`);
    return raw;
  }

  async get(caller: AuthenticatedUser, id: string): Promise<RepairView> {
    await this.assertEnabled();
    const raw = await this.require(id);
    const outside = (await this.ledgerRepair.outsidePaid([id])).get(id) ?? ZERO;
    return toRepairView(raw, outside, canViewCost(caller), new Date());
  }

  async list(query: ListRepairsQueryDto): Promise<RepairPage> {
    await this.assertEnabled();
    const storeIds = await this.stores.currentStoreIds();
    const { items, total } = await this.repo.list(storeIds, query);
    const now = new Date();
    return {
      // paid / outstanding / warranty do not depend on outside cost, so the
      // list skips the ledger lookup and passes zero.
      items: items.map((r) => toListItem(r, ZERO, now)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async report(
    caller: AuthenticatedUser,
    query: RepairReportQueryDto,
  ): Promise<RepairReport> {
    await this.assertEnabled();
    const storeIds = await this.stores.currentStoreIds();
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const [income, parts, outside] = await Promise.all([
      this.repo.sumPayments(storeIds, from, to),
      this.repo.partsInRange(storeIds, from, to),
      this.ledgerRepair.outsideSum(from, to),
    ]);
    const partsCost = parts.reduce(
      (s, p) => s.plus(p.unitCostSnapshot.times(p.quantity)),
      ZERO,
    );
    const profit = income.minus(partsCost).minus(outside);
    const show = canViewCost(caller);
    return {
      from: from ?? null,
      to: to ?? null,
      income: income.toFixed(2),
      partsCost: show ? partsCost.toFixed(2) : null,
      outsideCost: show ? outside.toFixed(2) : null,
      profit: show ? profit.toFixed(2) : null,
    };
  }
}

function canViewCost(caller: AuthenticatedUser): boolean {
  return caller.permissions.has('device.cost.view');
}
