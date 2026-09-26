"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getUser, isAuthenticated } from "@/lib/auth";
import type { StoredUser } from "@/lib/auth";

const ease = [0.23, 1, 0.32, 1] as const;

export default function GamePage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setUser(getUser());
  }, [router]);

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center bg-void">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-void">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-amber/25 bg-void/98 px-6 py-3">
        <span
          className="text-sm font-bold tracking-widest text-cream"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          {user.username.toUpperCase()}
        </span>
        <div className="flex gap-2">
          <Chip label="Ouro" value="0" gold />
          <Chip label="Selos" value="0" />
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="text-center"
        >
          <h2
            className="mb-2 text-2xl font-black tracking-[0.2em] text-cream"
            style={{
              fontFamily: "var(--font-cinzel)",
              textShadow: "0 0 30px rgba(200,155,60,0.4)",
            }}
          >
            BEM-VINDO
          </h2>
          <p className="text-sm tracking-widest text-violet">
            O jogo está sendo construído...
          </p>
        </motion.div>
      </main>

      {/* Bottom nav placeholder */}
      <nav className="flex border-t border-amber/25 bg-void/98">
        {["Mundo", "Cartas", "Masmorra", "Guilda", "Perfil"].map((label) => (
          <button
            key={label}
            className="flex flex-1 flex-col items-center justify-center py-3 text-[10px] font-bold tracking-wider text-violet/75 transition-colors duration-150 hover:text-cream active:scale-95"
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Chip({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div
      className="rounded border px-3 py-1 text-xs font-bold"
      style={{
        borderColor: gold ? "rgba(220,170,60,0.5)" : "rgba(200,155,60,0.35)",
        color: gold ? "rgb(255,210,60)" : "rgb(232,217,160)",
        backgroundColor: "rgba(10,10,22,0.92)",
      }}
    >
      {label}: {value}
    </div>
  );
}
