import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ReturnSaleDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  refundAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsIn(['IN_STOCK', 'DEFECTIVE'])
  deviceToStatusCode!: 'IN_STOCK' | 'DEFECTIVE';

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedVersion?: number;
}
