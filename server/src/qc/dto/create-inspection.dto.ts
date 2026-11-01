import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class InspectionDefectDto {
  @IsString()
  @MaxLength(64)
  defectCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateInspectionDto {
  @IsUUID()
  deviceId!: string;

  @IsBoolean()
  passed!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  gradeCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryHealth?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  repairCostEstimate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InspectionDefectDto)
  defects: InspectionDefectDto[] = [];
}
