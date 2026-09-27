"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { FACTIONS } from "@/lib/game/data/world";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

type SubTab = "faccoes" | "guilda" | "fortaleza";

function getTierInfo(faction: typeof FACTIONS[0], points: number) {
  let tier = faction.tiers[0];
  for (const t of faction.tiers) {
    if (points >= t.minPoints) tier = t;
    else break;
  }
  const nextTier = faction.tiers[faction.tiers.indexOf(tier) + 1] ?? null;
  const pct = nextTier
    ? Math.min(100, ((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)
    : 100;
  return { tier, nextTier, pct };
}

export default function GuildaTab({ onFortress }: { onFortress: () => void }) {
  const [sub, setSub] = useState<SubTab>("faccoes");
  const { save, getReputation, addReputation } = useGameStore();

  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease }}
    >
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-violet/10 px-4 pb-3 pt-4">
        {(["faccoes","guilda","fortaleza"] as const).map((t) => (
          <motion.button
            key={t}
            onClick={() => setSub(t)}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 rounded-lg py-2 text-[9px] font-bold tracking-wider transition-colors duration-150"
            style={{
              background: sub === t ? "rgba(200,155,60,0.1)" : "transparent",
              color:      sub === t ? "rgb(200,155,60)" : "rgba(122,111,160,0.5)",
              border:     `1px solid ${sub === t ? "rgba(200,155,60,0.3)" : "transparent"}`,
            }}
          >
            {t === "faccoes" ? "FACÇÕES" : t === "guilda" ? "GUILDA" : "FORTALEZA"}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <AnimatePresence mode="wait">
          {sub === "faccoes" && (
            <motion.div
              key="faccoes"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15, ease }}
              className="flex flex-col gap-4"
            >
              {FACTIONS.map((f) => {
                const points = getReputation(f.factionId);
                const { tier, nextTier, pct } = getTierInfo(f, points);
                return (
                  <div
                    key={f.factionId}
                    className="rounded-xl border border-violet/12 px-4 py-4"
                    style={{ background: "rgba(122,111,160,0.04)" }}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-2xl">{f.emoji}</span>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-cream/85">{f.name}</p>
                        <p className="text-[9px] text-violet/50">{f.description}</p>
                      </div>
                    </div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400">{tier.label}</span>
                      <span className="text-[9px] text-violet/50">{points.toLocaleString("pt-BR")} pts</span>
                    </div>
                    <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-violet/10">
                      <motion.div
                        className="h-full rounded-full bg-amber"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-violet/40">{tier.bonus}</span>
                      {nextTier && (
                        <span className="text-[8px] text-violet/30">
                          → {nextTier.label} ({(nextTier.minPoints - points).toLocaleString("pt-BR")} pts)
                        </span>
                      )}
                    </div>
                    <motion.button
                      onClick={() => { addReputation(f.factionId, 50); scheduleSave(); }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="mt-2 w-full rounded-lg border border-violet/10 py-1.5 text-[8px] text-violet/40"
                    >
                      +50 pontos (teste)
                    </motion.button>
                  </div>
                );
              })}
            </motion.div>
          )}

          {sub === "guilda" && (
            <motion.div
              key="guilda"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15, ease }}
            >
              <GuildaSection guild={save.guildAdvanced} />
            </motion.div>
          )}

          {sub === "fortaleza" && (
            <motion.div
              key="fortaleza"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15, ease }}
            >
              <FortalezaSection fortress={save.fortress} onManage={onFortress} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Guilda ─────────────────────────────────────────────────────────────────────

type GuildSave = ReturnType<typeof useGameStore.getState>["save"]["guildAdvanced"];

function GuildaSection({ guild }: { guild: GuildSave }) {
  const SPECS = ["Nenhuma","Combate","Alquimia","Exploração","Comércio"];
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-amber/20 px-5 py-5" style={{ background: "rgba(200,155,60,0.05)" }}>
        <p className="mb-1 text-[9px] uppercase tracking-[0.2em] text-violet/40">Sua Guilda</p>
        <h3 className="mb-3 text-xl font-black text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
          NOVA ORDEM
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <GuildStat label="Tesouro" value={`${guild.treasury.toLocaleString("pt-BR")} ouro`} />
          <GuildStat label="Missões" value={String(guild.completedMissions.length)} />
          <GuildStat label="Pesquisas" value={String(guild.completedResearch.length)} />
          <GuildStat label="Especialização" value={SPECS[guild.specialization] ?? "Nenhuma"} />
        </div>
      </div>
      {guild.buildings.length === 0 ? (
        <p className="text-center text-[10px] text-violet/30">Nenhuma construção de guilda ainda.</p>
      ) : (
        <div className="rounded-xl border border-violet/12 px-4 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
          {guild.buildings.map((b, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-violet/8">
              <span className="text-[10px] text-cream/70">{b.typeId}</span>
              <span className="text-[10px] text-violet/50">Nv.{b.level}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GuildStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-violet/10 px-3 py-2.5" style={{ background: "rgba(122,111,160,0.04)" }}>
      <p className="text-[8px] text-violet/40">{label}</p>
      <p className="text-[11px] font-bold text-cream/80">{value}</p>
    </div>
  );
}

// ── Fortaleza ──────────────────────────────────────────────────────────────────

type FortressSave = ReturnType<typeof useGameStore.getState>["save"]["fortress"];

function FortalezaSection({ fortress, onManage }: { fortress: FortressSave; onManage: () => void }) {
  const RESOURCE_ICON: Record<string, string> = {
    Food: "◆", Wood: "◈", Stone: "●", Herbs: "◉", Morale: "★",
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-violet/20 px-5 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
        <p className="mb-1 text-[9px] uppercase tracking-[0.2em] text-violet/40">Fortaleza</p>
        <h3 className="mb-1 text-lg font-black text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
          {fortress.fortressName.toUpperCase()}
        </h3>
        <p className="text-[9px] text-violet/50">
          Pop.: {fortress.population} · Rep.: {fortress.reputation} · Construções: {fortress.buildings.length}
        </p>
      </div>
      <div className="rounded-xl border border-violet/12 px-4 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
        <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-violet/40">Recursos</p>
        <div className="grid grid-cols-2 gap-2">
          {fortress.resources.map((r) => (
            <div key={r.key} className="flex items-center gap-2 rounded-lg border border-violet/8 px-3 py-2.5" style={{ background: "rgba(122,111,160,0.04)" }}>
              <span className="text-base">{RESOURCE_ICON[r.key] ?? "◈"}</span>
              <div>
                <p className="text-[11px] font-bold text-cream/80">{r.value}</p>
                <p className="text-[8px] text-violet/40">{r.key}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <motion.button
        onClick={onManage}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
        style={{ borderColor: "rgba(200,155,60,0.4)", background: "rgba(200,155,60,0.08)", color: "rgb(200,155,60)" }}
      >
        GERENCIAR FORTALEZA
      </motion.button>
    </div>
  );
}
