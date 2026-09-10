import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { type GlossarySearchQueryDTO } from '@capsloc/types';

export const GLOSSARY_CATEGORIES = [
    'Character',
    'Weapon',
    'Item',
    'Location',
    'Monster',
] as const;

export class SearchGlossaryDto implements GlossarySearchQueryDTO {
    @IsNotEmpty({ message: 'Search query string q must not be empty' })
    @IsString()
    q!: string;

    @IsOptional()
    @IsIn(GLOSSARY_CATEGORIES, {
        message: `category must be one of: ${GLOSSARY_CATEGORIES.join(', ')}`,
    })
    category?: 'Character' | 'Weapon' | 'Item' | 'Location' | 'Monster';
}