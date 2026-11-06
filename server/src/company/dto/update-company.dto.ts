import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsSessionDuration, IsSupportedTimeZone } from './validators.js';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

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

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(5)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5)
  currencySign?: string;

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
  themeCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @IsSessionDuration()
  sessionDuration?: string;
}
