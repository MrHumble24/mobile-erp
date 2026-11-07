import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePriceListDto } from './dto/create-price-list.dto.js';
import { CustomsRepository } from './customs.repository.js';
import { baseCustomsKey, normalizeCustomsKey } from './lib/customs-match.js';
import {
  CurrentList,
  CurrentListItem,
  FeeHistoryPoint,
  PriceListSummary,
  UnmatchedModel,
} from './types/customs.types.js';

@Injectable()
export class CustomsService {
  constructor(private readonly repo: CustomsRepository) {}

  async createPriceList(
    dto: CreatePriceListDto,
    userId: string,
  ): Promise<PriceListSummary> {
    const codes = dto.items.map((i) => i.customsCode);
    if (new Set(codes).size !== codes.length) {
      throw new BadRequestException('Duplicate customsCode in the price list');
    }
    const row = await this.repo.create({
      effectiveAt: dto.effectiveAt ? new Date(dto.effectiveAt) : undefined,
      note: dto.note,
      items: dto.items,
      createdById: userId,
    });
    return toSummary(row);
  }

  async listVersions(): Promise<PriceListSummary[]> {
    const rows = await this.repo.listVersions();
    return rows.map(toSummary);
  }

  /** Current list with each item's previous-version fee and model usage. */
  async currentList(): Promise<CurrentList | null> {
    const [current, previous] = await this.repo.twoNewest();
    if (!current) return null;
    const prevFees = new Map(
      (previous?.items ?? []).map((i) => [i.customsCode, i.fee.toFixed(2)]),
    );
    const usedKeys = new Set(
      Array.from(await this.repo.modelCustomsCodes(), normalizeCustomsKey),
    );
    const items: CurrentListItem[] = current.items.map((i) => ({
      customsCode: i.customsCode,
      description: i.description,
      fee: i.fee.toFixed(2),
      previousFee: prevFees.get(i.customsCode) ?? null,
      usedByModel:
        usedKeys.has(normalizeCustomsKey(i.customsCode)) ||
        usedKeys.has(baseCustomsKey(i.customsCode)),
    }));
    return {
      id: current.id,
      effectiveAt: current.effectiveAt,
      note: current.note,
      items,
    };
  }

  async feeHistory(customsCode: string): Promise<FeeHistoryPoint[]> {
    const rows = await this.repo.feeHistory(customsCode);
    return rows.map((r) => ({
      listId: r.listId,
      effectiveAt: r.list.effectiveAt,
      fee: r.fee.toFixed(2),
    }));
  }

  /** Our models that cannot be stamped: no code, or code missing from current. */
  async unmatchedModels(): Promise<UnmatchedModel[]> {
    const [current] = await this.repo.twoNewest();
    const listCodes = new Set(
      (current?.items ?? []).flatMap((i) => [
        normalizeCustomsKey(i.customsCode),
        baseCustomsKey(i.customsCode),
      ]),
    );
    const models = await this.repo.activeModels();
    const out: UnmatchedModel[] = [];
    for (const m of models) {
      if (!m.customsCode) {
        out.push({ ...m, reason: 'MISSING_CODE' });
      } else if (!listCodes.has(normalizeCustomsKey(m.customsCode))) {
        out.push({ ...m, reason: 'CODE_NOT_IN_CURRENT_LIST' });
      }
    }
    return out;
  }

  /**
   * customsCode -> fee (number) for the current list, for stamping at intake.
   * Empty when no list exists; a missing code yields 0 at the call site.
   */
  async currentFeeMap(): Promise<Map<string, number>> {
    const [current] = await this.repo.twoNewest();
    const map = new Map<string, number>();
    for (const item of current?.items ?? []) {
      map.set(normalizeCustomsKey(item.customsCode), item.fee.toNumber());
    }
    return map;
  }
}

function toSummary(row: {
  id: string;
  effectiveAt: Date;
  note: string | null;
  createdById: string;
  createdAt: Date;
  _count: { items: number };
}): PriceListSummary {
  return {
    id: row.id,
    effectiveAt: row.effectiveAt,
    note: row.note,
    createdById: row.createdById,
    createdAt: row.createdAt,
    itemCount: row._count.items,
  };
}
