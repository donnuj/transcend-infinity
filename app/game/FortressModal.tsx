"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { BUILDINGS, BUILDING_MAP } from "@/lib/game/data/world";
import { scheduleSave } from "@/lib/game/save";
import type { BuildingDef } from "@/lib/game/types";

const ease = [0.23, 1, 0.32, 1] as const;

const RESOURCE_COLORS: Record<string, string> = {
  Food:   "rgb(100,200,60)",
  Wood:   "rgb(180,130,60)",
  Stone:  "rgb(160,160,180)",
  Herbs:  "rgb(60,200,120)",
  Morale: "rgb(200,155,60)",
};

const RESOURCE_ICONS: Record<string, string> = {
  Food: "◆", Wood: "◈", Stone: "●", Herbs: "◉", Morale: "★",
};

const CATEGORY_ICONS: Record<string, string> = {
  military: "⚔", research: "◎", housing: "◈", production: "◆", special: "★",
};

type Screen = "overview" | "build";

export default function FortressModal({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>("overview");
  const [selected, setSelected] = useState<BuildingDef | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { save } = useGameStore();
  const fortress = save.fortress;

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  }

  function getBuiltLevel(buildingId: string): number {
    return fortress.buildings.find((b) => b.buildingId === buildingId)?.level ?? 0;
  }

  function getResource(key: string): number {
    return fortress.resources.find((r) => r.key === key)?.value ?? 0;
  }

  function build(def: BuildingDef) {
    const currentLevel = getBuiltLevel(def.buildingId);
    const nextLevel = currentLevel + 1;
    if (nextLevel > def.maxLevel) { showFeedback("Nível máximo atingido"); return; }
    const costEntry = def.resourceCosts.find((c) => c.level === nextLevel);
    if (!costEntry) return;

    // Check resources
    for (const [res, amount] of Object.entries(costEntry.costs)) {
      if (getResource(res) < (amount ?? 0)) {
        showFeedback(`${res} insuficiente`);
        return;
      }
    }
    if (save.wallet.ouro < costEntry.goldCost) { showFeedback("Ouro insuficiente"); return; }

    // Apply cost
    useGameStore.setState((s) => {
      s.save.wallet.ouro -= costEntry.goldCost;
      for (const [res, amount] of Object.entries(costEntry.costs)) {
        const entry = s.save.fortress.resources.find((r) => r.key === res);
        if (entry) entry.value -= amount ?? 0;
      }
      const existing = s.save.fortress.buildings.find((b) => b.buildingId === def.buildingId);
      if (existing) existing.level = nextLevel;
      else s.save.fortress.buildings.push({ buildingId: def.buildingId, level: nextLevel });
    });
    scheduleSave();
    showFeedback(`${def.name} nível ${nextLevel} construído!`);
  }

  const totalBuilt = fortress.buildings.length;
  const totalBuildings = BUILDINGS.length;

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
      <div className="flex items-center justify-between border-b border-amber/12 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={screen === "overview" ? onClose : () => { setScreen("overview"); setSelected(null); }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {screen === "overview" ? "Fechar" : "Voltar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">FORTALEZA</span>
        </div>
        <span className="text-[10px] font-bold text-amber-400">
          {fortress.fortressName}
        </span>
      </div>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className="absolute left-1/2 top-16 -translate-x-1/2 z-10 rounded-full border border-amber/30 bg-amber/10 px-4 py-2 text-[10px] font-bold text-amber-400"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {screen === "overview" && (
          <motion.div
            key="overview"
            className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Fortress stats */}
            <div className="mb-4 rounded-xl border border-amber/18 px-4 py-4" style={{ background: "rgba(200,155,60,0.05)" }}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-black tracking-wider text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
                    {fortress.fortressName.toUpperCase()}
                  </p>
                  <p className="text-[9px] text-violet/40">Pop.: {fortress.population} · Rep.: {fortress.reputation}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-violet/40">Construções</p>
                  <p className="text-[14px] font-black text-amber-400">{totalBuilt}/{totalBuildings}</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {fortress.resources.map((res) => (
                  <div
                    key={res.key}
                    className="flex flex-col items-center rounded-lg border py-1.5"
                    style={{
                      borderColor: `${RESOURCE_COLORS[res.key] ?? "rgba(122,111,160,0.2)"}30`,
                      background: `${RESOURCE_COLORS[res.key] ?? "rgba(122,111,160,0.04)"}08`,
                    }}
                  >
                    <span className="text-[10px]" style={{ color: RESOURCE_COLORS[res.key] ?? "rgba(200,200,200,0.6)" }}>
                      {RESOURCE_ICONS[res.key] ?? "◈"}
                    </span>
                    <span className="text-[9px] font-bold text-cream/70">{res.value}</span>
                    <span className="text-[6px] text-violet/35">{res.key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buildings */}
            <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-violet/40">Construções</p>
            <div className="flex flex-col gap-2 mb-4">
              {BUILDINGS.map((bld) => {
                const level = getBuiltLevel(bld.buildingId);
                const maxed = level >= bld.maxLevel;
                return (
                  <div
                    key={bld.buildingId}
                    className="flex items-center justify-between rounded-xl border px-4 py-3"
                    style={{
                      borderColor: level > 0 ? "rgba(200,155,60,0.2)" : "rgba(122,111,160,0.1)",
                      background: level > 0 ? "rgba(200,155,60,0.04)" : "rgba(122,111,160,0.03)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{CATEGORY_ICONS[bld.category] ?? "◈"}</span>
                      <div>
                        <p className="text-[11px] font-bold text-cream/80">{bld.name}</p>
                        <p className="text-[8px] text-violet/40">{bld.description.slice(0, 40)}…</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black" style={{ color: maxed ? "rgb(100,220,140)" : level > 0 ? "rgb(200,155,60)" : "rgba(122,111,160,0.4)" }}>
                        {maxed ? "MAX" : `Nv.${level}`}
                      </span>
                      {!maxed && (
                        <motion.button
                          onClick={() => { setSelected(bld); setScreen("build"); }}
                          whileTap={{ scale: 0.94 }}
                          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                          className="rounded-lg border border-amber/30 bg-amber/8 px-2 py-0.5 text-[8px] font-bold text-amber-400"
                        >
                          {level === 0 ? "Construir" : "Melhorar"}
                        </motion.button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ouro display */}
            <p className="text-center text-[9px] text-violet/35">
              Ouro disponível: <span className="font-bold text-amber-400">{save.wallet.ouro.toLocaleString("pt-BR")}</span>
            </p>
          </motion.div>
        )}

        {screen === "build" && selected && (
          <motion.div
            key="build"
            className="flex flex-1 flex-col overflow-y-auto px-5 py-5"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease }}
          >
            {(() => {
              const currentLevel = getBuiltLevel(selected.buildingId);
              const nextLevel = currentLevel + 1;
              const costEntry = selected.resourceCosts.find((c) => c.level === nextLevel);
              const maxed = currentLevel >= selected.maxLevel;

              return (
                <>
                  <div className="mb-5 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber/20 text-2xl"
                      style={{ background: "rgba(200,155,60,0.08)" }}
                    >
                      {CATEGORY_ICONS[selected.category] ?? "◈"}
                    </div>
                    <div>
                      <p className="text-xl font-black tracking-wide text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
                        {selected.name.toUpperCase()}
                      </p>
                      <p className="text-[10px] text-violet/50">{selected.description}</p>
                    </div>
                  </div>

                  {/* Level progress */}
                  <div className="mb-4 flex items-center gap-2">
                    {Array.from({ length: selected.maxLevel }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full"
                        style={{
                          height: 6,
                          background: i < currentLevel ? "rgb(200,155,60)" : "rgba(122,111,160,0.15)",
                          boxShadow: i < currentLevel ? "0 0 6px rgba(200,155,60,0.4)" : "none",
                        }}
                      />
                    ))}
                  </div>
                  <p className="mb-4 text-center text-[9px] text-violet/40">Nível {currentLevel} / {selected.maxLevel}</p>

                  {maxed ? (
                    <div className="rounded-xl border border-green-400/20 px-4 py-4 text-center" style={{ background: "rgba(100,220,140,0.05)" }}>
                      <p className="text-[12px] font-bold text-green-400">Nível Máximo Atingido</p>
                    </div>
                  ) : costEntry ? (
                    <>
                      <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-violet/40">Custo para Nível {nextLevel}</p>
                      <div className="mb-4 rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
                        <div className="flex flex-col gap-2">
                          {Object.entries(costEntry.costs).map(([res, amount]) => {
                            const have = getResource(res);
                            const enough = have >= (amount ?? 0);
                            return (
                              <div key={res} className="flex items-center justify-between">
                                <span className="text-[10px] font-bold" style={{ color: RESOURCE_COLORS[res] ?? "rgba(200,200,200,0.6)" }}>
                                  {RESOURCE_ICONS[res]} {res}
                                </span>
                                <span className="text-[10px] font-bold" style={{ color: enough ? "rgba(255,255,255,0.7)" : "rgb(255,100,100)" }}>
                                  {have} / {amount}
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-between border-t border-violet/10 pt-2">
                            <span className="text-[10px] font-bold text-amber-400">◆ Ouro</span>
                            <span className="text-[10px] font-bold" style={{ color: save.wallet.ouro >= costEntry.goldCost ? "rgba(255,255,255,0.7)" : "rgb(255,100,100)" }}>
                              {save.wallet.ouro.toLocaleString("pt-BR")} / {costEntry.goldCost.toLocaleString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selected.production && selected.production[nextLevel - 1] && (
                        <div className="mb-4 rounded-xl border border-violet/10 px-4 py-3" style={{ background: "rgba(122,111,160,0.03)" }}>
                          <p className="text-[9px] text-violet/40">
                            Produção: <span className="font-bold text-cream/60">+{selected.production[nextLevel - 1].perHour} {selected.production[nextLevel - 1].resource}/h</span>
                          </p>
                        </div>
                      )}

                      <motion.button
                        onClick={() => build(selected)}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                        className="mt-auto w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
                        style={{ borderColor: "rgba(200,155,60,0.4)", background: "rgba(200,155,60,0.1)", color: "rgb(200,155,60)" }}
                      >
                        {currentLevel === 0 ? "CONSTRUIR" : "MELHORAR"}
                      </motion.button>
                    </>
                  ) : null}
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
