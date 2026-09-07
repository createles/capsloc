import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ChannelsService } from './channels.service.js';
import { CreateChannelDto } from './dto/create-channel.dto.js';
import { CreateDmDto } from './dto/create-dm.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
    constructor(private readonly channelsService: ChannelsService) { }

    /*
    GET /api/channels
    Returns all public channels + enrolled private/DM channels
    */
    @Get()
    async findAll(@CurrentUser('id') userId: string) {
        return this.channelsService.findAll(userId);
    }

    /*
    POST /api/channels
    Creates a project or locale channel
    */
    @Post()
    async create(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateChannelDto,
    ) {
        return this.channelsService.create(userId, dto);
    }

    /*
    POST /api/channels/dm
    Idempotently resolves or provisions a 1-on-1 direct message channel
    Must be declared BEFORE ':id' to prevent routing conflicts
    */
    @Post('dm')
    async findOrCreateDM(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateDmDto,
    ) {
        return this.channelsService.findOrCreateDM(userId, dto.recipientId);
    }

    /*
    GET /api/channels/:id
    Returns channel details if user is authorized
    */
    @Get(':id')
    async findById(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.channelsService.findById(id, userId);
    }

    /*
    POST /api/channels/:id/join
    Enrolls user into a public project channel
    */
    @Post(':id/join')
    async join(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.channelsService.join(id, userId);
    }
}