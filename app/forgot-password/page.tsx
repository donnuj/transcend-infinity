"use client";

export const runtime = 'edge';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

const ease = [0.23, 1, 0.32, 1] as const;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await api.post("/auth/forgot-password", { email });
        setSent(true);
      } catch {
        setError("Erro ao processar solicitação. Tente novamente.");
      }
    });
  }

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
          <p className="mb-1 text-[11px] font-bold tracking-[0.2em] text-cream/80">REDEFINIR SENHA</p>
          <p className="mb-5 text-[11px] text-violet/50">
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </p>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-violet">E-MAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    className="h-12 rounded border border-violet/30 bg-void px-3.5 text-[14px] text-cream placeholder:text-cream/25 transition-colors duration-200 focus:border-amber/70"
                  />
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
                  ) : "ENVIAR LINK"}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="sent"
                className="flex flex-col items-center gap-4 py-2 text-center"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-xl"
                  style={{ background: "rgba(200,155,60,0.12)", border: "1px solid rgba(200,155,60,0.3)" }}
                >
                  ✉
                </div>
                <p className="text-[13px] font-bold text-cream/80">E-mail enviado!</p>
                <p className="text-[11px] leading-relaxed text-violet/50">
                  Se esse endereço tiver uma conta, você receberá um link em breve. Verifique o spam.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => router.push("/login")}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.08, ease }}
            className="mt-5 w-full py-2 text-[10px] tracking-wider text-violet/40 transition-colors hover:text-violet/70"
          >
            ← Voltar ao login
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
