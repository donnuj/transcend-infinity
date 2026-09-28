"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

const ease = [0.23, 1, 0.32, 1] as const;

function validatePassword(pwd: string): string | null {
  if (pwd.length < 14) return "Mínimo 14 caracteres";
  if (!/[A-Z]/.test(pwd)) return "Inclua uma letra maiúscula";
  if (!/[a-z]/.test(pwd)) return "Inclua uma letra minúscula";
  if (!/[0-9]/.test(pwd)) return "Inclua um número";
  if (!/[^a-zA-Z0-9]/.test(pwd)) return "Inclua um símbolo (!@#...)";
  return null;
}

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-[13px] font-bold text-red-400/80">Link inválido</p>
        <p className="text-[11px] text-violet/50">Solicite um novo link de redefinição.</p>
        <motion.button
          onClick={() => router.push("/forgot-password")}
          whileTap={{ scale: 0.97 }}
          className="mt-2 text-[10px] tracking-wider text-amber/70 hover:text-amber"
        >
          Solicitar novo link →
        </motion.button>
      </div>
    );
  }

  function handlePasswordChange(v: string) {
    setPassword(v);
    if (v.length > 0) setPasswordError(validatePassword(v));
    else setPasswordError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validatePassword(password);
    if (err) { setPasswordError(err); return; }
    setError(null);
    startTransition(async () => {
      try {
        await api.post("/auth/reset-password", { token, password });
        setDone(true);
        setTimeout(() => router.replace("/login"), 3000);
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e.message ?? "Erro ao redefinir senha. O link pode ter expirado.");
      }
    });
  }

  return (
    <AnimatePresence mode="wait">
      {!done ? (
        <motion.form
          key="form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-[0.2em] text-violet">NOVA SENHA</label>
            <input
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Mínimo 14 caracteres"
              required
              autoComplete="new-password"
              className="h-12 rounded border border-violet/30 bg-void px-3.5 text-[14px] text-cream placeholder:text-cream/25 transition-colors duration-200 focus:border-amber/70"
            />
            {passwordError && <p className="text-[10px] text-red-400/80">{passwordError}</p>}
            {!passwordError && password.length === 0 && (
              <p className="text-[10px] text-violet/45">Mín. 14 chars — maiúscula, minúscula, número e símbolo</p>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                key="err"
                className="mt-3 text-center text-[11px] text-red-400/80"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={isPending}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.08, ease }}
            className="mt-6 h-12 w-full rounded border border-amber/55 bg-amber/15 text-[12px] font-bold tracking-[0.25em] text-cream transition-colors duration-150 hover:border-amber/90 hover:bg-amber/28 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber/40 border-t-amber" />
            ) : "SALVAR NOVA SENHA"}
          </motion.button>
        </motion.form>
      ) : (
        <motion.div
          key="done"
          className="flex flex-col items-center gap-4 py-2 text-center"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-xl"
            style={{ background: "rgba(100,210,130,0.1)", border: "1px solid rgba(100,210,130,0.3)" }}
          >
            ✓
          </div>
          <p className="text-[13px] font-bold text-cream/80">Senha redefinida!</p>
          <p className="text-[11px] text-violet/50">Redirecionando para o login...</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-void overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-amber/30" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(200,155,60,0.06) 0%, transparent 70%)" }}
      />

      <motion.div
        className="mb-8 flex flex-col items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <h1
          className="text-4xl font-black tracking-[0.25em] text-cream"
          style={{ fontFamily: "var(--font-cinzel)", textShadow: "0 0 40px rgba(200,155,60,0.55)" }}
        >
          TRANSCEND
        </h1>
        <div className="my-3 h-px w-16 bg-amber/50" />
        <p className="text-[11px] tracking-[0.3em] text-violet uppercase">Infinity</p>
      </motion.div>

      <motion.div
        className="relative w-[90%] max-w-[420px] overflow-hidden rounded-lg border border-amber/18 bg-card/95"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
        style={{ boxShadow: "0 0 60px rgba(6,7,15,0.9), 0 0 0 1px rgba(200,155,60,0.08)" }}
      >
        <div className="absolute inset-x-0 top-0 h-0.5 bg-amber/55" />
        <div className="px-8 pb-7 pt-6">
          <p className="mb-1 text-[11px] font-bold tracking-[0.2em] text-cream/80">NOVA SENHA</p>
          <p className="mb-5 text-[11px] text-violet/50">Escolha uma senha forte para sua conta.</p>
          <Suspense fallback={
            <div className="flex justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
            </div>
          }>
            <ResetForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
