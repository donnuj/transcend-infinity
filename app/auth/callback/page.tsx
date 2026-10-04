"use client";

export const runtime = 'edge';

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
      // backend emits base64url — convert to padded standard base64 for atob
      const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
      payload = JSON.parse(atob(padded)) as AuthPayload;
    } catch {
      router.replace("/login");
      return;
    }

    const msg = { type: "GOOGLE_AUTH", payload };

    if (window.opener && !window.opener.closed) {
      // opener is reachable — postMessage and close popup
      try {
        window.opener.postMessage(msg, "*");
        window.close();
        return;
      } catch {
        // fall through to BroadcastChannel
      }
    }

    // opener was severed by cross-origin navigation (COOP) — use BroadcastChannel
    // so the login page (same-origin, different window) receives the token
    try {
      const bc = new BroadcastChannel("google_auth");
      bc.postMessage(msg);
      bc.close();
      window.close();
    } catch {
      // BroadcastChannel not available (very old browser) — save and navigate this tab
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
