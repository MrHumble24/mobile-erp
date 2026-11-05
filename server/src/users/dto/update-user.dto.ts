import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProfileDto } from './profile.dto.js';

export class UpdateUserDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  storeIds?: string[];
}
