import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

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
  @IsObject()
  specs?: Record<string, unknown>;

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
