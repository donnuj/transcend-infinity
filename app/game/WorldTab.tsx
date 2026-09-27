"use client";

import { motion } from "framer-motion";
import type { Profile } from "./page";

const ease = [0.23, 1, 0.32, 1] as const;

const EXP_PER_LEVEL = 500;

export default function WorldTab({
  profile,
  onInvocar,
}: {
  profile: Profile | null;
  onInvocar: () => void;
}) {
  const level = profile?.level ?? 1;
  const exp = profile?.experience ?? 0;
  const expPct = Math.min((exp / EXP_PER_LEVEL) * 100, 100);
  const name = profile?.characterName ?? "Invocador";

  return (
    <motion.div
      className="flex h-full flex-col overflow-y-auto px-4 pb-6 pt-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease }}
    >
      {/* Hero banner */}
      <div
        className="mb-5 rounded-xl border border-amber/18 px-5 py-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(10,10,22,0.95) 60%)",
          boxShadow: "0 0 40px rgba(200,155,60,0.06) inset",
        }}
      >
        <p className="mb-1 text-[10px] tracking-[0.25em] text-violet/60 uppercase">
          Bem-vindo de volta
        </p>
        <h2
          className="mb-4 text-xl font-black tracking-[0.15em] text-cream"
          style={{
            fontFamily: "var(--font-cinzel)",
            textShadow: "0 0 24px rgba(200,155,60,0.35)",
          }}
        >
          {name.toUpperCase()}
        </h2>

        {/* Level + EXP */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold tracking-wider text-violet/70">
            NÍVEL {level}
          </span>
          <span className="text-[10px] text-violet/50">
            {exp} / {EXP_PER_LEVEL} EXP
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet/15">
          <motion.div
            className="h-full rounded-full bg-amber"
            initial={{ width: 0 }}
            animate={{ width: `${expPct}%` }}
            transition={{ duration: 0.7, ease, delay: 0.15 }}
            style={{ boxShadow: "0 0 8px rgba(200,155,60,0.5)" }}
          />
        </div>
      </div>

      {/* Quick actions */}
      <p className="mb-3 text-[9px] font-bold tracking-[0.25em] text-violet/45 uppercase">
        Ações Rápidas
      </p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <ActionCard
          icon="✦"
          title="Invocar"
          sub="Banner atual ativo"
          accent="rgba(200,155,60,0.8)"
          onClick={onInvocar}
        />
        <ActionCard
          icon="⚔"
          title="Arena"
          sub="Em breve"
          accent="rgba(100,160,255,0.7)"
          disabled
        />
        <ActionCard
          icon="◈"
          title="Missões"
          sub="3 disponíveis"
          accent="rgba(100,220,150,0.7)"
          disabled
        />
        <ActionCard
          icon="◆"
          title="Mercado"
          sub="Em breve"
          accent="rgba(255,140,80,0.7)"
          disabled
        />
      </div>

      {/* Event banner */}
      <div
        className="rounded-xl border border-violet/15 px-4 py-4"
        style={{ background: "rgba(122,111,160,0.06)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold tracking-[0.2em] text-violet/50 uppercase mb-0.5">
              Evento
            </p>
            <p className="text-[13px] font-bold text-cream/70">
              Primeiros Passos
            </p>
            <p className="text-[10px] text-violet/50 mt-0.5">
              Complete missões e ganhe recompensas
            </p>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border border-violet/20 text-xl"
            style={{ color: "rgba(122,111,160,0.6)" }}
          >
            ◈
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionCard({
  icon,
  title,
  sub,
  accent,
  onClick,
  disabled,
}: {
  icon: string;
  title: string;
  sub: string;
  accent: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-start rounded-xl border px-4 py-3.5 text-left"
      style={{
        borderColor: disabled ? "rgba(122,111,160,0.12)" : `${accent}30`,
        background: disabled
          ? "rgba(10,10,22,0.6)"
          : `linear-gradient(135deg, ${accent}10 0%, rgba(10,10,22,0.8) 100%)`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span className="mb-2 text-xl" style={{ color: disabled ? "rgba(122,111,160,0.4)" : accent }}>
        {icon}
      </span>
      <span className="text-[12px] font-bold tracking-wide text-cream/80">{title}</span>
      <span className="text-[10px] text-violet/50">{sub}</span>
    </motion.button>
  );
}
