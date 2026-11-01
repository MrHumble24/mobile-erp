import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProfileDto {
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  telegramHandle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}
