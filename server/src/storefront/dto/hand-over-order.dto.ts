import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class HandOverPaymentDto {
  @IsString()
  @IsNotEmpty()
  accountCode!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
}

export class HandOverStorefrontOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HandOverPaymentDto)
  payments!: HandOverPaymentDto[];

  @IsOptional()
  @IsString()
  deliveryFeeAccountCode?: string;
}
