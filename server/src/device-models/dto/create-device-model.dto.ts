import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
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
