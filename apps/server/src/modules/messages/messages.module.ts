import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [AuthModule],
    controllers: [MessagesController],
    providers: [MessagesService],
    exports: [MessagesService], // Exported for ChatGateway consumption in our Socket.io implementation
})
export class MessagesModule { }