import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * One queued offline mutation. `type` is validated against the handler registry
 * at dispatch (unknown → rejected), not here, so one bad type does not 400 the
 * whole batch. `payload` is validated per-type with the owning module's DTO.
 */
export class MutationDto {
  /** Client mutation id, also used as the idempotency key. */
  @IsUUID()
  id!: string;

  @IsString()
  type!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseVersion?: number;

  @IsString()
  occurredAt!: string;
}

export class PushDto {
  @IsString()
  terminalId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MutationDto)
  mutations!: MutationDto[];
}
