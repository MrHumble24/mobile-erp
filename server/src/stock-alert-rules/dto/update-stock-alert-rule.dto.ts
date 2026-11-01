import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateStockAlertRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  storage?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  threshold?: number;
}
