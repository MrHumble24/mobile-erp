import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ListStockQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /** Matches name, barcode, brand or model code (contains, case-insensitive). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
