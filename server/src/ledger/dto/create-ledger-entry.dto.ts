import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MANUAL_ENTRY_TYPES } from '../types/ledger.types.js';
import type { ManualEntryType } from '../types/ledger.types.js';

/** A manual owner entry on one account. TRANSFER has its own endpoint. */
export class CreateLedgerEntryDto {
  @IsString()
  accountCode!: string;

  @IsIn(MANUAL_ENTRY_TYPES)
  typeCode!: ManualEntryType;

  /**
   * Positive magnitude for DEPOSIT/WITHDRAWAL (server applies the sign); a
   * signed value for OPENING/CORRECTION. Never zero.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-1_000_000_000)
  @Max(1_000_000_000)
  amount!: number;

  /** Required for CORRECTION (the reason); optional otherwise. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
