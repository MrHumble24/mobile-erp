import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { CreateStockAlertRuleDto } from './dto/create-stock-alert-rule.dto.js';
import { UpdateStockAlertRuleDto } from './dto/update-stock-alert-rule.dto.js';
import { StockAlertRulesService } from './stock-alert-rules.service.js';

@Controller('stock-alert-rules')
export class StockAlertRulesController {
  constructor(private readonly rules: StockAlertRulesService) {}

  @Get('low-stock')
  @RequirePermissions('device.read')
  lowStock() {
    return this.rules.lowStock();
  }

  @Get()
  @RequirePermissions('device.read')
  list() {
    return this.rules.list();
  }

  @Get(':id')
  @RequirePermissions('device.read')
  get(@Param('id') id: string) {
    return this.rules.get(id);
  }

  @Post()
  @RequirePermissions('settings.manage')
  create(@Body() dto: CreateStockAlertRuleDto) {
    return this.rules.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('settings.manage')
  update(@Param('id') id: string, @Body() dto: UpdateStockAlertRuleDto) {
    return this.rules.update(id, dto);
  }
}
