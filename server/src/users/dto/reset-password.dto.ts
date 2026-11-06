import { IsString, MaxLength, MinLength } from 'class-validator';

/** One rule for both the website reset and the server-side `pnpm reset-password`. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 255;

/** Admin password reset. The new password is hashed and never returned. */
export class ResetPasswordDto {
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
