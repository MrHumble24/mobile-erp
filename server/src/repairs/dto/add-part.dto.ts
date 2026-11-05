import { IsInt, IsPositive, IsUUID, Max } from 'class-validator';

/** Take pieces of a quantity product out of stock for a repair. */
export class AddPartDto {
  @IsUUID()
  modelId!: string;

  @IsInt()
  @IsPositive()
  @Max(1_000_000)
  quantity!: number;
}
