import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway.js';
import { AuthModule } from '../auth/auth.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { ChannelsModule } from '../channels/channels.module.js';

@Module({
    imports: [AuthModule, MessagesModule, ChannelsModule],
    providers: [ChatGateway],
    exports: [ChatGateway],
})
export class ChatModule { }