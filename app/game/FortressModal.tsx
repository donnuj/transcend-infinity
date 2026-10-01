"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { BUILDINGS, BUILDING_MAP } from "@/lib/game/data/world";
import { HERO_MAP } from "@/lib/game/data/heroes";
import { scheduleSave } from "@/lib/game/save";
import type { BuildingDef } from "@/lib/game/types";

const ease = [0.23, 1, 0.32, 1] as const;

const RESOURCE_COLORS: Record<string, string> = {
  Food: "rgb(100,200,60)", Wood: "rgb(180,130,60)",
  Stone: "rgb(160,160,180)", Herbs: "rgb(60,200,120)", Morale: "rgb(200,155,60)",
};
const RESOURCE_ICONS: Record<string, string> = { Food: "◆", Wood: "◈", Stone: "●", Herbs: "◉", Morale: "★" };
const CATEGORY_ICONS: Record<string, string> = { military: "⚔", research: "◎", housing: "◈", production: "◆", special: "★" };

const BUILDING_BONUS_CLASSES: Record<string, string[]> = {
  bld_oficina:     ["Ferreiro"],
  bld_laboratorio: ["Alquimista", "Mago", "Bruxo"],
  bld_biblioteca:  ["Mago", "Bruxo", "Alquimista"],
  bld_caserna:     ["Espadachim", "Gladiador", "Arqueiro", "Guarda", "Caçador"],
  bld_hospital:    ["Curandeiro"],
};

const FUSION_FRAG_GAIN: Record<string, number> = {
  Comum: 10, Incomum: 25, Raro: 60, Épico: 150, Lendário: 400, Mítico: 1000, Divino: 2500,
};

function getConstructionHours(targetLevel: number): number {
  return ([0.5, 1, 2, 4, 8] as const)[Math.min(targetLevel - 1, 4)] ?? 8;
}

function formatTimeRemaining(endTime: string): string {
  const ms = new Date(endTime).getTime() - Date.now();
  if (ms <= 0) return "Pronto!";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

type Screen = "overview" | "build" | "assign" | "fusion" | "fusion-sacrifice" | "fusion-recipient";

export default function FortressModal({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>("overview");
  const [selected, setSelected] = useState<BuildingDef | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fusionSacrifice, setFusionSacrifice] = useState<string | null>(null);
  const [fusionRecipient, setFusionRecipient] = useState<string | null>(null);
  const { save } = useGameStore();
  const fortress = save.fortress;

  const ownedHeroIds = useMemo(() => {
    const seen = new Set<string>();
    save.collectedHeroIds.forEach((key) => {
      const heroId = key.split("|")[1];
      if (heroId && HERO_MAP[heroId]) seen.add(heroId);
    });
    return [...seen];
  }, [save.collectedHeroIds]);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  }

  function getBuiltLevel(buildingId: string): number {
    return fortress.buildings.find((b) => b.buildingId === buildingId)?.level ?? 0;
  }

  function getResource(key: string): number {
    return fortress.resources.find((r) => r.key === key)?.value ?? 0;
  }

  function getAssignedHero(buildingId: string): string | undefined {
    return fortress.buildings.find((b) => b.buildingId === buildingId)?.assignedHeroId;
  }

  const pending = fortress.pendingConstruction;
  const pendingDef = pending ? BUILDING_MAP[pending.buildingId] : null;
  // eslint-disable-next-line react-hooks/purity
  const isConstructionDone = pending ? new Date(pending.endTime).getTime() <= Date.now() : false;

  function startUpgrade(def: BuildingDef) {
    if (pending) { showFeedback("Já há uma construção em andamento"); return; }
    const currentLevel = getBuiltLevel(def.buildingId);
    const nextLevel = currentLevel + 1;
    if (nextLevel > def.maxLevel) { showFeedback("Nível máximo atingido"); return; }
    const costEntry = def.resourceCosts.find((c) => c.level === nextLevel);
    if (!costEntry) return;
    for (const [res, amount] of Object.entries(costEntry.costs)) {
      if (getResource(res) < (amount ?? 0)) { showFeedback(`${res} insuficiente`); return; }
    }
    if (save.wallet.ouro < costEntry.goldCost) { showFeedback("Ouro insuficiente"); return; }

    const hours = getConstructionHours(nextLevel);
    const endTime = new Date(Date.now() + hours * 3600000).toISOString();

    useGameStore.setState((s) => {
      s.save.wallet.ouro -= costEntry.goldCost;
      for (const [res, amount] of Object.entries(costEntry.costs)) {
        const entry = s.save.fortress.resources.find((r) => r.key === res);
        if (entry) entry.value -= amount ?? 0;
      }
      s.save.fortress.pendingConstruction = { buildingId: def.buildingId, targetLevel: nextLevel, endTime };
    });
    scheduleSave();
    showFeedback(`Construção iniciada! Termina em ${hours < 1 ? "30min" : `${hours}h`}`);
    setScreen("overview");
  }

  function collectConstruction() {
    if (!pending) return;
    if (!isConstructionDone) { showFeedback("Construção ainda em andamento"); return; }
    useGameStore.setState((s) => {
      const buildings = s.save.fortress.buildings;
      const existing = buildings.find((b) => b.buildingId === pending.buildingId);
      if (existing) existing.level = pending.targetLevel;
      else buildings.push({ buildingId: pending.buildingId, level: pending.targetLevel });
      s.save.fortress.pendingConstruction = null;
    });
    scheduleSave();
    showFeedback(`${pendingDef?.name ?? "Construção"} nível ${pending.targetLevel} concluída!`);
  }

  function assignHero(buildingId: string, heroId: string) {
    useGameStore.setState((s) => {
      s.save.fortress.buildings.forEach((b) => { if (b.assignedHeroId === heroId) b.assignedHeroId = undefined; });
      const existing = s.save.fortress.buildings.find((b) => b.buildingId === buildingId);
      if (existing) existing.assignedHeroId = heroId;
      else s.save.fortress.buildings.push({ buildingId, level: 0, assignedHeroId: heroId });
    });
    scheduleSave();
    setScreen("build");
  }

  function removeAssignedHero(buildingId: string) {
    useGameStore.setState((s) => {
      const existing = s.save.fortress.buildings.find((b) => b.buildingId === buildingId);
      if (existing) existing.assignedHeroId = undefined;
    });
    scheduleSave();
  }

  function doFusion() {
    if (!fusionSacrifice || !fusionRecipient || fusionSacrifice === fusionRecipient) return;
    const sacrificeHero = HERO_MAP[fusionSacrifice];
    if (!sacrificeHero) return;
    const fragGain = FUSION_FRAG_GAIN[sacrificeHero.rarity] ?? 10;

    useGameStore.setState((s) => {
      s.save.collectedHeroIds = s.save.collectedHeroIds.filter((k) => !k.endsWith(`|${fusionSacrifice}`));
      s.save.heroLevels = s.save.heroLevels.filter((h) => h.heroId !== fusionSacrifice);
      s.save.heroProgression = s.save.heroProgression.filter((h) => h.heroId !== fusionSacrifice);
      const existing = s.save.fragmentos.find((f) => f.heroId === fusionRecipient);
      if (existing) existing.count += fragGain;
      else s.save.fragmentos.push({ heroId: fusionRecipient!, count: fragGain });
    });
    scheduleSave();
    showFeedback(`+${fragGain} fragmentos para ${HERO_MAP[fusionRecipient]?.name ?? "herói"}!`);
    setFusionSacrifice(null);
    setFusionRecipient(null);
    setScreen("overview");
  }

  const totalBuilt = fortress.buildings.filter((b) => b.level > 0).length;

  function goBack() {
    if (screen === "overview") { onClose(); return; }
    if (screen === "assign") { setScreen("build"); return; }
    if (screen === "fusion-sacrifice" || screen === "fusion-recipient") { setScreen("fusion"); return; }
    setScreen("overview");
    setSelected(null);
  }

  const isFusionScreen = screen === "fusion" || screen === "fusion-sacrifice" || screen === "fusion-recipient";

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(10,10,22,0.99)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease }}
    >
      <div className="flex items-center justify-between border-b border-amber/12 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={goBack}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {screen === "overview" ? "Fechar" : "Voltar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">
            {isFusionScreen ? "FORJA DE FUSÃO" : "FORTALEZA"}
          </span>
        </div>
        <span className="text-[10px] font-bold text-amber-400">{fortress.fortressName}</span>
      </div>

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

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {screen === "overview" && (
          <motion.div key="overview" className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          >
            <div className="mb-4 rounded-xl border border-amber/18 px-4 py-4" style={{ background: "rgba(200,155,60,0.05)" }}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-black tracking-wider text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
                    {fortress.fortressName.toUpperCase()}
                  </p>
                  <p className="text-[11px] text-violet/60">Pop.: {fortress.population} · Rep.: {fortress.reputation}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-violet/60">Construções</p>
                  <p className="text-[14px] font-black text-amber-400">{totalBuilt}/{BUILDINGS.length}</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {fortress.resources.map((res) => (
                  <div key={res.key} className="flex flex-col items-center rounded-lg border py-1.5"
                    style={{
                      borderColor: `${RESOURCE_COLORS[res.key] ?? "rgba(122,111,160,0.2)"}30`,
                      background: `${RESOURCE_COLORS[res.key] ?? "rgba(122,111,160,0.04)"}08`,
                    }}
                  >
                    <span className="text-[10px]" style={{ color: RESOURCE_COLORS[res.key] ?? "rgba(200,200,200,0.6)" }}>
                      {RESOURCE_ICONS[res.key] ?? "◈"}
                    </span>
                    <span className="text-[11px] font-bold text-cream/70">{res.value}</span>
                    <span className="text-[6px] text-violet/35">{res.key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending construction banner */}
            {pending && pendingDef && (
              <div className="mb-4 flex items-center justify-between rounded-xl border px-4 py-3"
                style={{
                  borderColor: isConstructionDone ? "rgba(100,220,140,0.3)" : "rgba(200,155,60,0.25)",
                  background: isConstructionDone ? "rgba(100,220,140,0.06)" : "rgba(200,155,60,0.06)",
                }}
              >
                <div>
                  <p className="text-[11px] font-bold text-cream/80">Em construção: {pendingDef.name}</p>
                  <p className="text-[10px]" style={{ color: isConstructionDone ? "rgb(100,220,140)" : "rgba(200,155,60,0.8)" }}>
                    Nível {pending.targetLevel} — {isConstructionDone ? "Pronto!" : formatTimeRemaining(pending.endTime)}
                  </p>
                </div>
                {isConstructionDone && (
                  <motion.button
                    onClick={collectConstruction}
                    whileTap={{ scale: 0.94 }}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="rounded-lg border border-green-400/30 px-3 py-1.5 text-[10px] font-bold text-green-400"
                    style={{ background: "rgba(100,220,140,0.08)" }}
                  >
                    Concluir
                  </motion.button>
                )}
              </div>
            )}

            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Construções</p>
            <div className="mb-4 flex flex-col gap-2">
              {BUILDINGS.map((bld) => {
                const level = getBuiltLevel(bld.buildingId);
                const maxed = level >= bld.maxLevel;
                const assignedId = getAssignedHero(bld.buildingId);
                const assignedHero = assignedId ? HERO_MAP[assignedId] : null;
                const bonusCls = BUILDING_BONUS_CLASSES[bld.buildingId] ?? [];
                const hasBonus = !!assignedHero && bonusCls.includes(assignedHero.heroClass);
                return (
                  <div key={bld.buildingId}
                    className="flex items-center justify-between rounded-xl border px-4 py-3"
                    style={{
                      borderColor: level > 0 ? "rgba(200,155,60,0.2)" : "rgba(122,111,160,0.1)",
                      background: level > 0 ? "rgba(200,155,60,0.04)" : "rgba(122,111,160,0.03)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{CATEGORY_ICONS[bld.category] ?? "◈"}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-bold text-cream/80">{bld.name}</p>
                          {hasBonus && <span className="text-[8px] font-bold text-green-400">BÔNUS</span>}
                        </div>
                        {assignedHero
                          ? <p className="text-[10px] text-violet/55">{assignedHero.portrait} {assignedHero.name}</p>
                          : <p className="text-[10px] text-violet/30">Sem herói alocado</p>
                        }
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black"
                        style={{ color: maxed ? "rgb(100,220,140)" : level > 0 ? "rgb(200,155,60)" : "rgba(122,111,160,0.4)" }}
                      >
                        {maxed ? "MAX" : `Nv.${level}`}
                      </span>
                      {!maxed && (
                        <motion.button
                          onClick={() => { setSelected(bld); setScreen("build"); }}
                          whileTap={{ scale: 0.94 }}
                          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                          className="rounded-lg border border-amber/30 bg-amber/8 px-2 py-0.5 text-[10px] font-bold text-amber-400"
                        >
                          {level === 0 ? "Construir" : "Melhorar"}
                        </motion.button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <motion.button
              onClick={() => setScreen("fusion")}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
              style={{ borderColor: "rgba(180,80,220,0.35)", background: "rgba(180,80,220,0.07)", color: "rgb(200,150,255)" }}
            >
              FORJA DE FUSÃO
            </motion.button>
          </motion.div>
        )}

        {/* ── BUILD ────────────────────────────────────────────────── */}
        {screen === "build" && selected && (() => {
          const currentLevel = getBuiltLevel(selected.buildingId);
          const nextLevel = currentLevel + 1;
          const costEntry = selected.resourceCosts.find((c) => c.level === nextLevel);
          const maxed = currentLevel >= selected.maxLevel;
          const constructionHours = getConstructionHours(nextLevel);
          const assignedId = getAssignedHero(selected.buildingId);
          const assignedHero = assignedId ? HERO_MAP[assignedId] : null;
          const bonusCls = BUILDING_BONUS_CLASSES[selected.buildingId] ?? [];
          const hasBonus = !!assignedHero && bonusCls.includes(assignedHero.heroClass);
          const isPending = pending?.buildingId === selected.buildingId;

          return (
            <motion.div key="build" className="flex flex-1 flex-col overflow-y-auto px-5 py-5"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15, ease }}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber/20 text-2xl"
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

              <div className="mb-1 flex items-center gap-2">
                {Array.from({ length: selected.maxLevel }, (_, i) => (
                  <div key={i} className="flex-1 rounded-full"
                    style={{ height: 6, background: i < currentLevel ? "rgb(200,155,60)" : "rgba(122,111,160,0.15)", boxShadow: i < currentLevel ? "0 0 6px rgba(200,155,60,0.4)" : "none" }}
                  />
                ))}
              </div>
              <p className="mb-4 text-center text-[11px] text-violet/60">Nível {currentLevel} / {selected.maxLevel}</p>

              {/* Assigned hero */}
              <div className="mb-4 rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-violet/70">Herói Alocado</p>
                    {assignedHero ? (
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span>{assignedHero.portrait}</span>
                        <span className="text-[11px] text-cream/80">{assignedHero.name}</span>
                        {hasBonus && <span className="text-[8px] font-bold text-green-400">+BÔNUS</span>}
                      </div>
                    ) : (
                      <p className="mt-0.5 text-[10px] text-violet/35">Nenhum</p>
                    )}
                    {bonusCls.length > 0 && (
                      <p className="mt-1 text-[9px] text-violet/35">Bônus: {bonusCls.join(", ")}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <motion.button
                      onClick={() => setScreen("assign")}
                      whileTap={{ scale: 0.94 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="rounded-lg border border-violet/20 px-2 py-1 text-[10px] font-bold text-violet"
                      style={{ background: "rgba(122,111,160,0.08)" }}
                    >
                      {assignedHero ? "Trocar" : "Alocar"}
                    </motion.button>
                    {assignedHero && (
                      <button onClick={() => removeAssignedHero(selected.buildingId)} className="text-[9px] text-violet/30">
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {maxed ? (
                <div className="rounded-xl border border-green-400/20 px-4 py-4 text-center" style={{ background: "rgba(100,220,140,0.05)" }}>
                  <p className="text-[12px] font-bold text-green-400">Nível Máximo Atingido</p>
                </div>
              ) : isPending ? (
                <div className="rounded-xl border border-amber/20 px-4 py-4 text-center" style={{ background: "rgba(200,155,60,0.05)" }}>
                  <p className="text-[12px] font-bold text-amber-400">Construção em andamento</p>
                  <p className="mt-1 text-[11px] text-violet/50">{formatTimeRemaining(pending!.endTime)}</p>
                </div>
              ) : costEntry ? (
                <>
                  <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Custo para Nível {nextLevel}</p>
                  <div className="mb-3 rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
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

                  <div className="mb-4 flex items-center justify-between rounded-xl border border-violet/10 px-4 py-2.5"
                    style={{ background: "rgba(122,111,160,0.03)" }}
                  >
                    <span className="text-[10px] text-violet/60">Tempo de construção</span>
                    <span className="text-[10px] font-bold text-cream/70">
                      {constructionHours < 1 ? "30 min" : `${constructionHours}h`}
                    </span>
                  </div>

                  {pending && (
                    <p className="mb-3 text-center text-[10px] text-amber-400/60">
                      Aguarde a construção atual terminar antes de iniciar outra.
                    </p>
                  )}

                  <motion.button
                    onClick={() => startUpgrade(selected)}
                    disabled={!!pending}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="mt-auto w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
                    style={{
                      borderColor: pending ? "rgba(122,111,160,0.2)" : "rgba(200,155,60,0.4)",
                      background: pending ? "rgba(122,111,160,0.04)" : "rgba(200,155,60,0.1)",
                      color: pending ? "rgba(122,111,160,0.5)" : "rgb(200,155,60)",
                      cursor: pending ? "not-allowed" : "pointer",
                    }}
                  >
                    {currentLevel === 0 ? "CONSTRUIR" : "MELHORAR"}
                  </motion.button>
                </>
              ) : null}
            </motion.div>
          );
        })()}

        {/* ── ASSIGN HERO ──────────────────────────────────────────── */}
        {screen === "assign" && selected && (
          <motion.div key="assign" className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15, ease }}
          >
            <p className="mb-1 text-[12px] font-bold text-cream/80">{selected.name}</p>
            <p className="mb-4 text-[10px] text-violet/50 leading-relaxed">
              Bônus com: {(BUILDING_BONUS_CLASSES[selected.buildingId] ?? []).join(", ") || "nenhuma classe específica"}
            </p>
            {ownedHeroIds.length === 0 ? (
              <p className="mt-8 text-center text-[11px] text-violet/35">Nenhum herói disponível.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {ownedHeroIds.map((heroId) => {
                  const hero = HERO_MAP[heroId];
                  if (!hero) return null;
                  const bonusCls = BUILDING_BONUS_CLASSES[selected.buildingId] ?? [];
                  const hasBonus = bonusCls.includes(hero.heroClass);
                  const isCurrentlyAssigned = getAssignedHero(selected.buildingId) === heroId;
                  return (
                    <motion.button
                      key={heroId}
                      onClick={() => assignHero(selected.buildingId, heroId)}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left"
                      style={{
                        borderColor: hasBonus ? "rgba(100,220,140,0.3)" : isCurrentlyAssigned ? "rgba(200,155,60,0.3)" : "rgba(122,111,160,0.15)",
                        background: hasBonus ? "rgba(100,220,140,0.05)" : isCurrentlyAssigned ? "rgba(200,155,60,0.06)" : "rgba(122,111,160,0.04)",
                      }}
                    >
                      <span className="text-xl">{hero.portrait}</span>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-cream/80">{hero.name}</p>
                        <p className="text-[10px] text-violet/50">{hero.heroClass}</p>
                      </div>
                      {hasBonus && <span className="text-[9px] font-bold text-green-400">BÔNUS</span>}
                      {isCurrentlyAssigned && <span className="text-[9px] font-bold text-amber-400">ATUAL</span>}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── FUSION OVERVIEW ──────────────────────────────────────── */}
        {screen === "fusion" && (
          <motion.div key="fusion" className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          >
            <p className="mb-2 text-[12px] font-bold text-cream/80">Forja de Fusão</p>
            <p className="mb-5 text-[11px] leading-relaxed text-violet/55">
              Sacrifique um herói para transferir fragmentos ao receptor. O herói sacrificado é removido permanentemente da coleção.
            </p>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-violet/55">Sacrifício</p>
                <motion.button
                  onClick={() => setScreen("fusion-sacrifice")}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full rounded-xl border px-3 py-4 text-center"
                  style={{
                    borderColor: fusionSacrifice ? "rgba(255,100,100,0.35)" : "rgba(122,111,160,0.2)",
                    background: fusionSacrifice ? "rgba(255,100,100,0.05)" : "rgba(122,111,160,0.04)",
                  }}
                >
                  {fusionSacrifice && HERO_MAP[fusionSacrifice] ? (
                    <>
                      <div className="mb-1 text-2xl">{HERO_MAP[fusionSacrifice]!.portrait}</div>
                      <p className="text-[10px] font-bold text-cream/70">{HERO_MAP[fusionSacrifice]!.name}</p>
                      <p className="text-[9px] text-violet/50">{HERO_MAP[fusionSacrifice]!.rarity}</p>
                    </>
                  ) : (
                    <p className="text-[10px] text-violet/35">Escolher herói</p>
                  )}
                </motion.button>
              </div>

              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-violet/55">Receptor</p>
                <motion.button
                  onClick={() => setScreen("fusion-recipient")}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full rounded-xl border px-3 py-4 text-center"
                  style={{
                    borderColor: fusionRecipient ? "rgba(100,200,255,0.35)" : "rgba(122,111,160,0.2)",
                    background: fusionRecipient ? "rgba(100,200,255,0.05)" : "rgba(122,111,160,0.04)",
                  }}
                >
                  {fusionRecipient && HERO_MAP[fusionRecipient] ? (
                    <>
                      <div className="mb-1 text-2xl">{HERO_MAP[fusionRecipient]!.portrait}</div>
                      <p className="text-[10px] font-bold text-cream/70">{HERO_MAP[fusionRecipient]!.name}</p>
                      <p className="text-[9px] text-violet/50">{HERO_MAP[fusionRecipient]!.rarity}</p>
                    </>
                  ) : (
                    <p className="text-[10px] text-violet/35">Escolher herói</p>
                  )}
                </motion.button>
              </div>
            </div>

            {fusionSacrifice && HERO_MAP[fusionSacrifice] && (
              <div className="mb-4 rounded-xl border border-violet/15 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-violet/60">Fragmentos gerados</span>
                  <span className="text-[13px] font-black text-amber-400">
                    +{FUSION_FRAG_GAIN[HERO_MAP[fusionSacrifice]!.rarity] ?? 10}
                  </span>
                </div>
              </div>
            )}

            {fusionSacrifice === fusionRecipient && fusionSacrifice !== null && (
              <p className="mb-3 text-center text-[10px] text-red-400/70">Sacrifício e receptor não podem ser o mesmo herói.</p>
            )}

            <motion.button
              onClick={doFusion}
              disabled={!fusionSacrifice || !fusionRecipient || fusionSacrifice === fusionRecipient}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="mt-auto w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
              style={{
                borderColor: fusionSacrifice && fusionRecipient && fusionSacrifice !== fusionRecipient ? "rgba(180,80,220,0.45)" : "rgba(122,111,160,0.2)",
                background: fusionSacrifice && fusionRecipient && fusionSacrifice !== fusionRecipient ? "rgba(180,80,220,0.1)" : "rgba(122,111,160,0.04)",
                color: fusionSacrifice && fusionRecipient && fusionSacrifice !== fusionRecipient ? "rgb(200,150,255)" : "rgba(122,111,160,0.4)",
              }}
            >
              FUNDIR
            </motion.button>
          </motion.div>
        )}

        {/* ── FUSION HERO PICKER ───────────────────────────────────── */}
        {(screen === "fusion-sacrifice" || screen === "fusion-recipient") && (
          <motion.div key={screen} className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15, ease }}
          >
            <p className="mb-4 text-[11px] text-violet/60">
              {screen === "fusion-sacrifice" ? "Escolha o herói a sacrificar" : "Escolha o receptor dos fragmentos"}
            </p>
            {ownedHeroIds.length === 0 ? (
              <p className="mt-8 text-center text-[11px] text-violet/35">Nenhum herói disponível.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {ownedHeroIds.map((heroId) => {
                  const hero = HERO_MAP[heroId];
                  if (!hero) return null;
                  const isOtherSlot = screen === "fusion-sacrifice" ? heroId === fusionRecipient : heroId === fusionSacrifice;
                  return (
                    <motion.button
                      key={heroId}
                      onClick={() => {
                        if (isOtherSlot) return;
                        if (screen === "fusion-sacrifice") setFusionSacrifice(heroId);
                        else setFusionRecipient(heroId);
                        setScreen("fusion");
                      }}
                      disabled={isOtherSlot}
                      whileTap={!isOtherSlot ? { scale: 0.97 } : undefined}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left"
                      style={{
                        borderColor: isOtherSlot ? "rgba(122,111,160,0.08)" : "rgba(122,111,160,0.18)",
                        background: isOtherSlot ? "rgba(122,111,160,0.02)" : "rgba(122,111,160,0.05)",
                        opacity: isOtherSlot ? 0.4 : 1,
                      }}
                    >
                      <span className="text-xl">{hero.portrait}</span>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-cream/80">{hero.name}</p>
                        <p className="text-[10px] text-violet/50">{hero.heroClass} · {hero.rarity}</p>
                      </div>
                      {screen === "fusion-sacrifice" && !isOtherSlot && (
                        <span className="text-[9px] font-bold text-amber-400/70">
                          +{FUSION_FRAG_GAIN[hero.rarity] ?? 10} frags
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
