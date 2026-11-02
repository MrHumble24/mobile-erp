import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { AttributeType } from '../lib/attribute-schema.js';

/** One spec field in a model's attribute schema. Keys are re-slugified server-side. */
export class AttributeDefDto {
  @IsString()
  @MaxLength(64)
  key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  label!: string;

  @IsIn(['text', 'number', 'select'])
  type!: AttributeType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
