import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IMEI_MESSAGE, IMEI_REGEX } from '../../devices/lib/imei.js';
import { SERIAL_MESSAGE, SERIAL_REGEX } from '../../devices/lib/unit-code.js';

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
  @Max(1_000_000_000)
  amount!: number;
}

/**
 * A phone the customer gives as part payment (Change 14, ADR 0039). Each
 * becomes a customer purchase and enters stock at `value`; the values lower
 * what the customer pays. Online only — refused on the sync replay path.
 */
export class SaleTradeInDto {
  @IsUUID()
  modelId!: string;

  @IsOptional()
  @IsString()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei?: string;

  @IsOptional()
  @IsString()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei2?: string;

  @IsOptional()
  @IsString()
  @Matches(SERIAL_REGEX, { message: SERIAL_MESSAGE })
  serialNumber?: string;

  @IsOptional()
  @IsObject()
  specs?: Record<string, unknown>;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000_000)
  value!: number;
}

/** A per-line discount (Change 7/12, ADR 0034). Final = list − discount. */
export class SaleDiscountDto {
  @IsIn(['PERCENT', 'AMOUNT'])
  mode!: 'PERCENT' | 'AMOUNT';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  value!: number;
}

export class CreateSaleDto {
  /** Unit identifier. Send exactly one of `imei` / `serialNumber`. */
  @IsOptional()
  @IsString()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei?: string;

  /** Serial-unit identifier. Send exactly one of `imei` / `serialNumber`. */
  @IsOptional()
  @IsString()
  @Matches(SERIAL_REGEX, { message: SERIAL_MESSAGE })
  serialNumber?: string;

  /**
   * Quantity-product sale: send `modelId` + `quantity` instead of an
   * `imei`/`serialNumber` (ADR 0030). The model must be a QUANTITY product.
   * `salePrice` is then the line total for all `quantity` pieces.
   */
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

  /**
   * Price level for the line (ADR 0034). Omit to follow the customer's level,
   * else RETAIL. The server resolves the list price itself.
   */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  priceLevelCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaleDiscountDto)
  discount?: SaleDiscountDto;

  /**
   * The till's own list price for the line (offline replay only). Trusted only
   * on the sync push path; ignored online, where the server resolves it.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  listPrice?: number;

  /**
   * Phones taken in part payment (ADR 0039). Their values lower what the
   * customer pays: `payments` must sum to `salePrice` − Σ values. A customer
   * (id or inline) is required, and the total may not exceed `salePrice`.
   * Online only — rejected on the offline replay path.
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleTradeInDto)
  tradeIns?: SaleTradeInDto[];
}
