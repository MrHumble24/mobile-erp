import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStorefrontSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  showPrices?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactTelegram?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsBoolean()
  pickupEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['FREE', 'FLAT', 'BY_ZONE'])
  deliveryPricingModeCode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deliveryFlatFee?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deliveryFreeFrom?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryNote?: string | null;
}
