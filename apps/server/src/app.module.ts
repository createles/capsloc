import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ChannelsModule } from './modules/channels/channels.module.js';
import { MessagesModule } from './modules/messages/messages.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { LocStringsModule } from './modules/loc-strings/loc-strings.module.js';
import { GlossaryModule } from './modules/glossary/glossary.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ChannelsModule,
    MessagesModule,
    ChatModule,
    LocStringsModule,
    GlossaryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
