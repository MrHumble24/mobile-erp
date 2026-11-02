import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Rename / re-describe a role. The code and its permissions are untouched. */
export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
