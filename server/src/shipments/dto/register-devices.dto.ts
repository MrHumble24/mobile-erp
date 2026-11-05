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

export class RegisterDeviceDto {
  /** Exactly 15 numeric digits. */
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei!: string;

  /** Optional second IMEI (dual-SIM). Same format; must differ from `imei`. */
  @IsOptional()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei2?: string;

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
