import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IMEI_MESSAGE, IMEI_REGEX } from '../../devices/lib/imei.js';
import { SERIAL_MESSAGE, SERIAL_REGEX } from '../../devices/lib/unit-code.js';

export class CreateConsignmentDto {
  /** Unit identifier. Send exactly one of `imei` / `serialNumber`. IN_STOCK only. */
  @IsOptional()
  @IsString()
  @Matches(IMEI_REGEX, { message: IMEI_MESSAGE })
  imei?: string;

  /** Serial-unit identifier. Send exactly one of `imei` / `serialNumber`. */
  @IsOptional()
  @IsString()
  @Matches(SERIAL_REGEX, { message: SERIAL_MESSAGE })
  serialNumber?: string;

  @IsUUID()
  partnerId!: string;

  /**
   * The price agreed with the partner. Omit to use the unit's PARTNER list
   * price (ADR 0034); an explicit value always wins. 400 if omitted and the
   * unit has no PARTNER price.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000_000)
  agreedPrice?: number;

  @IsString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  clientMutationId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedVersion?: number;
}
