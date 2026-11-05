import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IMEI_MESSAGE, IMEI_REGEX } from '../../devices/lib/imei.js';
import { SERIAL_MESSAGE, SERIAL_REGEX } from '../../devices/lib/unit-code.js';

/** The seller when no existing customer id is given — name and phone ONLY.
 * No passport, document number or ID field exists here, on purpose (ADR 0039). */
class PurchaseSellerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}

export class CreateCustomerPurchaseDto {
  /** An existing seller; omit to pass `customer` (name + phone) instead. */
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PurchaseSellerDto)
  customer?: PurchaseSellerDto;

  /** The model of the bought unit. Must be an IMEI or SERIAL product. */
  @IsUUID()
  modelId!: string;

  /** IMEI-kind unit: send `imei` (+ optional `imei2`), no `serialNumber`. */
  @IsOptional()
  @IsString()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei?: string;

  @IsOptional()
  @IsString()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei2?: string;

  /** SERIAL-kind unit: send `serialNumber`, no `imei`/`imei2`. */
  @IsOptional()
  @IsString()
  @Matches(SERIAL_REGEX, { message: SERIAL_MESSAGE })
  serialNumber?: string;

  /** Per-unit attributes (storage/color/condition), as a shipment unit takes. */
  @IsOptional()
  @IsObject()
  specs?: Record<string, unknown>;

  /** Price paid to the seller. Becomes the unit's acquisition + landed cost. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000_000)
  pricePaid!: number;

  /** The account the money leaves. CASH when omitted. */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  accountCode?: string;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
