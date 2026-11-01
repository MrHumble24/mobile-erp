import {
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  IsNumber,
} from 'class-validator';

export class CreatePartnerDto {
  @IsString()
  @MaxLength(200)
  shopName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  telegramHandle?: string;

  /** 0 means "no credit limit"; the rule only fires when > 0. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  creditLimit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
