import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class UnitPriceEntryDto {
  @IsString()
  @MaxLength(32)
  levelCode!: string;

  /** The price, or null to clear it (RETAIL clears the unit's targetPrice). */
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  price!: number | null;
}

/** Set a unit's own prices per level (ADR 0034). RETAIL is its targetPrice. */
export class SetUnitPricesDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => UnitPriceEntryDto)
  prices!: UnitPriceEntryDto[];
}
