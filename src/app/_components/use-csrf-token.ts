"use client";

import { useEffect, useState } from "react";

export function useCsrfToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/auth/csrf", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("csrf");
        return (await res.json()) as { csrfToken: string };
      })
      .then((body) => {
        if (!cancelled) setToken(body.csrfToken);
      })
      .catch(() => {
        if (!cancelled) setToken(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return token;
}
