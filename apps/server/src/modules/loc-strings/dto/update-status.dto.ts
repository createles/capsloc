import { IsEnum } from 'class-validator';
import { StringStatus, type UpdateLocStringStatusDTO } from '@capsloc/types';

/**
 * Validates payload when updating a string's review lifecycle status
 */
export class UpdateLocStringStatusDto implements UpdateLocStringStatusDTO {
    @IsEnum(StringStatus, {
        message: `status must be one of: ${Object.values(StringStatus).join(', ')}`, // Modifies default error message
    })
    status!: StringStatus;
}