import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

/** Move money between two accounts: one request, two rows, store total unchanged. */
export class TransferDto {
  @IsString()
  fromAccountCode!: string;

  @IsString()
  toAccountCode!: string;

  /** The positive amount moved; the server writes -amount on from, +amount on to. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000_000)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
