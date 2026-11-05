import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Sets (or changes) a phone's own expense; the difference posts to the ledger. */
export class SetDeviceExpenseDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  unitExpense!: number;

  /** `null` clears the note. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  unitExpenseNote?: string | null;
}
