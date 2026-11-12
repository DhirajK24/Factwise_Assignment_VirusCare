"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { UserProfile, UserRole } from "@/types";
import { initialProfiles } from "../db/seed-data";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isNurse: boolean;
  isDoctor: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COOKIE_NAME = "viruscare_user_id";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=604800; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: UserProfile | null;
}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser || initialProfiles[0]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const savedUserId = getCookie(COOKIE_NAME);
    if (savedUserId) {
      const found = initialProfiles.find((p) => p.id === savedUserId);
      if (found) {
        setUser(found);
      }
    } else if (user) {
      setCookie(COOKIE_NAME, user.id);
    }
  }, []);

  const login = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const found = initialProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setUser(found);
        setCookie(COOKIE_NAME, found.id);
        startTransition(() => {
          router.refresh();
        });
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    removeCookie(COOKIE_NAME);
    setUser(null);
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  };

  const switchUser = async (userId: string) => {
    const found = initialProfiles.find((p) => p.id === userId);
    if (found) {
      setUser(found);
      setCookie(COOKIE_NAME, found.id);
      startTransition(() => {
        router.refresh();
      });
    }
  };

  const switchRole = async (targetRole: UserRole) => {
    const found = initialProfiles.find((p) => p.role === targetRole);
    if (found) {
      await switchUser(found.id);
    }
  };

  const role = user?.role || "admin";
  const isAdmin = role === "admin";
  const isNurse = role === "nurse";
  const isDoctor = role === "doctor";

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isNurse,
        isDoctor,
        isLoading,
        login,
        logout,
        switchUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
