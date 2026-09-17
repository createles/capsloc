import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import type { AddChannelMemberDTO } from '@capsloc/types';

export class AddChannelMemberDto implements AddChannelMemberDTO {
  @IsUUID('4', { message: 'userId must be a valid UUID' }) // UUID v4
  @IsNotEmpty({ message: 'userId is required' })
  userId!: string;

  @IsOptional()
  @IsString({ message: 'role must be a string if provided' })
  role?: 'admin' | 'member';
}
