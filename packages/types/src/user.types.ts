import { LocRole, UserStatus } from './enums.js';

export interface UserProfileDTO { // Safely send User details without sensitive data
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    customStatus?: string | null; // e.g. "Meeting till 10:30, Reviewing MH Wilds DLC strings"
    locRole: LocRole;
    primaryLocale: string;
    targetLocales: string[];
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}

export interface AuthTokensDTO { 
    accessToken: string;
}

export interface AuthResponseDTO {
    user: UserProfileDTO;
    accessToken: string;
}