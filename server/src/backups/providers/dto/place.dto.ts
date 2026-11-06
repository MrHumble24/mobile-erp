import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SetEnabledDto {
  @IsBoolean()
  enabled!: boolean;
}

export class SetPlaceSettingsDto {
  /** Telegram backup chat id (must not be a shop alert chat). */
  @IsOptional()
  @IsString()
  chatId?: string;
}

export class SetPlaceSecretDto {
  /** Only manually-set secrets; refresh tokens come from the OAuth callback. */
  @IsIn(['botToken', 'clientId', 'clientSecret'])
  kind!: string;

  @IsString()
  @MinLength(1)
  value!: string;
}
