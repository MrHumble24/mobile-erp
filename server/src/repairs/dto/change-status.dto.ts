import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { REPAIR_STATUSES } from '../lib/repair-status.js';

/** Move the ticket to a new status. `note` is a reason (required to give back
 * while money is still owed). */
export class ChangeStatusDto {
  @IsIn(REPAIR_STATUSES)
  toStatusCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
