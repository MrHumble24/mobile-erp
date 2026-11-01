import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ChangeStatusDto {
  @IsString()
  @MaxLength(32)
  toStatusCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  /** Offline optimistic lock: the version the caller last saw. */
  @IsInt()
  @Min(0)
  expectedVersion!: number;
}
