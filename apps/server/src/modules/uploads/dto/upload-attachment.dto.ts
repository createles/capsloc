import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Validates optional form metadata sent alongside the multipart binary upload during runtime
 */
export class UploadAttachmentDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)    
    localeTag?: string; // Optional metadata e.g. "JA->EN", "DE-OVERFLOW"
}
