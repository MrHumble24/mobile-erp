import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
  Matches,
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
  acquisitionCost!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  targetPrice?: number;
}

export class RegisterDevicesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegisterDeviceDto)
  devices!: RegisterDeviceDto[];
}
