import {
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Owner manual bonus-point correction (ADR 0043). Reason is required. */
export class AdjustBonusDto {
  /** Signed points to add (+) or remove (−). Must not be zero (service checks). */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-1_000_000_000)
  @Max(1_000_000_000)
  amount!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}
