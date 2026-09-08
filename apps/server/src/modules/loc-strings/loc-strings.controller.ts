import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Body,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { LocStringsService } from './loc-strings.service.js';
import { QueryLocStringsDto } from './dto/query-loc-strings.dto.js';
import { UpdateLocStringStatusDto } from './dto/update-status.dto.js';

@Controller('loc-strings')
@UseGuards(JwtAuthGuard)
export class LocStringsController {
    constructor(private readonly locStringsService: LocStringsService) { }

    /**
     * GET /api/loc-strings
     * Paginated list of strings with optional filters: projectTag, status, targetLocale, search.
     */
    @Get()
    async findAll(@Query() query: QueryLocStringsDto) {
        return this.locStringsService.findAll(query);
    }

    /**
     * GET /api/loc-strings/:key
     * Resolves metadata for a specific string (e.g. LOC-MH-001) for the inspector drawer.
     */
    @Get(':key')
    async findByKey(@Param('key') key: string) {
        return this.locStringsService.findByKey(key);
    }

    /**
     * PATCH /api/loc-strings/:key/status
     * Mutates the review status of a localization string.
     */
    @Patch(':key/status')
    async updateStatus(
        @Param('key') key: string,
        @Body() dto: UpdateLocStringStatusDto,
    ) {
        return this.locStringsService.updateStatus(key, dto);
    }
}