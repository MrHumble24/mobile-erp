import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class DateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class ExpenseReportQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsIn(['category', 'month'])
  groupBy: 'category' | 'month' = 'category';
}

export class ModelPricingQueryDto {
  @IsOptional()
  @IsUUID()
  modelId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  windowDays: number = 90;
}

export class DailyClosingQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
