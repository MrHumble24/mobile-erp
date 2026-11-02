import { IsString, MaxLength, MinLength } from 'class-validator';

/** Admin password reset. The new password is hashed and never returned. */
export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password!: string;
}
