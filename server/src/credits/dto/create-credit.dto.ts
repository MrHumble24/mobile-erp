import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IMEI_MESSAGE, IMEI_REGEX } from '../../devices/lib/imei.js';
import { SERIAL_MESSAGE, SERIAL_REGEX } from '../../devices/lib/unit-code.js';
import {
  SaleDiscountDto,
  SalePaymentDto,
} from '../../sales/dto/create-sale.dto.js';

/** One cart line — exactly what POST /sales takes for a single sale. */
export class CreditLineDto {
  @IsOptional()
  @IsString()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei?: string;

  @IsOptional()
  @IsString()
  @Matches(SERIAL_REGEX, { message: SERIAL_MESSAGE })
  serialNumber?: string;

  @IsOptional()
  @IsUUID()
  modelId?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(1_000_000)
  quantity?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000_000)
  salePrice!: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  priceLevelCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaleDiscountDto)
  discount?: SaleDiscountDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/** One planned part: an amount due by a date. No interest/fee fields exist. */
export class CreditInstalmentDto {
  @IsISO8601()
  dueDate!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000_000)
  amount!: number;
}

export class CreateCreditDto {
  /** The buyer: must be a named customer with a phone number. */
  @IsUUID()
  customerId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreditLineDto)
  lines!: CreditLineDto[];

  /**
   * The down payment taken now (cash, card or split). May be empty. Each amount
   * is positive, the accounts distinct and active. Posted as CREDIT_PAYMENT
   * rows, never SALE rows.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments?: SalePaymentDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreditInstalmentDto)
  instalments!: CreditInstalmentDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  /** Idempotency key from the till, like a sale's clientMutationId. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientKey?: string;
}
