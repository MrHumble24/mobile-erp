import { IsNumber, Max, Min } from 'class-validator';

/** Hand fix for one phone's customs fee; the difference posts to the ledger. */
export class SetDeviceCustomsFeeDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  customsFee!: number;
}
