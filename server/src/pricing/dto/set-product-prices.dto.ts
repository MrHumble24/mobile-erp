import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class ProductPriceEntryDto {
  /** Storage this price is for; omit or null = "any storage". */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  storage?: string | null;

  @IsString()
  @MaxLength(32)
  levelCode!: string;

  /** The price, or null to clear it. */
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  price!: number | null;
}

/** Set every storage × level price of a product in one call (ADR 0034). */
export class SetProductPricesDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductPriceEntryDto)
  prices!: ProductPriceEntryDto[];
}
