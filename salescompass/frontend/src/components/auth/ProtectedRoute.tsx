"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api";
import { clearStoredToken, getStoredToken } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }

    let active = true;
    getMe()
      .then(() => {
        if (active) {
          setReady(true);
        }
      })
      .catch(() => {
        clearStoredToken();
        router.replace("/login");
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-60 items-center justify-center">
        <Spinner label="Checking session" />
      </div>
    );
  }

  return <>{children}</>;
}
