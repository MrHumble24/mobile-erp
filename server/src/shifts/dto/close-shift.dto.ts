import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CloseShiftDto {
  /** Cash counted in the drawer at the end of the shift. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  closingCount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
