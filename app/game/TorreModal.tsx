"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { HERO_MAP } from "@/lib/game/data/heroes";
import { scheduleSave } from "@/lib/game/save";
import { buildHeroCombatant, simulateBattle, type CombatantSnapshot } from "@/lib/game/combat";

const ease = [0.23, 1, 0.32, 1] as const;

const FLOOR_MILESTONES: Record<number, { label: string; reward: string }> = {
  10:  { label: "Guardião da Torre",  reward: "500 ouro + 1 Selo"      },
  25:  { label: "Escalador Ágil",     reward: "1000 ouro + 100 Cristais" },
  50:  { label: "Conquistador",       reward: "5 Selos + 500 Cristais"   },
  100: { label: "Lendário da Torre",  reward: "Selo Livre + 2000 Cristais" },
};

function buildTowerEnemies(floor: number): CombatantSnapshot[] {
  const count = Math.min(3, 1 + Math.floor(floor / 15));
  const heroIds = ["kaelith_eterno","serah_celestial","morghul_sombrio","azara_serafim","gornak_martelo"];
  const level = Math.max(1, Math.floor(floor * 0.8));
  return Array.from({ length: count }, (_, i) => {
    const hero = HERO_MAP[heroIds[i % heroIds.length]];
    if (!hero) return null;
    const rank = Math.min(6, Math.floor(floor / 10)) as 0|1|2|3|4|5|6;
    return buildHeroCombatant(hero, rank, 1, level);
  }).filter((h): h is CombatantSnapshot => h !== null);
}

type Screen = "overview" | "select" | "climbing" | "result";

export default function TorreModal({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>("overview");
  const [team, setTeam] = useState<string[]>([]);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [finalFloor, setFinalFloor] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [floorLog, setFloorLog] = useState<{ floor: number; won: boolean }[]>([]);
  const cancelRef = useRef(false);

  const { save, updateTower, addCurrency } = useGameStore();
  const tower = save.tower;
  const collected = Array.from(new Set(save.collectedHeroIds.map((k) => k.split("|")[1])))
    .map((id) => HERO_MAP[id]).filter(Boolean);

  function startClimb() {
    if (team.length === 0) return;
    cancelRef.current = false;
    setCurrentFloor(0);
    setFloorLog([]);
    setScreen("climbing");
    setIsRunning(true);
  }

  useEffect(() => {
    if (!isRunning || screen !== "climbing") return;

    const store = useGameStore.getState();
    const heroes = team.map((heroId) => {
      const hero = HERO_MAP[heroId];
      if (!hero) return null;
      const prog = store.getHeroProgression(heroId);
      const lvl = store.getHeroLevel(heroId);
      return buildHeroCombatant(hero, prog.rank, Math.max(1, Math.min(5, prog.stars)) as 1|2|3|4|5, lvl.level);
    }).filter((h): h is CombatantSnapshot => h !== null);

    let floor = 0;
    const log: { floor: number; won: boolean }[] = [];
    let running = true;

    const interval = setInterval(() => {
      if (!running || cancelRef.current) {
        clearInterval(interval);
        return;
      }
      floor++;
      const enemies = buildTowerEnemies(floor);
      const result = simulateBattle(heroes, enemies);
      log.push({ floor, won: result.won });
      setFloorLog([...log]);
      setCurrentFloor(floor);

      if (!result.won || floor >= 200) {
        running = false;
        clearInterval(interval);
        setIsRunning(false);
        const reached = result.won ? floor : floor - 1;
        setFinalFloor(reached);
        updateTower(reached);
        if (reached > 0) useGameStore.getState().incrementDailyProgress("tower_floors_today", reached);

        const ouroReward = Math.min(5000, reached * 20);
        addCurrency("ouro", ouroReward);
        if (reached >= 10) addCurrency("selosDeInvocacao", Math.floor(reached / 10));
        if (reached >= 25) addCurrency("cristaisAstra", Math.floor(reached * 2));
        scheduleSave();
        setTimeout(() => setScreen("result"), 400);
      }
    }, 120);

    return () => {
      running = false;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const nextMilestone = Object.keys(FLOOR_MILESTONES)
    .map(Number)
    .find((m) => m > tower.bestFloor);

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
              cancelRef.current = true;
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

            {/* Milestones */}
            <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-violet/40">Marcos da Torre</p>
            <div className="mb-5 flex flex-col gap-1.5">
              {Object.entries(FLOOR_MILESTONES).map(([floor, info]) => {
                const floorNum = Number(floor);
                const reached = tower.bestFloor >= floorNum;
                return (
                  <div
                    key={floor}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                    style={{
                      borderColor: reached ? "rgba(100,220,140,0.3)" : "rgba(122,111,160,0.1)",
                      background: reached ? "rgba(100,220,140,0.04)" : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold" style={{ color: reached ? "rgb(100,220,140)" : "rgba(122,111,160,0.5)" }}>
                        {reached ? "✓" : "○"} {floorNum}F
                      </span>
                      <span className="text-[9px] text-violet/50">{info.label}</span>
                    </div>
                    <span className="text-[8px] text-violet/40">{info.reward}</span>
                  </div>
                );
              })}
            </div>

            {nextMilestone && (
              <p className="mb-5 text-center text-[9px] text-violet/40">
                Próximo marco: <span className="text-amber-400">{nextMilestone}F</span> — {FLOOR_MILESTONES[nextMilestone].reward}
              </p>
            )}

            <motion.button
              onClick={() => setScreen("select")}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="mt-auto w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
              style={{ borderColor: "rgba(200,155,60,0.4)", background: "rgba(200,155,60,0.08)", color: "rgb(200,155,60)" }}
            >
              ESCALAR A TORRE
            </motion.button>
          </motion.div>
        )}

        {/* Team select */}
        {screen === "select" && (
          <motion.div
            key="select"
            className="flex flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease }}
          >
            <div className="px-4 pt-4">
              <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-violet/40">
                Selecione seu time (máx. 3) — {team.length}/3
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <div className="grid grid-cols-3 gap-2 pb-4">
                {collected.map((hero) => {
                  if (!hero) return null;
                  const sel = team.includes(hero.heroId);
                  return (
                    <motion.button
                      key={hero.heroId}
                      onClick={() => setTeam(sel ? team.filter((id) => id !== hero.heroId) : team.length < 3 ? [...team, hero.heroId] : team)}
                      whileTap={{ scale: 0.94 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="flex flex-col items-center rounded-xl border pb-2 pt-3"
                      style={{
                        borderColor: sel ? "rgba(200,155,60,0.5)" : "rgba(122,111,160,0.15)",
                        background: sel ? "rgba(200,155,60,0.1)" : "rgba(122,111,160,0.04)",
                      }}
                    >
                      <span className="mb-1 text-2xl">{hero.portrait}</span>
                      <p className="text-[8px] font-bold text-cream/70">{hero.name.split(",")[0]}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-violet/10 px-4 py-3">
              <motion.button
                onClick={team.length > 0 ? startClimb : undefined}
                whileTap={team.length > 0 ? { scale: 0.97 } : undefined}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
                style={{
                  borderColor: team.length > 0 ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.1)",
                  background: team.length > 0 ? "rgba(200,155,60,0.1)" : "transparent",
                  color: team.length > 0 ? "rgb(200,155,60)" : "rgba(122,111,160,0.3)",
                }}
              >
                INICIAR ESCALADA
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Climbing */}
        {screen === "climbing" && (
          <motion.div
            key="climbing"
            className="flex flex-1 flex-col items-center justify-start overflow-hidden px-5 py-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6 flex flex-col items-center">
              <p className="text-[9px] uppercase tracking-[0.25em] text-violet/40">Andar Atual</p>
              <motion.p
                key={currentFloor}
                className="text-5xl font-black text-amber-400"
                style={{ fontFamily: "var(--font-cinzel)" }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                {currentFloor}F
              </motion.p>
              <p className="mt-1 text-[10px] text-violet/40">Subindo...</p>
            </div>

            <div className="w-full flex-1 overflow-y-auto">
              <div className="flex flex-col-reverse gap-1">
                {floorLog.slice(-20).reverse().map((entry, i) => (
                  <motion.div
                    key={entry.floor}
                    className="flex items-center justify-between rounded-lg px-3 py-1.5"
                    style={{
                      background: entry.won ? "rgba(100,220,140,0.04)" : "rgba(255,100,100,0.04)",
                      border: `1px solid ${entry.won ? "rgba(100,220,140,0.15)" : "rgba(255,100,100,0.2)"}`,
                      opacity: 1 - i * 0.04,
                    }}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1 - i * 0.04, x: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <span className="text-[10px] font-bold text-violet/60">{entry.floor}F</span>
                    <span className="text-[9px] font-bold" style={{ color: entry.won ? "rgb(100,220,140)" : "rgb(255,100,100)" }}>
                      {entry.won ? "✓" : "✗"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Result */}
        {screen === "result" && (
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
                {finalFloor}F
              </p>
              {finalFloor > tower.bestFloor - 1 && (
                <p className="mt-1 text-[10px] font-bold text-green-400">Novo recorde!</p>
              )}
              <div className="mt-3 text-[10px] text-violet/50">
                <p>Ouro: +{Math.min(5000, finalFloor * 20).toLocaleString("pt-BR")}</p>
                {finalFloor >= 10 && <p>Selos: +{Math.floor(finalFloor / 10)}</p>}
                {finalFloor >= 25 && <p>Cristais: +{Math.floor(finalFloor * 2)}</p>}
              </div>
            </div>

            {/* Which milestones were hit */}
            {Object.entries(FLOOR_MILESTONES).filter(([f]) => finalFloor >= Number(f)).length > 0 && (
              <div className="w-full rounded-xl border border-amber/20 px-4 py-3" style={{ background: "rgba(200,155,60,0.05)" }}>
                <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-violet/40">Marcos alcançados</p>
                {Object.entries(FLOOR_MILESTONES)
                  .filter(([f]) => finalFloor >= Number(f))
                  .map(([f, info]) => (
                    <p key={f} className="text-[10px] font-bold text-amber-400">{info.label} ({f}F)</p>
                  ))
                }
              </div>
            )}

            <div className="flex w-full gap-3">
              <motion.button
                onClick={() => { setTeam([]); setScreen("select"); }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="flex-1 rounded-xl border border-violet/20 py-3.5 text-[11px] font-bold tracking-wider text-violet/60"
              >
                TENTAR DE NOVO
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
      <p className="text-[8px] uppercase tracking-[0.2em] text-violet/40">{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color, fontFamily: "var(--font-cinzel)" }}>{value}</p>
    </div>
  );
}
