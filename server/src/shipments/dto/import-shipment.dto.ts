import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IMEI_MESSAGE, IMEI_REGEX } from '../../devices/lib/imei.js';

export class ImportShipmentRowDto {
  @IsInt()
  @Min(1)
  row!: number;

  @IsString()
  @IsNotEmpty()
  modelName!: string;

  @IsString()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei!: string;

  @IsOptional()
  @IsString()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei2?: string;

  @IsNumber()
  @Min(0)
  expense!: number;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsOptional()
  @IsNumber()
  markup?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryHealth?: number;

  @IsOptional()
  @IsString()
  defects?: string;
}

export class ImportShipmentDto {
  @IsUUID()
  supplierId!: string;

  @IsUUID()
  storeId!: string;

  @IsString()
  @IsNotEmpty()
  paymentAccountCode!: string;

  @IsDateString()
  shipmentDate!: string;

  @IsNumber()
  @IsPositive()
  exchangeRate!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportShipmentRowDto)
  @ArrayMinSize(1)
  rows!: ImportShipmentRowDto[];
}
