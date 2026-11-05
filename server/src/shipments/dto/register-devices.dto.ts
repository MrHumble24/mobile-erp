import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsSpecsObject } from '../../devices/dto/specs.validator.js';
import { IMEI_MESSAGE, IMEI_REGEX } from '../../devices/lib/imei.js';
import { SERIAL_MESSAGE, SERIAL_REGEX } from '../../devices/lib/unit-code.js';

export class RegisterDeviceDto {
  /**
   * 15 numeric digits. Required for an IMEI-kind model, forbidden for a
   * SERIAL-kind one — the service enforces the per-kind rule (kind comes from
   * the model, not this body).
   */
  @IsOptional()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei?: string;

  /** Optional second IMEI (dual-SIM). Same format; must differ from `imei`. */
  @IsOptional()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei2?: string;

  /** Serial number for a SERIAL-kind model. 3-64 chars, no spaces; upper-cased. */
  @IsOptional()
  @Matches(SERIAL_REGEX, { message: SERIAL_MESSAGE })
  serialNumber?: string;

  @IsUUID()
  modelId!: string;

  @IsSpecsObject()
  specs!: Record<string, unknown>;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  acquisitionCost!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  targetPrice?: number;

  /**
   * Per-phone expense at intake. A non-zero value requires `device.expense`;
   * the service rejects it with 403 otherwise. Defaults to 0.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  unitExpense?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  unitExpenseNote?: string;
}

export class RegisterDevicesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegisterDeviceDto)
  devices!: RegisterDeviceDto[];
}
