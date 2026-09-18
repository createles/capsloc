import React, { useState, useEffect, type ReactNode } from "react";
import type { UserProfileDTO, AuthTokensDTO } from "@capsloc/types";
import { api, setAccessToken } from "../services/api";
import { AuthContext, type LoginCredentials, type RegisterCredentials } from "./AuthContext";
import { type AuthResponseDTO } from "@capsloc/types";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silent Session Restoration on Mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // 1. Silent Refresh using HttpOnly cookie
        const { data: tokens } = await api.post<AuthTokensDTO>("/auth/refresh");
        setAccessToken(tokens.accessToken);

        // 2. Hydrate user profile from backend
        const { data: profile } = await api.get<UserProfileDTO>("/auth/me");
        setUser(profile);
      } catch {
        // No active session or cookie expired; stay in logged-out state
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const { data } = await api.post<AuthResponseDTO>("/auth/login", credentials); // gives us our sanitized user data and the accessToken
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    await api.post("/auth/register", credentials);
    // Auto-login upon successful registration
    await login({
      email: credentials.email,
      password: credentials.password,
    });
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<UserProfileDTO>): Promise<UserProfileDTO> => {
    const { data: updated } = await api.patch<UserProfileDTO>("/users/profile", data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user, // turn into a true boolean with !! to return true or false
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
