import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class StorefrontOrderSpecsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  storage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;
}

export class CreateStorefrontOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string;

  @IsUUID()
  @IsNotEmpty()
  modelId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StorefrontOrderSpecsDto)
  specs?: StorefrontOrderSpecsDto;

  @IsUUID()
  @IsNotEmpty()
  storeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PICKUP', 'DELIVERY', 'pickup', 'delivery'])
  fulfillmentMethod?: string;

  /** Alias for fulfillmentMethod. */
  @IsOptional()
  @IsString()
  @IsIn(['PICKUP', 'DELIVERY', 'pickup', 'delivery'])
  deliveryMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsUUID()
  deliveryZoneId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ON_RECEIPT', 'ONLINE', 'on_receipt', 'online'])
  paymentMethod?: string;

  /** Hidden honeypot field — should remain empty. */
  @IsOptional()
  @IsString()
  hp?: string;

  @IsOptional()
  @IsString()
  honeypot?: string;
}
