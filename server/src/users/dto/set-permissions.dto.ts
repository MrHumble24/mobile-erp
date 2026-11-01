import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class PermissionOverrideDto {
  @IsString()
  permissionCode!: string;

  @IsBoolean()
  granted!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class SetPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideDto)
  overrides!: PermissionOverrideDto[];
}
