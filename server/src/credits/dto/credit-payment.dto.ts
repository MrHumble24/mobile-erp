import { IsNumber, IsPositive, IsString, Max } from 'class-validator';

/** A later payment on a credit, or an overpayment refund. Cash or card. */
export class CreditPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000_000)
  amount!: number;

  @IsString()
  accountCode!: string;
}
