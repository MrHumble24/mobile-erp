import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PriceListItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  customsCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  fee!: number;
}

export class CreatePriceListDto {
  /** Defaults to now when omitted; the current list is the newest effectiveAt. */
  @IsOptional()
  @IsDateString()
  effectiveAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListItemDto)
  items!: PriceListItemDto[];
}
