import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Inline seller when no existing customerId is given: upserted by phone. */
export class RepairCustomerDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}

export class CreateRepairDto {
  /** Existing customer id, or an inline `customer` to find/create. One is required. */
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RepairCustomerDto)
  customer?: RepairCustomerDto;

  @IsString()
  @MaxLength(200)
  deviceName!: string;

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

  @IsString()
  @MaxLength(1000)
  problem!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  agreedPrice!: number;

  /** Warranty length typed on the ticket (days); 0 = none. */
  @IsInt()
  @Min(0)
  @Max(3650)
  warrantyDays!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  /** Own master (a user). Mutually exclusive with outsideMasterName. */
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

  /** Agreed amount the shop pays the outside master. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  outsideCost?: number;

  @IsOptional()
  @IsISO8601()
  receivedAt?: string;

  /** Client-generated key; a retried submit replays instead of writing twice. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientMutationId?: string;
}
