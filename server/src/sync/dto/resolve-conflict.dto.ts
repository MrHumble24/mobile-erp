import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveConflictDto {
  @IsIn(['keep-server', 'apply-terminal'])
  resolution!: 'keep-server' | 'apply-terminal';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
