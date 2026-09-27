"use client";

import { motion } from "framer-motion";
import type { Profile } from "./page";

const ease = [0.23, 1, 0.32, 1] as const;

const EXP_PER_LEVEL = 500;

export default function PerfilTab({
  profile,
  onLogout,
}: {
  profile: Profile | null;
  onLogout: () => void;
}) {
  const level = profile?.level ?? 1;
  const exp = profile?.experience ?? 0;
  const expPct = Math.min((exp / EXP_PER_LEVEL) * 100, 100);
  const initial = (profile?.characterName ?? profile?.username ?? "?")[0].toUpperCase();
  const joined = profile?.registeredAt
    ? new Date(profile.registeredAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <motion.div
      className="flex h-full flex-col overflow-y-auto px-4 pb-6 pt-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease }}
    >
      {/* Avatar */}
      <div className="mb-6 flex flex-col items-center">
        <div
          className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber/40 text-3xl font-black text-cream"
          style={{
            background: "linear-gradient(135deg, rgba(200,155,60,0.2) 0%, rgba(10,10,22,0.95) 100%)",
            fontFamily: "var(--font-cinzel)",
            boxShadow: "0 0 30px rgba(200,155,60,0.15)",
          }}
        >
          {initial}
        </div>
        <h2
          className="text-xl font-black tracking-[0.15em] text-cream"
          style={{
            fontFamily: "var(--font-cinzel)",
            textShadow: "0 0 20px rgba(200,155,60,0.3)",
          }}
        >
          {(profile?.characterName ?? "Invocador").toUpperCase()}
        </h2>
        {joined && (
          <p className="mt-1 text-[10px] tracking-wider text-violet/45">
            Membro desde {joined}
          </p>
        )}
      </div>

      {/* Level card */}
      <div
        className="mb-4 rounded-xl border border-amber/18 px-5 py-4"
        style={{ background: "rgba(200,155,60,0.05)" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-cream/70">
            NÍVEL {level}
          </span>
          <span className="text-[10px] text-violet/50">
            {exp} / {EXP_PER_LEVEL} EXP
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-violet/12">
          <motion.div
            className="h-full rounded-full bg-amber"
            initial={{ width: 0 }}
            animate={{ width: `${expPct}%` }}
            transition={{ duration: 0.7, ease, delay: 0.15 }}
            style={{ boxShadow: "0 0 8px rgba(200,155,60,0.5)" }}
          />
        </div>
      </div>

      {/* Resources */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <ResourceCard icon="◆" label="Ouro" value={profile?.gold ?? 0} color="rgb(200,155,60)" />
        <ResourceCard icon="✦" label="Gemas" value={profile?.premiumCurrency ?? 0} color="rgb(170,130,255)" />
      </div>

      {/* Account info */}
      <div
        className="mb-6 rounded-xl border border-violet/12 px-4 py-4"
        style={{ background: "rgba(122,111,160,0.04)" }}
      >
        <p className="mb-3 text-[9px] font-bold tracking-[0.2em] text-violet/40 uppercase">
          Conta
        </p>
        <InfoRow label="Usuário" value={profile?.username ?? "—"} />
        <InfoRow label="E-mail" value={profile?.email ?? "—"} />
        <InfoRow label="ID" value={profile ? `#${profile.id}` : "—"} last />
      </div>

      {/* Logout */}
      <motion.button
        onClick={onLogout}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="w-full rounded-xl border border-red-500/20 py-3.5 text-[12px] font-bold tracking-[0.2em] text-red-400/60 transition-colors duration-150 hover:border-red-500/40 hover:text-red-400/80"
      >
        SAIR DA CONTA
      </motion.button>
    </motion.div>
  );
}

function ResourceCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div
      className="flex flex-col items-center rounded-xl border py-4"
      style={{ borderColor: `${color}28`, background: `${color}08` }}
    >
      <span className="mb-1 text-xl" style={{ color }}>{icon}</span>
      <span className="text-lg font-black text-cream">{value.toLocaleString("pt-BR")}</span>
      <span className="text-[9px] font-bold tracking-wider" style={{ color, opacity: 0.6 }}>
        {label.toUpperCase()}
      </span>
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid rgba(122,111,160,0.1)" }}
    >
      <span className="text-[10px] font-bold tracking-wider text-violet/45">{label.toUpperCase()}</span>
      <span className="text-[11px] text-cream/60">{value}</span>
    </div>
  );
}
