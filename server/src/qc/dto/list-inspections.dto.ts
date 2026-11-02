import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListInspectionsDto {
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  imei?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  passed?: 'true' | 'false';

  @IsOptional()
  @IsString()
  @MaxLength(8)
  gradeCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  defectCode?: string;

  @IsOptional()
  @IsUUID()
  inspectedById?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number = 50;
}
