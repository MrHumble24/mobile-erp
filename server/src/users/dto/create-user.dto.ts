import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ProfileDto } from './profile.dto.js';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password!: string;

  @ValidateNested()
  @Type(() => ProfileDto)
  profile!: ProfileDto;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roleCodes!: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  storeIds?: string[];
}
