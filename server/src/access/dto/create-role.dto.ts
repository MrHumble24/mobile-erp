import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be UPPER_SNAKE_CASE',
  })
  @MaxLength(50)
  code!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
