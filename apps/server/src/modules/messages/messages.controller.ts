import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('channels/:channelId/messages') // includes the channelid so it can be cleanly extracted by the route params
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    /*
    GET /api/channels/:channelId/messages?cursor=...&limit=50
    Returns paginated message history for an authorized channel
    */
    @Get()
    async findByChannel(
        @Param('channelId') channelId: string,
        @CurrentUser('id') userId: string,
        @Query() query: GetMessagesQueryDto,
    ) {
        return this.messagesService.findByChannel(channelId, userId, query);
    }

    /*
    POST /api/channels/:channelId/messages
    Persists a new message in the specified channel
    */
    @Post()
    async create(
        @Param('channelId') channelId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: CreateMessageDto,
    ) {
        return this.messagesService.create(channelId, userId, dto);
    }
}