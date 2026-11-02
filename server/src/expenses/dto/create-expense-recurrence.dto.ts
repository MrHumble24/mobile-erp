import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { EXPENSE_FREQUENCIES } from '../lib/recurrence.lib.js';

export class CreateExpenseRecurrenceDto {
  @IsUUID()
  categoryId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendor?: string;

  @IsIn(EXPENSE_FREQUENCIES)
  frequency!: 'monthly' | 'weekly';

  @IsDateString()
  nextDueAt!: string;
}
