import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { CreateStockAlertRuleDto } from './dto/create-stock-alert-rule.dto.js';
import { UpdateStockAlertRuleDto } from './dto/update-stock-alert-rule.dto.js';
import { StockAlertRulesRepository } from './stock-alert-rules.repository.js';
import {
  LowStockView,
  StockAlertRuleView,
} from './types/stock-alert-rule.types.js';

@Injectable()
export class StockAlertRulesService {
  constructor(
    private readonly repo: StockAlertRulesRepository,
    private readonly models: DeviceModelsService,
  ) {}

  list(): Promise<StockAlertRuleView[]> {
    return this.repo.findAll();
  }

  get(id: string): Promise<StockAlertRuleView> {
    return this.require(id);
  }

  lowStock(): Promise<LowStockView[]> {
    return this.repo.lowStock();
  }

  async create(dto: CreateStockAlertRuleDto): Promise<StockAlertRuleView> {
    await this.models.get(dto.modelId);
    try {
      return await this.repo.create(dto);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async update(
    id: string,
    dto: UpdateStockAlertRuleDto,
  ): Promise<StockAlertRuleView> {
    await this.require(id);
    try {
      return await this.repo.update(id, dto);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  private mapConflict(error: unknown): unknown {
    if (isUniqueViolation(error)) {
      return new ConflictException(
        'A rule for this model and storage already exists',
      );
    }
    return error;
  }

  private async require(id: string): Promise<StockAlertRuleView> {
    const rule = await this.repo.findById(id);
    if (!rule) throw new NotFoundException(`Stock alert rule ${id} not found`);
    return rule;
  }
}
