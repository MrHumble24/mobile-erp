import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { SetProductPricesDto } from './dto/set-product-prices.dto.js';
import { SetUnitPricesDto } from './dto/set-unit-prices.dto.js';
import { PricingService } from './pricing.service.js';

/**
 * Read and write price levels and the price lists (ADR 0034). All writes are
 * `price.manage` (ADMIN only by default); the level list is readable by anyone
 * signed in so a till can offer the picker.
 */
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('levels')
  levels() {
    return this.pricing.getActiveLevels();
  }

  @Get('products/:modelId')
  @RequirePermissions('price.manage')
  getProduct(@Param('modelId') modelId: string) {
    return this.pricing.getProductPrices(modelId);
  }

  @Put('products/:modelId')
  @RequirePermissions('price.manage')
  setProduct(
    @Param('modelId') modelId: string,
    @Body() dto: SetProductPricesDto,
  ) {
    return this.pricing.setProductPrices(modelId, dto);
  }

  @Get('units/:deviceId')
  @RequirePermissions('price.manage')
  getUnit(@Param('deviceId') deviceId: string) {
    return this.pricing.getUnitPrices(deviceId);
  }

  @Put('units/:deviceId')
  @RequirePermissions('price.manage')
  setUnit(@Param('deviceId') deviceId: string, @Body() dto: SetUnitPricesDto) {
    return this.pricing.setUnitPrices(deviceId, dto);
  }
}
