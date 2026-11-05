import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  /** Default price level for this customer (ADR 0034). Defaults to RETAIL. */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  priceLevelCode?: string;

  /** Standing discount percent on the customer's card (0–100). */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  standingDiscountPercent?: number;

  /** This customer's own credit ceiling (ADR 0035); null = use the default. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  creditLimit?: number | null;
}
