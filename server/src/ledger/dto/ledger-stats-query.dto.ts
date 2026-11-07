import { IsDateString, IsOptional, IsString } from 'class-validator';

export class LedgerStatsQueryDto {
  @IsOptional()
  @IsString()
  accountCode?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

