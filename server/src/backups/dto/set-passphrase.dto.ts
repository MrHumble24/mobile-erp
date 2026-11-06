import { IsString, MinLength } from 'class-validator';

export class SetPassphraseDto {
  /** Never logged, never returned. Used to derive each backup's key. */
  @IsString()
  @MinLength(8, {
    message: 'The backup passphrase must be at least 8 characters',
  })
  passphrase!: string;
}
