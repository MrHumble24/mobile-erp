import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
} from 'class-validator';

/** Take pieces of a quantity product out of stock for a repair. */
export class AddPartDto {
  @IsUUID()
  modelId!: string;

  @IsInt()
  @IsPositive()
  @Max(1_000_000)
  quantity!: number;

  /** Client-generated key; a retried submit replays instead of writing twice. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientMutationId?: string;
}
