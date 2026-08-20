import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { startOAuthLogin } from "@/constants/oauth";

type AuthContextValue = {
  user: Auth.User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  refresh: () => Promise<Auth.User | null>;
  logout: () => Promise<void>;
  startLogin: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(user: NonNullable<Awaited<ReturnType<typeof Api.getMe>>>): Auth.User {
  return {
    id: user.id,
    openId: user.openId,
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod,
    role: user.role,
    lastSignedIn: new Date(user.lastSignedIn),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (): Promise<Auth.User | null> => {
    setLoading(true);
    setError(null);
    try {
      const apiUser = await Api.getMe();
      if (apiUser) {
        const normalized = normalizeUser(apiUser);
        await Auth.setUserInfo(normalized);
        setUser(normalized);
        return normalized;
      }
      await Auth.clearUserInfo();
      setUser(null);
      return null;
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error("ავტორიზაციის შემოწმება ვერ მოხერხდა");
      setError(nextError);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } catch {
      // Local cleanup must complete even when the network is temporarily unavailable.
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
    }
  }, []);

  const startLogin = useCallback(async (): Promise<boolean> => {
    setError(null);
    const launchResult = await startOAuthLogin();
    if (Platform.OS !== "web" || launchResult === "redirected") return true;
    return Boolean(await refresh());
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      refresh,
      logout,
      startLogin,
    }),
    [error, loading, logout, refresh, startLogin, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
