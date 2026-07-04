"use client";

import { createContext, useContext, useEffect, ReactNode, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: any;
  accessToken: string | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, setUser, logout: storeLogout, isInitialized, setInitialized } = useAuthStore();
  const [isLoading, setIsLoading] = useState(!isInitialized);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleLogout = () => {
      // 1. Clear Zustand Store
      storeLogout();
      // 2. Clear React Query Cache
      queryClient.clear();
      // 3. Redirect is handled in storeLogout via window.location.href for a clean state
    };

    const validateSession = async () => {
      if (!accessToken) {
        setIsLoading(false);
        setInitialized(true);
        return;
      }

      try {
        // Validate token with backend
        const { data } = await apiClient.get("/auth/me");
        setUser(data.user, accessToken);
      } catch (error: any) {
        console.error("Session validation failed:", error);
        // If 401 or other auth error, clear everything
        if (error.response?.status === 401 || error.response?.status === 403) {
            handleLogout();
        }
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };

    if (!isInitialized) {
        validateSession();
    } else {
        setIsLoading(false);
    }
  }, [accessToken, isInitialized, queryClient, setInitialized, setUser, storeLogout]);

  const handleLogout = () => {
    // 1. Clear Zustand Store
    storeLogout();
    // 2. Clear React Query Cache
    queryClient.clear();
    // 3. Redirect is handled in storeLogout via window.location.href for a clean state
  };

  // Protected Routes Check
  useEffect(() => {
    const isProtectedRoute = pathname?.startsWith('/customer') || pathname?.startsWith('/vendor');
    if (isInitialized && !user && isProtectedRoute) {
        router.push(`/login?redirect=${pathname || ''}`);
    }
  }, [user, pathname, isInitialized, router]);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, logout: handleLogout }}>
      {!isLoading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
