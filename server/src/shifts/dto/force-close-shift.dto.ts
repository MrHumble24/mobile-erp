import { Type } from 'class-transformer';
import {
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** An admin closing another cashier's forgotten shift (shift.manage). The note
 * is required — it is the record of who closed it and why. */
export class ForceCloseShiftDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  closingCount!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  note!: string;
}
