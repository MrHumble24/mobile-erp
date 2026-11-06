import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OwnerSetupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CompanySetupDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @IsString()
  currencyCode!: string;

  @IsString()
  currencySign!: string;

  @IsOptional()
  @IsString()
  currencySignPosition?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  currencyDecimals?: number;

  @IsOptional()
  @IsString()
  themeCode?: string;
}

export class FirstStoreSetupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class SwitchesSetupDto {
  @IsOptional()
  @IsBoolean()
  discountsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  customerCreditEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  shiftsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  repairsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  bonusEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  receiptPrintingEnabled?: boolean;
}

export class TelegramSetupDto {
  @IsOptional()
  @IsString()
  botToken?: string;

  @IsOptional()
  @IsString()
  chatId?: string;
}

export class SetupDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @ValidateNested()
  @Type(() => OwnerSetupDto)
  owner!: OwnerSetupDto;

  @ValidateNested()
  @Type(() => CompanySetupDto)
  company!: CompanySetupDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FirstStoreSetupDto)
  firstStore?: FirstStoreSetupDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SwitchesSetupDto)
  switches?: SwitchesSetupDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TelegramSetupDto)
  telegram?: TelegramSetupDto;
}
