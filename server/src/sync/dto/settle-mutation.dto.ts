import { IsUUID } from 'class-validator';
import { SettleConsignmentDto } from '../../consignments/dto/settle-consignment.dto.js';

/** Settle payload for the queue: the consignment DTO plus its routing id. */
export class SettleMutationDto extends SettleConsignmentDto {
  @IsUUID()
  consignmentId!: string;
}
