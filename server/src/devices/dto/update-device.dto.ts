import { IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';
import { IsSpecsObject } from './specs.validator.js';

export class UpdateDeviceDto {
  /** Open-ended specs (JSONB). Replaces the stored object when present. */
  @IsOptional()
  @IsSpecsObject()
  specs?: Record<string, unknown>;

  /** `null` clears the target price. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  targetPrice?: number | null;
}
