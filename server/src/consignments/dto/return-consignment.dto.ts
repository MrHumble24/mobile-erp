import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ReturnConsignmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  /** Device status to return to. Defaults to IN_STOCK. */
  @IsOptional()
  @IsIn(['IN_STOCK', 'DEFECTIVE'])
  condition?: 'IN_STOCK' | 'DEFECTIVE';

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedVersion?: number;
}
