import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ChannelsModule } from './modules/channels/channels.module.js';
import { MessagesModule } from './modules/messages/messages.module.js';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ChannelsModule, MessagesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
