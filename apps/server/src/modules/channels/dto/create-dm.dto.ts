import { IsUUID } from 'class-validator';
import type { CreateDMDTO } from '@capsloc/types';

export class CreateDmDto implements CreateDMDTO {
    @IsUUID()
    recipientId: string;
}