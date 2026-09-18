import { createContext} from "react";
import type {
  UserProfileDTO,
  LocRole,
} from "@capsloc/types";

export interface LoginCredentials {
  // Credentials object
  email: string;
  password: string;
}

export interface RegisterCredentials {
  // Registration object
  username: string;
  email: string;
  password: string;
  displayName: string;
  locRole?: LocRole;
  primaryLocale?: string;
}

export interface AuthContextType {
  user: UserProfileDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean; // React UI boolean
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfileDTO>) => Promise<UserProfileDTO>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);