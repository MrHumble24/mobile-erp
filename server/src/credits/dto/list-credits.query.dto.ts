import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class ListCreditsQueryDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  /** open = outstanding > 0; overdue = has an overdue instalment; settled = paid off. */
  @IsOptional()
  @IsIn(['open', 'overdue', 'settled'])
  status?: 'open' | 'overdue' | 'settled';
}
