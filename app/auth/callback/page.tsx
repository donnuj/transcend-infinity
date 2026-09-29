"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/auth";

type AuthPayload = {
  accessToken: string;
  profile: { id: number; username: string; email: string; level: number };
};

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const data = new URLSearchParams(window.location.hash.slice(1)).get("data");
    if (!data) {
      router.replace("/login");
      return;
    }

    let payload: AuthPayload;
    try {
      payload = JSON.parse(atob(data)) as AuthPayload;
    } catch {
      router.replace("/login");
      return;
    }

    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(
          { type: "GOOGLE_AUTH", payload },
          window.location.origin,
        );
        window.close();
      } catch {
        saveSession(payload.accessToken, {
          ...payload.profile,
          id: String(payload.profile.id),
        });
        router.replace("/game");
      }
    } else {
      saveSession(payload.accessToken, {
        ...payload.profile,
        id: String(payload.profile.id),
      });
      router.replace("/game");
    }
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p
        className="text-[12px] tracking-[0.2em] uppercase"
        style={{ color: "rgba(200,155,60,0.7)" }}
      >
        Autenticando...
      </p>
    </div>
  );
}
