import { MessageDTO } from './message.types.js';
import { UserStatus } from './enums.js';

export interface JoinChannelPayload {
    channelId: string;
}

export interface SendMessagePayload {
    channelId: string;
    content: string;
    attachmentIds?: string[];
    stringKeys?: string[];
}

export interface TypingIndicatorPayload { // "OOO is typing..." notifier
    channelId: string;
    userId: string;
    displayName: string;
}

export interface UserPresencePayload { // Status indicator
    userId: string;
    status: UserStatus;
}

export interface ServerToClientEvents {
    new_message: (message: MessageDTO) => void;
    user_typing: (payload: TypingIndicatorPayload) => void;
    user_stop_typing: (payload: { channelId: string; userId: string }) => void;
    user_presence: (payload: UserPresencePayload) => void;
    error: (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
    join_channel: (payload: JoinChannelPayload) => void;
    leave_channel: (payload: JoinChannelPayload) => void;
    send_message: (payload: SendMessagePayload) => void;
    typing_start: (payload: { channelId: string }) => void;
    typing_stop: (payload: { channelId: string }) => void;
}