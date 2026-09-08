import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SearchGlossaryDto } from './dto/search-glossary.dto.js';

@Injectable()
export class GlossaryService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Lists canonical glossary terms, optionally filtered by category.
     *
     * @param category - Optional category filter (e.g. 'Item', 'Monster')
     */
    async findAll(category?: string) {
        const where = category ? { category } : {};
        return this.prisma.glossaryTerm.findMany({
            where,
            orderBy: { termKey: 'asc' },
        });
    }

    /**
     * Performs case-insensitive search across termKey, sourceJa, and targetEn.
     * Capped at 20 results for fast autocomplete popovers.
     *
     * @param dto - SearchGlossaryDto containing search term `q` and optional `category`
     */
    async search(dto: SearchGlossaryDto) {
        const { q, category } = dto;

        const where: any = {
            OR: [
                { termKey: { contains: q, mode: 'insensitive' } }, // check termKey for query text **termKey represents uniform identifier name
                { sourceJa: { contains: q, mode: 'insensitive' } }, // check ja source text
                { targetEn: { contains: q, mode: 'insensitive' } }, // check en target text
            ],
        };

        if (category) {
            where.category = category;
        }

        return this.prisma.glossaryTerm.findMany({
            where,
            take: 20,
            orderBy: { termKey: 'asc' },
        });
    }
}