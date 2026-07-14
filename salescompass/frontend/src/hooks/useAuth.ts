"use client";

import { useEffect, useState } from "react";
import { getMe, login as loginRequest, register as registerRequest } from "@/lib/api";
import { clearStoredToken, getStoredToken, storeToken } from "@/lib/auth";
import type { LoginPayload, RegisterPayload, User } from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => clearStoredToken())
      .finally(() => setLoading(false));
  }, []);

  async function signIn(payload: LoginPayload) {
    setError(null);
    const token = await loginRequest(payload);
    storeToken(token.access_token);
    const currentUser = await getMe();
    setUser(currentUser);
    return currentUser;
  }

  async function signUp(payload: RegisterPayload) {
    setError(null);
    await registerRequest(payload);
    return signIn({ email: payload.email, password: payload.password });
  }

  function signOut() {
    clearStoredToken();
    setUser(null);
  }

  return { user, loading, error, setError, signIn, signUp, signOut };
}

