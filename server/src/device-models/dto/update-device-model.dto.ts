import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AttributeDefDto } from './attribute-def.dto.js';

export class UpdateDeviceModelDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Stock kind; rejected if the model already has units (ADR 0029). */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  kindCode?: string;

  /** `null` clears the category. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  categoryId?: string | null;

  /** `null` clears the barcode; otherwise must stay unique. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(64)
  barcode?: string | null;

  /** `null` clears the maker's code. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(64)
  modelCode?: string | null;

  /** `null` clears the customs code. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(255)
  customsCode?: string | null;

  /** Default till price per piece for a QUANTITY product; `null` clears it. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  salePrice?: number | null;

  /** Replaces the whole schema; the reserved storage select is re-injected. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDefDto)
  attributes?: AttributeDefDto[];
}
