import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GlossaryService } from './glossary.service.js';
import { SearchGlossaryDto } from './dto/search-glossary.dto.js';

@Controller('glossary')
@UseGuards(JwtAuthGuard)
export class GlossaryController {
    constructor(private readonly glossaryService: GlossaryService) { }

    /**
     * GET /api/glossary/search?q=demon&category=Item
     * Autocomplete endpoint for real-time term resolution in chat & inspector.
     */
    @Get('search')
    async search(@Query() dto: SearchGlossaryDto) {
        return this.glossaryService.search(dto);
    }

    /**
     * GET /api/glossary
     * Retrieves all canonical glossary terms, optionally filtered by ?category=Monster.
     */
    @Get()
    async findAll(@Query('category') category?: string) {
        return this.glossaryService.findAll(category);
    }
}