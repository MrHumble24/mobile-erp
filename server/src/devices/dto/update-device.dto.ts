import {
  IsNumber,
  IsOptional,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import { IMEI_MESSAGE, IMEI_REGEX } from '../lib/imei.js';
import { IsSpecsObject } from './specs.validator.js';

export class UpdateDeviceDto {
  /** Open-ended specs (JSONB). Replaces the stored object when present. */
  @IsOptional()
  @IsSpecsObject()
  specs?: Record<string, unknown>;

  /** Second IMEI (dual-SIM). `null` clears it; must differ from `imei`. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei2?: string | null;

  /** `null` clears the target price. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  targetPrice?: number | null;
}
