import {
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateBackupSettingsDto {
  @IsOptional()
  @IsBoolean()
  scheduleEnabled?: boolean;

  /** "HH:mm", server local time. */
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'scheduleTime must be HH:mm',
  })
  scheduleTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  keepLast?: number;
}
