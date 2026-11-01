import {
  IsDateString,
  IsInt,
  IsNumber,
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

  /** Changing overhead recomputes landed cost for every device in the batch. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  overheadCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
