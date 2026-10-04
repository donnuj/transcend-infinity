"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { BattleScene } from "@/src/components/game/battle/BattleScene";
import { HERO_MAP } from "@/lib/game/data/heroes";
import { scheduleSave } from "@/lib/game/save";
import {
  TOWER_TIERS,
  getTierForFloor,
  calcTowerTimeSeconds,
  calcTowerRewards,
  rollTowerLoot,
  isBossFloor,
} from "@/lib/game/data/towerData";

const ease = [0.23, 1, 0.32, 1] as const;

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "Pronto!";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

type Screen = "overview" | "select" | "result";

export default function TorreModal({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>("overview");
  const [team, setTeam] = useState<string[]>([]);
  const [targetFloor, setTargetFloor] = useState<number | null>(null);
  const [reward, setReward] = useState<ReturnType<typeof calcTowerRewards> | null>(null);
  const [claimedFloor, setClaimedFloor] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [droppedItem, setDroppedItem] = useState<{ itemId: string; qty: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const {
    save,
    dispatchTowerClimb,
    resolveTowerClimb,
    cancelTowerClimb,
    getBusyHeroIds,
    addCurrency,
    addItem,
    incrementDailyProgress,
    getHousingBonuses,
  } = useGameStore();

  const tower = save.tower;
  const pending = save.pendingTower;
  const busyIds = getBusyHeroIds();

  const collected = Array.from(new Set(save.collectedHeroIds.map((k) => k.split("|")[1])))
    .map((id) => HERO_MAP[id])
    .filter(Boolean);

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pending]);

  const remainingMs = pending ? Math.max(0, new Date(pending.endTime).getTime() - now) : 0;
  const isReady = pending && remainingMs === 0;
  const progress = pending
    ? Math.min(1, 1 - remainingMs / (new Date(pending.endTime).getTime() - new Date(pending.startTime).getTime()))
    : 0;

  const handleDispatch = useCallback(() => {
    if (!targetFloor || team.length === 0) return;
    const ok = dispatchTowerClimb(team, targetFloor);
    if (ok) {
      setScreen("overview");
      scheduleSave();
    }
  }, [targetFloor, team, dispatchTowerClimb]);

  const handleCollect = useCallback(() => {
    const resolved = resolveTowerClimb();
    if (!resolved) return;
    const r = calcTowerRewards(resolved.fromFloor, resolved.targetFloor);
    const hb = getHousingBonuses();
    const loot = rollTowerLoot(resolved.targetFloor, hb.dropMult, r.itemChance);

    setReward(r);
    setClaimedFloor(resolved.targetFloor);
    setIsNewRecord(resolved.targetFloor > tower.bestFloor);
    setDroppedItem(loot);

    addCurrency("ouro", r.gold);
    addCurrency("cristaisAstra", r.crystals);
    if (loot) addItem(loot.itemId, loot.qty, "tower");
    incrementDailyProgress("tower_floors_today", resolved.targetFloor - resolved.fromFloor);
    scheduleSave();
    setScreen("result");
  }, [resolveTowerClimb, tower.bestFloor, addCurrency, addItem, getHousingBonuses, incrementDailyProgress]);

  const currentTier = getTierForFloor(Math.max(1, tower.bestFloor));
  const nextBossFloor = (() => {
    for (let f = tower.bestFloor + 1; f <= 200; f++) {
      if (isBossFloor(f)) return f;
    }
    return null;
  })();

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
            onClick={() => {
              if (screen === "overview") onClose();
              else setScreen("overview");
            }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {screen === "overview" ? "Fechar" : "Voltar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">TORRE INFINITA</span>
        </div>
        <span className="text-[10px] font-bold text-amber-400">Melhor: {tower.bestFloor}F</span>
      </div>

      <AnimatePresence mode="wait">
        {/* Overview */}
        {screen === "overview" && (
          <motion.div
            key="overview"
            className="flex flex-1 flex-col overflow-y-auto px-5 py-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Stats */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <StatCard label="Melhor Andar" value={`${tower.bestFloor}F`} color="rgb(200,155,60)" />
              <StatCard label="Esta Semana" value={`${tower.weeklyBest}F`} color="rgb(170,130,255)" />
            </div>

            {/* Current Tier info */}
            {tower.bestFloor < 200 && (
              <div
                className="mb-4 rounded-xl border px-4 py-3"
                style={{ borderColor: "rgba(200,155,60,0.2)", background: "rgba(200,155,60,0.04)" }}
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-violet/60">Zona atual</p>
                <p className="mt-1 text-[11px] font-bold text-cream/80">{currentTier.label}</p>
                <p className="text-[11px] text-violet/50">
                  Pisos {currentTier.fromFloor}–{currentTier.toFloor} · {currentTier.minutesPerFloor}min/piso
                  {nextBossFloor && ` · Próximo boss: ${nextBossFloor}F`}
                </p>
              </div>
            )}

            {/* Pending climb */}
            {pending ? (
              <div
                className="mb-4 rounded-xl border px-4 py-4"
                style={{ borderColor: isReady ? "rgba(100,220,140,0.4)" : "rgba(200,155,60,0.3)", background: isReady ? "rgba(100,220,140,0.06)" : "rgba(200,155,60,0.06)" }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: isReady ? "rgb(100,220,140)" : "rgba(200,155,60,0.7)" }}>
                      {isReady ? "Escalada completa!" : "Escalando..."}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-cream/80">
                      {pending.fromFloor}F → {pending.targetFloor}F
                    </p>
                    <p className="text-[11px] text-violet/50">
                      {pending.heroIds.length} herói{pending.heroIds.length > 1 ? "s" : ""} despachado{pending.heroIds.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  {!isReady && (
                    <div className="text-right">
                      <p className="text-[18px] font-black text-amber-400" style={{ fontFamily: "var(--font-cinzel)" }}>
                        {fmtCountdown(remainingMs)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Battle animation */}
                {!isReady && (
                  <div className="mb-3">
                    <BattleScene
                      variant="tower"
                      heroCount={pending.heroIds.length}
                      enemyName={`Andar ${pending.targetFloor}`}
                      progressPct={progress}
                      timeLabel={fmtCountdown(remainingMs)}
                      diffColor="rgb(200,155,60)"
                    />
                  </div>
                )}
                {/* Progress bar */}
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-void/80">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: isReady ? "rgb(100,220,140)" : "rgb(200,155,60)" }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="flex gap-2">
                  {isReady ? (
                    <motion.button
                      onClick={handleCollect}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="flex-1 rounded-xl border py-3 text-[11px] font-bold tracking-widest"
                      style={{ borderColor: "rgba(100,220,140,0.5)", background: "rgba(100,220,140,0.12)", color: "rgb(100,220,140)" }}
                    >
                      RECOLHER RECOMPENSAS
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => { cancelTowerClimb(); scheduleSave(); }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="flex-1 rounded-xl border border-red-500/20 py-2.5 text-[10px] font-bold tracking-wider text-red-400/60"
                    >
                      Cancelar Escalada
                    </motion.button>
                  )}
                </div>
              </div>
            ) : null}

            {/* Tier list */}
            <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-violet/60">Andares da Torre</p>
            <div className="mb-5 flex flex-col gap-1.5">
              {TOWER_TIERS.map((tier) => {
                const completed = tower.bestFloor >= tier.toFloor;
                const inProgress = tower.bestFloor >= tier.fromFloor && tower.bestFloor < tier.toFloor;
                const locked = tower.bestFloor < tier.fromFloor - 1;
                return (
                  <div
                    key={tier.tier}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                    style={{
                      borderColor: completed ? "rgba(100,220,140,0.3)" : inProgress ? "rgba(200,155,60,0.3)" : "rgba(122,111,160,0.1)",
                      background: completed ? "rgba(100,220,140,0.04)" : inProgress ? "rgba(200,155,60,0.04)" : "transparent",
                      opacity: locked ? 0.4 : 1,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: completed ? "rgb(100,220,140)" : inProgress ? "rgb(200,155,60)" : "rgba(122,111,160,0.5)" }}
                      >
                        {completed ? "✓" : inProgress ? "◎" : "○"} T{tier.tier}
                      </span>
                      <div>
                        <p className="text-[11px] text-cream/60">{tier.label}</p>
                        <p className="text-[10px] text-violet/60">{tier.fromFloor}–{tier.toFloor}F · {tier.minutesPerFloor}min/piso</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-violet/60">
                      {fmtDuration(calcTowerTimeSeconds(Math.max(tower.bestFloor, tier.fromFloor - 1), tier.toFloor))}
                    </span>
                  </div>
                );
              })}
            </div>

            {!pending && tower.bestFloor < 200 && (
              <motion.button
                onClick={() => setScreen("select")}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="mt-auto w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
                style={{ borderColor: "rgba(200,155,60,0.4)", background: "rgba(200,155,60,0.08)", color: "rgb(200,155,60)" }}
              >
                ESCALAR A TORRE
              </motion.button>
            )}
            {tower.bestFloor >= 200 && (
              <div className="mt-4 text-center text-[11px] font-bold text-amber-400" style={{ fontFamily: "var(--font-cinzel)" }}>
                TORRE CONQUISTADA
              </div>
            )}
          </motion.div>
        )}

        {/* Team + Target select */}
        {screen === "select" && (
          <motion.div
            key="select"
            className="flex flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease }}
          >
            <div className="flex-1 overflow-y-auto">
              {/* Target floor selector */}
              <div className="px-4 pt-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-violet/60">Objetivo</p>
                <div className="flex flex-col gap-1.5">
                  {TOWER_TIERS.filter((t) => t.toFloor > tower.bestFloor).map((tier) => {
                    const from = Math.max(tower.bestFloor, tier.fromFloor - 1);
                    const secs = calcTowerTimeSeconds(from, tier.toFloor);
                    const selected = targetFloor === tier.toFloor;
                    return (
                      <motion.button
                        key={tier.tier}
                        onClick={() => setTargetFloor(tier.toFloor)}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                        className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                        style={{
                          borderColor: selected ? "rgba(200,155,60,0.5)" : "rgba(122,111,160,0.15)",
                          background: selected ? "rgba(200,155,60,0.1)" : "rgba(122,111,160,0.04)",
                        }}
                      >
                        <div className="text-left">
                          <p className="text-[10px] font-bold" style={{ color: selected ? "rgb(200,155,60)" : "rgba(232,217,160,0.7)" }}>
                            Piso {tier.toFloor} — {tier.label}
                          </p>
                          <p className="text-[10px] text-violet/60">{tier.fromFloor}–{tier.toFloor}F · boss a cada 10 pisos</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold" style={{ color: selected ? "rgb(200,155,60)" : "rgba(122,111,160,0.6)" }}>
                            {fmtDuration(secs)}
                          </p>
                          <p className="text-[10px] text-violet/60">{tier.minutesPerFloor}min/piso</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Hero selection */}
              <div className="px-4 pt-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-violet/60">
                  Time (máx. 3) — {team.length}/3
                </p>
                <div className="grid grid-cols-3 gap-2 pb-4">
                  {collected.map((hero) => {
                    if (!hero) return null;
                    const sel = team.includes(hero.heroId);
                    const busy = busyIds.includes(hero.heroId);
                    return (
                      <motion.button
                        key={hero.heroId}
                        onClick={() => {
                          if (busy) return;
                          setTeam(sel ? team.filter((id) => id !== hero.heroId) : team.length < 3 ? [...team, hero.heroId] : team);
                        }}
                        whileTap={!busy ? { scale: 0.94 } : undefined}
                        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                        className="flex flex-col items-center rounded-xl border pb-2 pt-3"
                        style={{
                          borderColor: sel ? "rgba(200,155,60,0.5)" : busy ? "rgba(255,80,80,0.15)" : "rgba(122,111,160,0.15)",
                          background: sel ? "rgba(200,155,60,0.1)" : busy ? "rgba(255,80,80,0.04)" : "rgba(122,111,160,0.04)",
                          opacity: busy ? 0.45 : 1,
                        }}
                      >
                        <span className="mb-1 text-2xl">{hero.portrait}</span>
                        <p className="text-[10px] font-bold text-cream/70">{hero.name.split(",")[0]}</p>
                        {busy && <p className="text-[7px] text-red-400/70">ocupado</p>}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dispatch bar */}
            <div className="border-t border-violet/10 px-4 py-3">
              {targetFloor && team.length > 0 && (
                <p className="mb-2 text-center text-[11px] text-violet/50">
                  Tempo estimado: <span className="font-bold text-amber-400">
                    {fmtDuration(calcTowerTimeSeconds(tower.bestFloor, targetFloor))}
                  </span>
                </p>
              )}
              <motion.button
                onClick={team.length > 0 && targetFloor ? handleDispatch : undefined}
                whileTap={team.length > 0 && targetFloor ? { scale: 0.97 } : undefined}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
                style={{
                  borderColor: team.length > 0 && targetFloor ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.1)",
                  background: team.length > 0 && targetFloor ? "rgba(200,155,60,0.1)" : "transparent",
                  color: team.length > 0 && targetFloor ? "rgb(200,155,60)" : "rgba(122,111,160,0.3)",
                }}
              >
                DESPACHAR HERÓIS
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Result */}
        {screen === "result" && reward && (
          <motion.div
            key="result"
            className="flex flex-1 flex-col items-center justify-center gap-5 px-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="text-5xl">🏛️</div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-violet/50">Escalada Concluída</p>
              <p className="mt-2 text-4xl font-black text-amber-400" style={{ fontFamily: "var(--font-cinzel)" }}>
                {claimedFloor}F
              </p>
              {isNewRecord && (
                <p className="mt-1 text-[10px] font-bold text-green-400">Novo recorde!</p>
              )}
            </div>

            <div
              className="w-full rounded-xl border px-4 py-4"
              style={{ borderColor: "rgba(200,155,60,0.2)", background: "rgba(200,155,60,0.05)" }}
            >
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Recompensas</p>
              <div className="flex flex-col gap-1.5">
                <RewardRow label="Ouro" value={`+${reward.gold.toLocaleString("pt-BR")}`} color="rgb(200,155,60)" />
                <RewardRow label="Cristais Astra" value={`+${reward.crystals}`} color="rgb(170,130,255)" />
                <RewardRow label="XP" value={`+${reward.xp.toLocaleString("pt-BR")}`} color="rgb(100,220,140)" />
                <RewardRow
                  label="Item"
                  value={droppedItem ? `${droppedItem.itemId} ×${droppedItem.qty}` : "Nenhum"}
                  color={droppedItem ? "rgb(232,217,160)" : "rgba(122,111,160,0.4)"}
                />
              </div>
            </div>

            <div className="flex w-full gap-3">
              <motion.button
                onClick={() => { setTeam([]); setTargetFloor(null); setScreen("select"); }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="flex-1 rounded-xl border border-violet/20 py-3.5 text-[11px] font-bold tracking-wider text-violet/60"
              >
                NOVA ESCALADA
              </motion.button>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="flex-1 rounded-xl border py-3.5 text-[11px] font-bold tracking-wider"
                style={{ borderColor: "rgba(200,155,60,0.4)", background: "rgba(200,155,60,0.1)", color: "rgb(200,155,60)" }}
              >
                SAIR
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center rounded-xl border py-4"
      style={{ borderColor: `${color}30`, background: `${color}08` }}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-violet/60">{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color, fontFamily: "var(--font-cinzel)" }}>{value}</p>
    </div>
  );
}

function RewardRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-violet/50">{label}</span>
      <span className="text-[10px] font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
