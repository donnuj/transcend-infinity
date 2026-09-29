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
      // backend emits base64url (no +/=) — convert to standard base64 for atob
      const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
      payload = JSON.parse(atob(b64)) as AuthPayload;
    } catch {
      router.replace("/login");
      return;
    }

    if (window.opener && !window.opener.closed) {
      try {
        // use '*' — opener may be on a different Cloudflare domain (custom vs .pages.dev)
        window.opener.postMessage(
          { type: "GOOGLE_AUTH", payload },
          "*",
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
