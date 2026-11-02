import { IsUUID } from 'class-validator';
import { ReturnConsignmentDto } from '../../consignments/dto/return-consignment.dto.js';

/** Return payload for the queue: the consignment DTO plus its routing id. */
export class ReturnMutationDto extends ReturnConsignmentDto {
  @IsUUID()
  consignmentId!: string;
}
