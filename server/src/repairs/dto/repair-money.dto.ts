import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * A repair money movement: a customer payment, a refund, or an outside-master
 * payment. Always a positive amount and an account; the sign is decided by the
 * endpoint (payment/outside = in/out, refund = out).
 */
export class RepairMoneyDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000_000)
  amount!: number;

  @IsString()
  accountCode!: string;

  /** Client-generated key; a retried submit replays instead of writing twice. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientMutationId?: string;
}
