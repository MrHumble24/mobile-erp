import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateStorefrontSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  showPrices?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactTelegram?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}
