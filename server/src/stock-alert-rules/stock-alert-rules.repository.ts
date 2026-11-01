import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  LowStockView,
  StockAlertRuleInput,
  StockAlertRulePatch,
  StockAlertRuleView,
} from './types/stock-alert-rule.types.js';

/** All Prisma access for low-stock alert rules. */
@Injectable()
export class StockAlertRulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<StockAlertRuleView[]> {
    return this.prisma.stockAlertRule.findMany({ orderBy: { storage: 'asc' } });
  }

  findById(id: string): Promise<StockAlertRuleView | null> {
    return this.prisma.stockAlertRule.findUnique({ where: { id } });
  }

  create(input: StockAlertRuleInput): Promise<StockAlertRuleView> {
    return this.prisma.stockAlertRule.create({ data: input });
  }

  update(id: string, data: StockAlertRulePatch): Promise<StockAlertRuleView> {
    return this.prisma.stockAlertRule.update({ where: { id }, data });
  }

  /** Rules whose current IN_STOCK count sits below their threshold. */
  async lowStock(): Promise<LowStockView[]> {
    const rules = await this.prisma.stockAlertRule.findMany();
    const breached: LowStockView[] = [];
    for (const rule of rules) {
      const currentCount = await this.prisma.device.count({
        where: {
          modelId: rule.modelId,
          statusCode: 'IN_STOCK',
          specs: { path: ['storage'], equals: rule.storage },
        },
      });
      if (currentCount < rule.threshold)
        breached.push({ ...rule, currentCount });
    }
    return breached;
  }
}
