import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLookupDto {
  /** Stable lookup key, UPPER_SNAKE_CASE. */
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be UPPER_SNAKE_CASE',
  })
  @MaxLength(64)
  code!: string;

  @IsString()
  @MaxLength(255)
  label!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateLookupDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
