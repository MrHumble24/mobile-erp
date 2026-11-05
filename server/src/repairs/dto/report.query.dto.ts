import { IsISO8601, IsOptional } from 'class-validator';

/** Date range for the repairs finance report (both optional = all time). */
export class RepairReportQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
