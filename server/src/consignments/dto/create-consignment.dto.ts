import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateConsignmentDto {
  /** 15-digit IMEI. Device must exist and be IN_STOCK. */
  @Matches(/^\d{15}$/, { message: 'imei must be 15 digits' })
  imei!: string;

  @IsUUID()
  partnerId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000_000)
  agreedPrice!: number;

  @IsString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  clientMutationId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedVersion?: number;
}
