"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserSummary, LoginRequest } from "@/types/api";
import { getMe, login as apiLogin, logout as apiLogout } from "@/services/auth.service";
import { tokenStore } from "@/lib/api-client";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────
interface AuthState {
  user: UserSummary | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (body: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isPractitioner: boolean;
  isMedicalAssistant: boolean;
  isPatient: boolean;
  setUser: (user: UserSummary) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  // Rehydrate session on mount
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setState({ user: null, loading: false });
      return;
    }
    getMe()
      .then((user) => setState({ user, loading: false }))
      .catch(() => {
        tokenStore.clear();
        setState({ user: null, loading: false });
      });
  }, []);

  const login = useCallback(
    async (body: LoginRequest) => {
      const auth = await apiLogin(body);
      setState({ user: auth.user, loading: false });
      // Role-based redirect
      const roles = auth.user.roles;
      if (roles.includes("ADMIN")) router.push("/admin/staff");
      else if (roles.includes("PRACTITIONER")) router.push("/practitioner/agenda");
      else if (roles.includes("MEDICAL_ASSISTANT")) router.push("/assistant/agenda");
      else router.push("/patient/me");
    },
    [router]
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setState({ user: null, loading: false });
    router.push("/login");
  }, [router]);

  const roles = state.user?.roles ?? [];

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAdmin: roles.includes("ADMIN"),
        isPractitioner: roles.includes("PRACTITIONER"),
        isMedicalAssistant: roles.includes("MEDICAL_ASSISTANT"),
        isPatient: roles.includes("PATIENT"),
        setUser: (user) => setState({ user, loading: false }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
