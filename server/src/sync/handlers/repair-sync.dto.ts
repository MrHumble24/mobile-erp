import { IsUUID } from 'class-validator';
import { AddPartDto } from '../../repairs/dto/add-part.dto.js';
import { ChangeStatusDto } from '../../repairs/dto/change-status.dto.js';
import { CreateRepairDto } from '../../repairs/dto/create-repair.dto.js';
import { RepairMoneyDto } from '../../repairs/dto/repair-money.dto.js';
import { UpdateRepairDto } from '../../repairs/dto/update-repair.dto.js';

/**
 * Sync payloads mirror the REST DTOs but carry the ticket id in the body (there
 * is no URL path during replay). `clientMutationId` is inherited from the REST
 * DTO, so `validateDto`'s whitelist accepts exactly the queued payload.
 */
export class RepairCreateSyncDto extends CreateRepairDto {}

export class RepairUpdateSyncDto extends UpdateRepairDto {
  @IsUUID()
  repairId!: string;
}

export class RepairStatusSyncDto extends ChangeStatusDto {
  @IsUUID()
  repairId!: string;
}

export class RepairMoneySyncDto extends RepairMoneyDto {
  @IsUUID()
  repairId!: string;
}

export class RepairPartAddSyncDto extends AddPartDto {
  @IsUUID()
  repairId!: string;
}

export class RepairPartRemoveSyncDto {
  @IsUUID()
  repairId!: string;

  @IsUUID()
  partId!: string;
}
