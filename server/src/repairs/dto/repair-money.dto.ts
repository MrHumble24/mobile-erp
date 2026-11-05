import { IsNumber, IsPositive, IsString, Max } from 'class-validator';

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
}
