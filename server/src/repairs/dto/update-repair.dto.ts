import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Edit a ticket's details while it is not terminal (ADR 0040). */
export class UpdateRepairDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceName?: string;

  @IsOptional()
  @IsUUID()
  modelId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  imei?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  problem?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  agreedPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3650)
  warrantyDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsUUID()
  masterUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  outsideMasterName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  outsideMasterPhone?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  outsideCost?: number;

  /** Client-generated key; a retried submit replays instead of writing twice. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientMutationId?: string;
}
