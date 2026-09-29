"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth";

type Mode = "login" | "register";

type AuthResponse = {
  accessToken: string;
  profile: { id: number; username: string; email: string; level: number };
};

const ease = [0.23, 1, 0.32, 1] as const;

function validatePassword(pwd: string): string | null {
  if (pwd.length < 14) return "Mínimo 14 caracteres";
  if (!/[A-Z]/.test(pwd)) return "Inclua uma letra maiúscula";
  if (!/[a-z]/.test(pwd)) return "Inclua uma letra minúscula";
  if (!/[0-9]/.test(pwd)) return "Inclua um número";
  if (!/[^a-zA-Z0-9]/.test(pwd)) return "Inclua um símbolo (!@#...)";
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [slowServer, setSlowServer] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPending) {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlowServer(false);
    }
  }, [isPending]);

  useEffect(() => {
    function handleAuth(payload: AuthResponse) {
      saveSession(payload.accessToken, { ...payload.profile, id: String(payload.profile.id) });
      router.replace("/game");
    }

    // postMessage path: opener is still reachable
    function onMessage(event: MessageEvent) {
      if (event.data?.type !== "GOOGLE_AUTH") return;
      handleAuth(event.data.payload as AuthResponse);
    }
    window.addEventListener("message", onMessage);

    // BroadcastChannel path: opener was severed by cross-origin navigation
    const bc = new BroadcastChannel("google_auth");
    bc.onmessage = (event: MessageEvent) => {
      if (event.data?.type !== "GOOGLE_AUTH") return;
      handleAuth(event.data.payload as AuthResponse);
    };

    return () => {
      window.removeEventListener("message", onMessage);
      bc.close();
    };
  }, [router]);

  function switchMode(next: Mode) {
    setFeedback(null);
    setPasswordError(null);
    setMode(next);
  }

  function handlePasswordChange(v: string) {
    setPassword(v);
    if (mode === "register" && v.length > 0) {
      setPasswordError(validatePassword(v));
    } else {
      setPasswordError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (mode === "register") {
      const err = validatePassword(password);
      if (err) { setPasswordError(err); return; }
    }

    slowTimer.current = setTimeout(() => setSlowServer(true), 4000);

    startTransition(async () => {
      try {
        const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
        const body = mode === "register"
          ? { email, username, password }
          : { email, password };
        const res = await api.post<AuthResponse>(endpoint, body);
        saveSession(res.accessToken, { ...res.profile, id: String(res.profile.id) });
        router.replace("/game");
      } catch (err) {
        const e = err as Error & { status?: number };
        if (mode === "register" && e.status === 409) {
          setMode("login");
          setFeedback({ msg: "Este e-mail já tem conta. Entre com sua senha.", ok: false });
        } else {
          setFeedback({ msg: e.message, ok: false });
        }
      }
    });
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-void overflow-hidden">
      {/* Deco lines */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-amber/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-amber/10" />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(200,155,60,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <motion.div
        className="mb-8 flex flex-col items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <Image
          src="/logo/logo-transcend.PNG"
          alt="Transcend Infinity"
          width={200}
          height={200}
          priority
          style={{ filter: "drop-shadow(0 0 40px rgba(200,155,60,0.45))" }}
        />
      </motion.div>

      {/* Card */}
      <motion.div
        className="relative w-[90%] max-w-[420px] overflow-hidden rounded-lg border border-amber/18 bg-card/95"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
        style={{ boxShadow: "0 0 60px rgba(6,7,15,0.9), 0 0 0 1px rgba(200,155,60,0.08)" }}
      >
        {/* Top glow */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-amber/55" />

        {/* Mode tabs */}
        <div className="flex border-b border-amber/12">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="flex-1 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-150"
              style={{
                color: mode === m ? "rgb(232,217,160)" : "rgba(122,111,160,0.6)",
                borderBottom: mode === m ? "2px solid rgb(200,155,60)" : "2px solid transparent",
              }}
            >
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-7 pt-5">
          <AnimatePresence mode="popLayout">
            {mode === "register" && (
              <motion.div
                key="username"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease }}
                className="overflow-hidden"
              >
                <Field
                  label="INVOCADOR"
                  type="text"
                  value={username}
                  onChange={setUsername}
                  placeholder="Seu nome no mundo"
                  autoComplete="username"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Field
            label="E-MAIL"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="seu@email.com"
            autoComplete="email"
          />

          <Field
            label="SENHA"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder={mode === "register" ? "Mínimo 14 caracteres" : "••••••••"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            hint={mode === "register" && !passwordError ? "Mín. 14 chars — maiúscula, minúscula, número e símbolo" : undefined}
            error={mode === "register" ? passwordError ?? undefined : undefined}
          />

          {mode === "login" && (
            <div className="mt-1.5 flex justify-end">
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-[10px] tracking-wide text-violet/45 transition-colors hover:text-violet/70"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.p
                key="feedback"
                className="mt-3 text-center text-[12px] tracking-wide"
                style={{ color: feedback.ok ? "rgb(100,200,130)" : "rgb(220,90,90)" }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease }}
              >
                {feedback.msg}
              </motion.p>
            )}
          </AnimatePresence>

          <AuthButton loading={isPending}>
            {mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
          </AuthButton>

          <AnimatePresence>
            {slowServer && (
              <motion.p
                key="slow"
                className="mt-3 text-center text-[10px] tracking-wide text-violet/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                Servidor acordando... pode levar até 30s
              </motion.p>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-violet/20" />
            <span className="text-[10px] tracking-[0.2em] text-violet/60">OU</span>
            <div className="h-px flex-1 bg-violet/20" />
          </div>

          {/* Google */}
          <motion.button
            type="button"
            onClick={() => {
              const base = process.env.NEXT_PUBLIC_API_URL || "https://api.transcendinfinity.com.br/api/v1";
              const oauthUrl = `${base}/auth/google/init?return_origin=${encodeURIComponent(window.location.origin)}`;
              window.open(
                `/auth/warmup?next=${encodeURIComponent(oauthUrl)}`,
                "google_auth",
                "width=500,height=620,left=200,top=100",
              );
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.08, ease }}
            className="mb-2 w-full rounded border border-violet/20 py-2.5 text-[11px] tracking-wider text-violet/60 transition-colors duration-150 hover:border-violet/40 hover:text-cream/70"
          >
            ENTRAR COM GOOGLE
          </motion.button>

          {/* Offline */}
          <motion.button
            type="button"
            onClick={() => {
              localStorage.setItem("ti_offline", "1");
              document.cookie = "ti_offline=1; path=/; max-age=3600; SameSite=Lax";
              router.push("/game");
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.08, ease }}
            className="w-full rounded border border-violet/15 py-2.5 text-[11px] tracking-wider text-violet/60 transition-colors duration-150 hover:border-amber/25 hover:text-amber/80"
          >
            CONTINUAR OFFLINE
          </motion.button>
        </form>
      </motion.div>

      {/* Version */}
      <motion.p
        className="mt-6 text-[10px] tracking-widest text-violet/35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        v0.1.0 — EARLY ACCESS
      </motion.p>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

function Field({
  label, type, value, onChange, placeholder, autoComplete, hint, error,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="mt-4 flex flex-col gap-1.5">
      <label className="text-[10px] font-bold tracking-[0.2em] text-violet">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        minLength={type === "password" && (hint || error) ? 14 : undefined}
        className="h-12 rounded border border-violet/30 bg-void px-3.5 text-[14px] text-cream placeholder:text-cream/25 transition-colors duration-200 focus:border-amber/70 focus:bg-void/100"
        style={{ transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
      />
      {error && <p className="text-[10px] text-red-400/80">{error}</p>}
      {hint && !error && <p className="text-[10px] text-violet/45">{hint}</p>}
    </div>
  );
}

function AuthButton({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
      className="mt-6 h-13 w-full rounded border border-amber/55 bg-amber/15 text-[12px] font-bold tracking-[0.25em] text-cream transition-colors duration-150 hover:border-amber/90 hover:bg-amber/28 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber/40 border-t-amber" />
      ) : (
        children
      )}
    </motion.button>
  );
}
