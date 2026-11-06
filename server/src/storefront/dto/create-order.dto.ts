import { Type } from 'class-transformer';
import {
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

  /** Hidden honeypot field — should remain empty. */
  @IsOptional()
  @IsString()
  hp?: string;

  @IsOptional()
  @IsString()
  honeypot?: string;
}
