import { useEffect, useRef } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";

export function AccountSync() {
  const { user, isAuthenticated } = useAuth();
  const { role } = useApp();
  const mutation = trpc.profile.setAccountType.useMutation();
  const lastSynced = useRef("");

  useEffect(() => {
    if (!isAuthenticated || !user || !role) return;
    const syncKey = `${user.id}:${role}`;
    if (lastSynced.current === syncKey || mutation.isPending) return;
    lastSynced.current = syncKey;
    mutation.mutate(
      { accountType: role },
      {
        onError: () => {
          lastSynced.current = "";
        },
      },
    );
  }, [isAuthenticated, mutation, role, user]);

  return null;
}
