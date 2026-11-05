import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateShipmentDto {
  @IsUUID()
  supplierId!: string;

  @IsDateString()
  shipmentDate!: string;

  @IsInt()
  @Min(0)
  expectedCount!: number;

  /**
   * Account the purchase + per-device expense money leaves from. Fixed at
   * creation (cannot be changed later); defaults to CASH; must be active.
   */
  @IsOptional()
  @IsString()
  paymentAccountCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
