"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { EQUIP_MAP } from "@/lib/game/data/items";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

const RARITY_COLOR: Record<string, string> = {
  Comum:    "rgb(180,180,210)",
  Incomum:  "rgb(100,210,130)",
  Raro:     "rgb(90,150,255)",
  Épico:    "rgb(180,110,255)",
  Lendário: "rgb(200,155,60)",
};

const FORGE_COSTS = [200, 400, 800, 1500, 2500, 4000, 6000, 9000, 13000, 18000];

const ENHANCE_BONUSES = [
  "ATQ +3%",  "ATQ +6%",  "DEF +5%",  "ATQ +10%", "HP +8%",
  "ATQ +15%", "VEL +5%", "ATQ +20%", "CRÍTICO +3%", "TODOS +10%",
];

const FORGE_DURATION_SECONDS = 90;

function formatCountdown(endTime: string): string {
  const ms = new Date(endTime).getTime() - Date.now();
  if (ms <= 0) return "Pronto!";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

type SortMode = "rarity" | "level" | "name";

export default function ForgeModal({ onClose }: { onClose: () => void }) {
  const { save, getForgeLevel, incrementDailyProgress, startForgePending, resolveForgePending, cancelForgePending } = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("rarity");
  const [toast, setToast] = useState("");
  const [, setTick] = useState(0);

  const pending = save.forgePending;

  // Tick every second to refresh countdown
  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [pending]);

  // Auto-resolve when timer expires
  useEffect(() => {
    if (!pending) return;
    if (new Date() >= new Date(pending.endTime)) {
      const resolved = resolveForgePending();
      if (resolved) {
        const lvl = getForgeLevel(resolved.equipId);
        setToast(`Forja completa! +${lvl} — ${ENHANCE_BONUSES[lvl - 1]}`);
        setTimeout(() => setToast(""), 3000);
        incrementDailyProgress("forge_today");
        scheduleSave();
      }
    }
  });

  const equipment = save.equipmentInventory
    .filter((id) => EQUIP_MAP[id])
    .map((id) => ({ id, def: EQUIP_MAP[id], forgeLevel: getForgeLevel(id) }));

  const RARITY_ORDER = ["Lendário", "Épico", "Raro", "Incomum", "Comum"];
  const sorted = [...equipment].sort((a, b) => {
    if (sort === "rarity") return RARITY_ORDER.indexOf(a.def.rarity) - RARITY_ORDER.indexOf(b.def.rarity);
    if (sort === "level")  return b.forgeLevel - a.forgeLevel;
    return a.def.name.localeCompare(b.def.name);
  });

  const sel = selected ? equipment.find((e) => e.id === selected) : null;
  const nextCost = sel ? FORGE_COSTS[sel.forgeLevel] ?? null : null;
  const canAfford = nextCost !== null && save.wallet.ouro >= nextCost;
  const maxed = sel ? sel.forgeLevel >= 10 : false;

  const handleStartForge = useCallback(() => {
    if (!selected) return;
    const ok = startForgePending(selected, FORGE_DURATION_SECONDS);
    if (!ok) {
      setToast("Ouro insuficiente");
      setTimeout(() => setToast(""), 2000);
    } else {
      scheduleSave();
    }
  }, [selected, startForgePending]);

  const handleCancel = useCallback(() => {
    cancelForgePending();
    scheduleSave();
    setToast("Forja cancelada — ouro devolvido");
    setTimeout(() => setToast(""), 2000);
  }, [cancelForgePending]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(10,10,22,0.99)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-amber/12 px-4 py-3">
        <motion.button
          onClick={selected && !pending ? () => setSelected(null) : onClose}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="text-[10px] font-bold tracking-widest text-violet/60"
        >
          ← {selected && !pending ? "Voltar" : "Fechar"}
        </motion.button>
        <span className="h-4 w-[1px] bg-violet/20" />
        <span className="text-[11px] font-bold tracking-widest text-cream/70">FORJA</span>
        <div className="ml-auto flex items-center gap-1.5 rounded-full border border-amber/20 px-2.5 py-1 text-[10px] font-bold text-amber-400">
          <span>◆</span><span>{save.wallet.ouro.toLocaleString("pt-BR")}</span>
        </div>
      </div>

      {/* Pending forge banner */}
      {pending && (
        <motion.div
          className="border-b border-amber/15 px-4 py-4"
          style={{ background: "rgba(200,155,60,0.06)" }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-wider text-amber-400">FORJANDO...</p>
            <p className="text-[13px] font-black text-amber-400 tabular-nums">{formatCountdown(pending.endTime)}</p>
          </div>
          {/* Animated progress bar */}
          {(() => {
            const total = new Date(pending.endTime).getTime() - new Date(pending.startTime).getTime();
            const elapsed = Date.now() - new Date(pending.startTime).getTime();
            const pct = Math.min(100, (elapsed / total) * 100);
            const equipDef = EQUIP_MAP[pending.equipId];
            return (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">⚒</span>
                  <span className="text-[11px] font-bold text-cream/80">{equipDef?.name ?? pending.equipId}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-void">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: "linear-gradient(90deg, rgba(200,155,60,0.6) 0%, rgba(200,155,60,1) 100%)",
                      boxShadow: "0 0 8px rgba(200,155,60,0.5)",
                    }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "linear" }}
                  />
                </div>
                <motion.button
                  onClick={handleCancel}
                  whileTap={{ scale: 0.96 }}
                  className="mt-3 w-full rounded-lg border border-red-500/20 py-1.5 text-[10px] font-bold text-red-400/50"
                >
                  Cancelar (ouro devolvido)
                </motion.button>
              </>
            );
          })()}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.div
            key="list"
            className="flex-1 overflow-y-auto px-4 pb-8 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Sort tabs */}
            <div className="mb-4 flex gap-2">
              {(["rarity", "level", "name"] as SortMode[]).map((s) => (
                <motion.button
                  key={s}
                  onClick={() => setSort(s)}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="rounded-lg border px-3 py-1.5 text-[11px] font-bold tracking-wider"
                  style={{
                    borderColor: sort === s ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.15)",
                    color: sort === s ? "rgb(200,155,60)" : "rgba(122,111,160,0.5)",
                    background: sort === s ? "rgba(200,155,60,0.08)" : "transparent",
                  }}
                >
                  {s === "rarity" ? "RARIDADE" : s === "level" ? "FORJA" : "NOME"}
                </motion.button>
              ))}
            </div>

            {sorted.length === 0 && (
              <p className="mt-16 text-center text-[11px] text-violet/30">Nenhum equipamento no inventário</p>
            )}

            <div className="flex flex-col gap-2">
              {sorted.map(({ id, def, forgeLevel }) => {
                const color = RARITY_COLOR[def.rarity] ?? "rgb(180,180,210)";
                const isPending = pending?.equipId === id;
                return (
                  <motion.button
                    key={id}
                    onClick={() => !pending && setSelected(id)}
                    whileTap={!pending ? { scale: 0.97 } : undefined}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left"
                    style={{
                      borderColor: isPending ? "rgba(200,155,60,0.5)" : `${color}25`,
                      background: isPending
                        ? "rgba(200,155,60,0.08)"
                        : `linear-gradient(135deg, ${color}08 0%, rgba(10,10,22,0.9) 100%)`,
                      opacity: pending && !isPending ? 0.45 : 1,
                    }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                    >
                      {isPending ? "⏳" : "⚔"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-bold text-cream/85">{def.name}</p>
                        {forgeLevel > 0 && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(200,155,60,0.15)", color: "rgb(200,155,60)" }}>
                            +{forgeLevel}
                          </span>
                        )}
                        {isPending && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(200,155,60,0.2)", color: "rgb(200,155,60)" }}>
                            {formatCountdown(pending.endTime)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color }}>{def.rarity} · {def.slot === "weapon" ? "Arma" : def.slot === "armor" ? "Armadura" : "Acessório"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-violet/50">{forgeLevel}/10</p>
                      <div className="mt-1 flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-1 w-1 rounded-full"
                            style={{ background: i < forgeLevel ? "rgb(200,155,60)" : "rgba(122,111,160,0.2)" }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : sel ? (
          <motion.div
            key="detail"
            className="flex-1 overflow-y-auto px-4 pb-8 pt-4"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2, ease }}
          >
            {/* Item card */}
            {(() => {
              const color = RARITY_COLOR[sel.def.rarity] ?? "rgb(180,180,210)";
              return (
                <div
                  className="mb-5 rounded-xl border px-5 py-5"
                  style={{
                    borderColor: `${color}35`,
                    background: `linear-gradient(135deg, ${color}10 0%, rgba(10,10,22,0.95) 70%)`,
                  }}
                >
                  <div className="mb-4 flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                    >
                      ⚔
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-black text-cream/90">{sel.def.name}</p>
                        {sel.forgeLevel > 0 && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(200,155,60,0.2)", color: "rgb(200,155,60)" }}>
                            +{sel.forgeLevel}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color }}>{sel.def.rarity}</p>
                    </div>
                  </div>

                  {/* Forge bar */}
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-violet/60">NÍVEL FORJA</span>
                    <span className="text-[11px] font-bold text-amber-400">{sel.forgeLevel} / 10</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="h-2 flex-1 rounded-full"
                        style={{
                          background: i < sel.forgeLevel ? "rgb(200,155,60)" : "rgba(122,111,160,0.15)",
                          boxShadow: i < sel.forgeLevel ? "0 0 6px rgba(200,155,60,0.4)" : "none",
                        }}
                      />
                    ))}
                  </div>

                  {/* Base stats */}
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-violet/60">Stats Base</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(sel.def.statBonus).map(([stat, val]) => (
                        <span
                          key={stat}
                          className="rounded-lg border px-3 py-1.5 text-[10px] font-bold"
                          style={{ borderColor: `${color}30`, color, background: `${color}10` }}
                        >
                          {stat} +{val}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Enhancement bonuses track */}
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Bônus por Nível</p>
            <div className="mb-5 rounded-xl border border-violet/12 px-5 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
              {ENHANCE_BONUSES.map((bonus, i) => {
                const lvl = i + 1;
                const unlocked = sel.forgeLevel >= lvl;
                const isCurrent = sel.forgeLevel === lvl - 1;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2"
                    style={{ borderBottom: i < 9 ? "1px solid rgba(122,111,160,0.08)" : "none" }}
                  >
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: unlocked ? "rgba(200,155,60,0.2)" : isCurrent ? "rgba(122,111,160,0.12)" : "transparent",
                        border: `1px solid ${unlocked ? "rgba(200,155,60,0.4)" : isCurrent ? "rgba(200,155,60,0.25)" : "rgba(122,111,160,0.12)"}`,
                        color: unlocked ? "rgb(200,155,60)" : "rgba(122,111,160,0.35)",
                      }}
                    >
                      {lvl}
                    </div>
                    <span
                      className="flex-1 text-[10px]"
                      style={{ color: unlocked ? "rgba(255,255,255,0.75)" : isCurrent ? "rgba(255,255,255,0.5)" : "rgba(122,111,160,0.3)" }}
                    >
                      {bonus}
                    </span>
                    {isCurrent && <span className="text-[10px] font-bold text-amber-400/60">PRÓXIMO</span>}
                    {unlocked && <span className="text-[10px] font-bold text-green-400/60">ATIVO</span>}
                  </div>
                );
              })}
            </div>

            {/* Forge action */}
            {pending ? (
              <div className="rounded-xl border border-amber/20 py-4 text-center">
                <p className="text-[11px] font-bold text-amber-400">FORJA EM ANDAMENTO</p>
                <p className="mt-1 text-[11px] text-violet/60">Outro item já está sendo forjado</p>
              </div>
            ) : maxed ? (
              <div className="rounded-xl border border-amber/20 py-4 text-center">
                <p className="text-[11px] font-bold tracking-wider text-amber-400">FORJA MÁXIMA</p>
                <p className="mt-1 text-[11px] text-violet/60">Todos os bônus estão ativos</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
                  <p className="text-[10px] text-violet/50">
                    O processo de forja leva <span className="font-bold text-amber-400">{FORGE_DURATION_SECONDS}s</span>. O resultado é revelado ao final.
                  </p>
                </div>
                <motion.button
                  onClick={handleStartForge}
                  disabled={!canAfford}
                  whileTap={canAfford ? { scale: 0.97 } : undefined}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full rounded-xl border py-4 text-[12px] font-bold tracking-[0.15em]"
                  style={{
                    borderColor: canAfford ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.15)",
                    background: canAfford ? "rgba(200,155,60,0.1)" : "rgba(122,111,160,0.05)",
                    color: canAfford ? "rgb(200,155,60)" : "rgba(122,111,160,0.35)",
                    cursor: canAfford ? "pointer" : "default",
                  }}
                >
                  INICIAR FORJA +{sel.forgeLevel + 1}
                  <span className="ml-2 text-[10px] font-normal opacity-70">
                    {nextCost?.toLocaleString("pt-BR")} ouro
                  </span>
                </motion.button>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-amber/25 bg-void px-5 py-2.5 text-[10px] font-bold text-amber-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease }}
          >
            ⚒ {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
