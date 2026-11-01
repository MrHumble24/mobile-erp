import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class InlineCustomerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}

export class CreateSaleDto {
  @IsString()
  @Matches(/^\d{15}$/, { message: 'imei must be 15 digits' })
  imei!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  salePrice!: number;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InlineCustomerDto)
  customer?: InlineCustomerDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientMutationId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedVersion?: number;
}
