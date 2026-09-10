import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QueryLocStringsDto } from './dto/query-loc-strings.dto.js';
import { UpdateLocStringStatusDto } from './dto/update-status.dto.js';
import { safeUserSelect } from '../users/users.service.js';

@Injectable()
export class LocStringsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Finds a single localization string by unique key (e.g. "LOC-MH-001" or "#LOC-MH-001").
     * Includes recent message references for screen & discussion context
     *
     * @param stringKey - Unique string key (with or without # prefix)
     * @throws NotFoundException if the string does not exist in the database
     */
    async findByKey(stringKey: string) {
        // 1. Sanitize key by stripping leading '#' or '$'
        const cleanKey = stringKey.replace(/^[#$]/, '');

        // 2. Query Prisma with nested references and sanitized sender profile
        const locString = await this.prisma.locString.findUnique({
            where: { stringKey: cleanKey },
            include: {
                references: {
                    take: 5,
                    orderBy: { message: { createdAt: 'desc' } },
                    include: {
                        message: {
                            select: {
                                id: true,
                                content: true,
                                createdAt: true,
                                sender: { select: safeUserSelect, },
                            },
                        },
                    },
                },
            },
        });

        if (!locString) {
            throw new NotFoundException(`Localization string '${stringKey}' not found`);
        }

        return locString;
    }

    /**
     * Filterable, paginated query for game localization strings
     *
     * @param query - QueryLocStringsDto (projectTag, status, targetLocale, search, page, limit)
     */
    async findAll(query: QueryLocStringsDto) {
        const { projectTag, status, targetLocale, search, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit; // based on queried page, skips set amount of database items

        const where: any = {}; // empty where clause for database query
        if (projectTag) where.projectTag = projectTag;
        if (status) where.status = status;
        if (targetLocale) where.targetLocale = targetLocale;
        if (search) {
            where.OR = [ // sets specific stringKey, actual text-based search queries
                { stringKey: { contains: search, mode: 'insensitive' } },
                { sourceText: { contains: search, mode: 'insensitive' } },
                { targetText: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Execute parallel findMany and count queries
        const [items, total] = await Promise.all([
            this.prisma.locString.findMany({
                where, // takes up the constructed where clause if available
                skip,
                take: limit,
                orderBy: { stringKey: 'asc' },
            }),
            this.prisma.locString.count({ where }), // count items matching the where clause
        ]);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Updates string review status (e.g. IN_REVIEW -> LQA_FLAGGED).
     *
     * @param stringKey - Unique string key
     * @param dto - UpdateLocStringStatusDto containing target status enum
     */
    async updateStatus(stringKey: string, dto: UpdateLocStringStatusDto) {
        const cleanKey = stringKey.replace(/^[#$]/, ''); // Strip leading '#' or '$'

        // Verify existence first (throws 404 if not found)
        await this.findByKey(cleanKey);

        return this.prisma.locString.update({
            where: { stringKey: cleanKey },
            data: { status: dto.status },
        });
    }
}