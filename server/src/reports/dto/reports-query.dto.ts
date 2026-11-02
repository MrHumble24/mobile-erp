import { Type } from 'class-transformer';
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
  @IsIn(['category', 'month', 'day'])
  groupBy: 'category' | 'month' | 'day' = 'category';

  @IsOptional()
  @IsUUID()
  categoryId?: string;
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

export class TrendQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  bucket: 'day' | 'week' | 'month' = 'day';
}

export class ProfitBreakdownQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsIn(['channel', 'model', 'cashier', 'day'])
  groupBy: 'channel' | 'model' | 'cashier' | 'day' = 'channel';
}

export class ReturnsQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number = 50;
}
