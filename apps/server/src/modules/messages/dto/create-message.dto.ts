import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID, MaxLength } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(4000)
    content!: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    attachmentIds?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    stringKeys?: string[];
}