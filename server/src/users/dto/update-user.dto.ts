import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { ProfileDto } from './profile.dto.js';

export class UpdateUserDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
