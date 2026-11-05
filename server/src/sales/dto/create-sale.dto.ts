import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
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
import { IMEI_MESSAGE, IMEI_REGEX } from '../../devices/lib/imei.js';

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

/** One tender line of a (possibly split) sale. */
export class SalePaymentDto {
  @IsString()
  accountCode!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
}

export class CreateSaleDto {
  @IsString()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
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

  /**
   * How the sale was tendered. Omit for a single CASH payment of the full
   * price. When present, amounts must be positive, accounts distinct and
   * active, and the amounts must sum to `salePrice` exactly.
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments?: SalePaymentDto[];
}
