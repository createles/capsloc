import { LocRole, UserStatus } from './enums.js';

export interface UserProfileDTO { // Safely send User details without sensitive data
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
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