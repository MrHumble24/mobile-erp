import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateShipmentDto {
  @IsOptional()
  @IsDateString()
  shipmentDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
