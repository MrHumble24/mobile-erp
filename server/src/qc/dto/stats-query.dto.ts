import { IsDateString, IsOptional } from 'class-validator';

export class StatsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
