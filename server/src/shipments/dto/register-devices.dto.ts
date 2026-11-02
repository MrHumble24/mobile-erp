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

export class RegisterDeviceDto {
  /** Exactly 15 numeric digits. */
  @Matches(/^\d{15}$/, { message: 'imei must be exactly 15 digits' })
  imei!: string;

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
