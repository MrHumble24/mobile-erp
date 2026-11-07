import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { LEDGER_SORT_FIELDS } from '../types/ledger.types.js';
import type { LedgerSortField } from '../types/ledger.types.js';

/** Filters + pagination + sort for ledger history. Date bounds apply to occurredAt. */
export class LedgerQueryDto {
  @IsOptional()
  @IsString()
  accountCode?: string;

  @IsOptional()
  @IsString()
  typeCode?: string;

  @IsOptional()
  @IsIn(['in', 'out', 'all'])
  direction?: 'in' | 'out' | 'all';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(LEDGER_SORT_FIELDS)
  sort?: LedgerSortField = 'occurredAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  dir?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;
}
