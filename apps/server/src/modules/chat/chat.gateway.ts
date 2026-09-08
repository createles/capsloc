import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service.js';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    UserStatus,
    type JoinChannelPayload,
    type SendMessagePayload,
} from '@capsloc/types';

// Extended Socket interface retaining authenticated user identity in memory
export interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> { // set argument types from our socket-events types
    data: {
        user: {
            id: string;
            email: string;
            displayName: string;
            locRole: string;
        };
    };
}

@WebSocketGateway({
    cors: {
        origin: '*', // Permissive for local dev; restrict to frontend domain in production
        credentials: true,
    },
    namespace: '/',
})
export class ChatGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server<ClientToServerEvents, ServerToClientEvents>;

    private readonly logger = new Logger(ChatGateway.name);

    // Multi-tab Presence Registry: Maps userId to Set of active socketIds
    private readonly activeUserSockets = new Map<string, Set<string>>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly messagesService: MessagesService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('ChatGateway initialized and listening for WebSocket handshakes');
    }

    /*
    Handshake Authentication Gatehouse:
    Validates JWT token from auth payload or headers before allowing connection.
    
    @param client - Connecting client socket
    */
    async handleConnection(client: AuthenticatedSocket) {
        try {
            const rawToken = client.handshake.auth?.token || client.handshake.headers?.authorization;

            if (!rawToken) {
                this.logger.warn(`Connection rejected: Missing token on socket ${client.id}`);
                client.disconnect(true);
                return;
            }

            const token = rawToken.replace(/^Bearer\s+/i, '');

            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'capsloc_super_secret_access_key_dev_12345'
            })

            client.data.user = {
                id: payload.sub,
                email: payload.email,
                displayName: payload.displayName || payload.email.split('@')[0],
                locRole: payload.locRole,
            };

            const userId = client.data.user.id;
            const existingSockets = this.activeUserSockets.get(userId) || new Set<string>();
            existingSockets.add(client.id);
            this.activeUserSockets.set(userId, existingSockets);

            if (existingSockets.size === 1) {
                this.server.emit('user_presence', {
                    userId,
                    status: UserStatus.ONLINE,
                });
                this.logger.log(`User ${userId} is now ONLINE (Socket: ${client.id})`);
            }
        } catch (err: any) {
            this.logger.error(`Handshake failed for socket ${client.id}: ${err.message}`);
            client.disconnect(true);
        }
    }

    /*
    Connection Teardown:
    Cleans up presence registry and broadcasts OFFLINE if all user tabs are closed.
    
    @param client - Disconnecting client socket
    */
    handleDisconnect(client: AuthenticatedSocket) {
        const user = client.data?.user;

        if (!user) return;

        const userId = user.id;
        const userSockets = this.activeUserSockets.get(userId);

        if (userSockets) {
            userSockets.delete(client.id);

            // if no more active tabs/devices remain (size 1 -> 0), broadcast OFFLINE
            if (userSockets.size === 0) {
                this.activeUserSockets.delete(userId);
                this.server.emit('user_presence', {
                    userId,
                    status: UserStatus.OFFLINE,
                });
                this.logger.log(`User ${userId} is now OFFLINE`);
            }
        }
    }

    /*
    Join Room Handler: Validates channel access via MessagesService bouncer before joining Socket.io room.

    @param client - authenticated client socket
    @param payload - { channelId: string }
    */
    @SubscribeMessage('join_channel')
    async handleJoinChannel(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() payload: JoinChannelPayload,
    ) {
        try {
            const { channelId } = payload;
            const userId = client.data.user.id;

            // Authorization check: verify channel exists and user has membership
            await this.messagesService.validateChannelMembership(channelId, userId);

            const roomName = `channel:${channelId}`;
            client.join(roomName);
            this.logger.log(`Socket ${client.id} (User: ${userId} joined room ${roomName})`);
        } catch (error: any) {
            client.emit('error', {
                message: error.message || 'Failed to join channel',
                code: error.status ? String(error.status) : '403',
            });
        }
    }

    /*
    Leaving Room Handler
    */
    @SubscribeMessage('leave_channel')
    handleLeaveChannel(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() payload: JoinChannelPayload,
    ) {
        const roomName = `channel:${payload.channelId}`;
        client.leave(roomName);
        this.logger.log(`Socket ${client.id} left room ${roomName}`);
    }


    /*
    Send Message Handler

    @param client - Authenticated client socket
    @param payload - { channelId: string , content: string, attachmentIds?: string[], stringKeys?: string[] }
    */
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() payload: SendMessagePayload,
    ) {
        try {
            const { channelId, content, attachmentIds, stringKeys } = payload;
            const userId = client.data.user.id;

            const savedMessage = await this.messagesService.create(channelId, userId, {
                content,
                attachmentIds,
                stringKeys,
            });

            const roomName = `channel:${channelId}`;
            this.server.to(roomName).emit('new_message', savedMessage as any);

            client.to(roomName).emit('user_stop_typing', {
                channelId,
                userId,
            });
        } catch (error: any) {
            client.emit('error', {
                message: error.message || 'Failed to send message',
                code: error.status ? String(error.status) : '500',
            });
        }
    }

    /*
    Typing Start: Broadcasts typing status to everyone in the room EXCLUDING sender

    @param client - Authenticated client socket
    @param payload - { channelId: string }
    */
    @SubscribeMessage('typing_start')
    handleTypingStart(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() payload: { channelId: string },
    ) {
        const roomName = `channel:${payload.channelId}`
        const user = client.data.user;

        client.to(roomName).emit('user_typing', {
            channelId: payload.channelId,
            userId: user.id,
            displayName: user.displayName,
        });
    }

    /*
    Typing stop: Broadcast typing stopped to everyone in the room EXCLUDING sender

    @param client - Authenticated client socket
    @param payload - { channelId: string }
    */
    @SubscribeMessage('typing_stop')
    handleTypingStop(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() payload: { channelId: string },
    ) {
        const roomName = `channel:${payload.channelId}`

        client.to(roomName).emit('user_stop_typing', {
            channelId: payload.channelId,
            userId: client.data.user.id,
        });
    }
}