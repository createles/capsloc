// apps/client/src/hooks/useAuth.ts
import { useContext } from "react";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

/**
 * Hook to access authentication context from AuthContext
 * Should throw an error if invoked outside of an <AuthProvider>.
 *
 * @returns {AuthContextType} Active authentication state and mutation dispatchers
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
