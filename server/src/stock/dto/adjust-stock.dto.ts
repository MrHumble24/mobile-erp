import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** The two stock corrections (ADR 0030). Neither moves money. */
export const ADJUST_TYPES = ['WRITE_OFF', 'COUNT_CORRECTION'] as const;
export type AdjustType = (typeof ADJUST_TYPES)[number];

export class AdjustStockDto {
  @IsUUID()
  modelId!: string;

  @IsIn(ADJUST_TYPES)
  type!: AdjustType;

  /** WRITE_OFF: pieces to remove (positive). Ignored for COUNT_CORRECTION. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity?: number;

  /** COUNT_CORRECTION: the counted quantity on the shelf (server writes the diff). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  countedQuantity?: number;

  /** Required for a WRITE_OFF; optional for a COUNT_CORRECTION. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
