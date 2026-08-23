import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { db, ForbiddenError, type Role, type Session, type PublicUser } from "@/db/database";
import { readSession } from "@/db/session";
import { subscribe } from "@/db/persist";

type SessionContextValue = {
  user: PublicUser | null;
  session: Session | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    opts?: { portal?: "client" | "staff"; remember?: boolean },
  ) => Promise<Session>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [session, setSession] = useState<Session | null>(readSession());
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const next = await db.auth.me();
    setUser(next);
    setSession(readSession());
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    return subscribe(() => {
      void refresh();
    });
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      session,
      loading,
      login: async (email, password, opts) => {
        const next = await db.auth.login(email, password, opts);
        await refresh();
        return next;
      },
      logout: async () => {
        try {
          await db.auth.logout();
        } finally {
          setUser(null);
          setSession(null);
        }
      },
      refresh,
    }),
    [user, session, loading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
}

export function isAtelierRole(role: Role | undefined) {
  return role === "tailor" || role === "cutter" || role === "qc";
}

export { ForbiddenError };
