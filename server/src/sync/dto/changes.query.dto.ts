import { IsOptional, IsString } from 'class-validator';

export class ChangesQueryDto {
  /** ISO timestamp; rows with updatedAt strictly greater are returned. */
  @IsOptional()
  @IsString()
  since?: string;
}
