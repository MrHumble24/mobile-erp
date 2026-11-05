import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class OpenShiftDto {
  /** Cash counted in the drawer at the start of the shift. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  openingCount!: number;
}
