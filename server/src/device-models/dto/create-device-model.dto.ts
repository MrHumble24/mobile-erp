import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AttributeDefDto } from './attribute-def.dto.js';

export class CreateDeviceModelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  brand!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  /** Stock kind (IMEI | SERIAL | QUANTITY). Defaults to IMEI (ADR 0029). */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  kindCode?: string;

  /** Optional product category (`null` leaves it ungrouped). */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  categoryId?: string | null;

  /** EAN printed on the box; must be unique across models. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(64)
  barcode?: string | null;

  /** Maker's code (Apple A2894 / Samsung SM-S918B); not unique. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(64)
  modelCode?: string | null;

  /** How customs writes this model (ADR 0027); matched to a price-list fee. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customsCode?: string;

  /** Omit → model is seeded with a default storage+color schema. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDefDto)
  attributes?: AttributeDefDto[];
}
