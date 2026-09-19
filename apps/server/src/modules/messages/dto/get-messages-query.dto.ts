import { IsOptional, IsUUID, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMessagesQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  stringKey?: string;
}
