import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsIn,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsSupportedTimeZone } from '../../company/dto/validators.js';

export class OwnerSetupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;
}

export class CompanySetupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @IsSupportedTimeZone()
  timeZone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['uz', 'en', 'ru'])
  defaultLanguage?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(5)
  currencyCode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5)
  currencySign!: string;

  @IsOptional()
  @IsString()
  @IsIn(['before', 'after'])
  currencySignPosition?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 2])
  currencyDecimals?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  themeCode?: string;
}

export class FirstStoreSetupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
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
