"use client";

import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import type { Session } from "@supabase/supabase-js";

import { getSupabaseBrowserClient, getSupabaseMissingEnvMessage } from "@/src/lib/supabase/browser";

type AdminAccessState =
  | {
      status: "missing-env";
      message: string;
      session: null;
      isAdmin: false;
      userId: null;
      role: null;
    }
  | {
      status: "loading";
      message: "";
      session: Session | null;
      isAdmin: boolean;
      userId: string | null;
      role: string | null;
    }
  | {
      status: "unauthenticated";
      message: "";
      session: null;
      isAdmin: false;
      userId: null;
      role: null;
    }
  | {
      status: "forbidden";
      message: "";
      session: Session;
      isAdmin: false;
      userId: string;
      role: string | null;
    }
  | {
      status: "ready";
      message: "";
      session: Session;
      isAdmin: true;
      userId: string;
      role: string;
    };

// Internal hook that actually performs the fetching
function useFetchAdminAccess(): AdminAccessState {
  const [state, setState] = useState<AdminAccessState>(() => {
    const msg = getSupabaseMissingEnvMessage();
    if (msg) {
      return {
        status: "missing-env",
        message: msg,
        session: null,
        isAdmin: false,
        userId: null,
        role: null,
      };
    }

    return {
      status: "loading",
      message: "",
      session: null,
      isAdmin: false,
      userId: null,
      role: null,
    };
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const supabaseClient = getSupabaseBrowserClient();
    if (!supabaseClient) return;

    const supabase = supabaseClient;

    let cancelled = false;

    async function refresh(nextSession: Session | null, opts?: { keepStatus?: boolean }) {
      if (cancelled) return;

      const prev = stateRef.current;

      // When the browser regains focus, Supabase can emit token refresh events.
      // We don't want to flash a loading state if we already know the user's access.
      const canKeepStatus =
        opts?.keepStatus === true &&
        (prev.status === "ready" || prev.status === "forbidden") &&
        !!nextSession &&
        prev.userId === nextSession.user.id;

      if (!nextSession) {
        setState({
          status: "unauthenticated",
          message: "",
          session: null,
          isAdmin: false,
          userId: null,
          role: null,
        });
        return;
      }

      if (canKeepStatus) {
        // Keep the prior status and role while we revalidate.
        setState((current) => {
          if (current.status !== "ready" && current.status !== "forbidden") return current;
          if (current.userId !== nextSession.user.id) return current;
          return { ...current, session: nextSession };
        });
      } else {
        setState((prevState) => ({
          status: "loading",
          message: "",
          session: nextSession,
          isAdmin: prevState.isAdmin,
          userId: nextSession.user.id,
          role: prevState.role,
        }));
      }

      const userId = nextSession.user.id;
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id,role,disabled_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        // Most likely RLS forbidding access because user isn't admin.
        setState({
          status: "forbidden",
          message: "",
          session: nextSession,
          isAdmin: false,
          userId,
          role: null,
        });
        return;
      }

      if (!data || data.disabled_at) {
        setState({
          status: "forbidden",
          message: "",
          session: nextSession,
          isAdmin: false,
          userId,
          role: data?.role ?? null,
        });
        return;
      }

      setState({
        status: "ready",
        message: "",
        session: nextSession,
        isAdmin: true,
        userId,
        role: data.role,
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      void refresh(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const keepStatus = event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION";
      void refresh(nextSession, { keepStatus });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

const AdminAccessContext = createContext<AdminAccessState | null>(null);

export function AdminAccessProvider({ children }: { children: ReactNode }) {
  const state = useFetchAdminAccess();
  return createElement(AdminAccessContext.Provider, { value: state }, children);
}

export function useAdminAccess(): AdminAccessState {
  const context = useContext(AdminAccessContext);
  if (!context) {
    throw new Error("useAdminAccess must be used within an AdminAccessProvider");
  }
  return context;
}

export function getAdminBootstrapSql(userId: string) {
  return `-- 1) Allow a logged-in user to read their own admin row (required for the app to detect admin)
do $$ begin
  create policy admin_users_self_read
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- 2) Grant admin role to this user (idempotent)
insert into public.admin_users (user_id, role)
values ('${userId}', 'owner')
on conflict (user_id)
do update set role = excluded.role, disabled_at = null;
`;
}
