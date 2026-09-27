"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { HERO_MAP } from "@/lib/game/data/heroes";
import { scheduleSave } from "@/lib/game/save";
import { buildHeroCombatant, simulateBattle, type CombatantSnapshot } from "@/lib/game/combat";

const ease = [0.23, 1, 0.32, 1] as const;

type Boss = {
  id: string;
  name: string;
  portrait: string;
  element: string;
  hp: number;
  level: number;
  description: string;
  ouroReward: number;
  cristaisReward: number;
  selosReward: number;
  weeklyLimit: number;
};

const WEEKLY_BOSSES: Boss[] = [
  {
    id: "boss_wyrm",
    name: "Wyrm do Caos",
    portrait: "🐉",
    element: "Fire",
    hp: 150000,
    level: 50,
    description: "Um dragão ancestral que emergiu das profundezas vulcânicas.",
    ouroReward: 3000,
    cristaisReward: 200,
    selosReward: 2,
    weeklyLimit: 3,
  },
  {
    id: "boss_titan",
    name: "Titã de Pedra",
    portrait: "⛰",
    element: "Earth",
    hp: 200000,
    level: 65,
    description: "Guardião do portal dimensional, selado por milênios.",
    ouroReward: 5000,
    cristaisReward: 350,
    selosReward: 3,
    weeklyLimit: 2,
  },
  {
    id: "boss_specter",
    name: "Espectro das Sombras",
    portrait: "👻",
    element: "Dark",
    hp: 120000,
    level: 40,
    description: "Alma condenada de um invocador que cruzou os limites proibidos.",
    ouroReward: 2000,
    cristaisReward: 150,
    selosReward: 1,
    weeklyLimit: 5,
  },
];

function buildBoss(boss: Boss): CombatantSnapshot {
  const heroId = "morghul_sombrio";
  const hero = HERO_MAP[heroId] ?? HERO_MAP["kaelith_eterno"];
  const base = buildHeroCombatant(hero!, 6, 5, boss.level);
  return {
    ...base,
    id: boss.id,
    name: boss.name,
    portrait: boss.portrait,
    isHero: false,
    maxHp: boss.hp,
    hp: boss.hp,
  };
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split("T")[0];
}

type Screen = "list" | "select" | "result";

export default function BossHuntModal({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>("list");
  const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
  const [team, setTeam] = useState<string[]>([]);
  const [result, setResult] = useState<{ won: boolean; bossId: string } | null>(null);
  const { save, addCurrency, incrementDailyProgress } = useGameStore();

  const weekStart = getWeekStart();
  const bossHunt = save.bossHunt;
  const isCurrentWeek = bossHunt.weekStart === weekStart;
  const weeklyDefeated = isCurrentWeek ? bossHunt.weeklyDefeated : [];

  function getKillCount(bossId: string): number {
    return weeklyDefeated.filter((id) => id === bossId).length;
  }

  function startFight(boss: Boss) {
    if (team.length === 0) return;
    const store = useGameStore.getState();
    const heroes = team.map((heroId) => {
      const hero = HERO_MAP[heroId];
      if (!hero) return null;
      const prog = store.getHeroProgression(heroId);
      const lvl = store.getHeroLevel(heroId);
      const bonuses = store.getHeroBonuses(heroId);
      return buildHeroCombatant(hero, prog.rank, Math.max(1, Math.min(5, prog.stars)) as 1|2|3|4|5, lvl.level, bonuses.forgeBonus, bonuses.atkMult);
    }).filter((h): h is CombatantSnapshot => h !== null);

    const bossSnap = buildBoss(boss);
    const r = simulateBattle(heroes, [bossSnap]);

    if (r.won) {
      addCurrency("ouro", boss.ouroReward);
      addCurrency("cristaisAstra", boss.cristaisReward);
      addCurrency("selosDeInvocacao", boss.selosReward);
      store.addPlayerXp(boss.level * 10);

      useGameStore.setState((s) => {
        const bh = s.save.bossHunt;
        if (bh.weekStart !== weekStart) {
          bh.weekStart = weekStart;
          bh.weeklyDefeated = [];
        }
        bh.weeklyDefeated.push(boss.id);
        if (!bh.allTimeKills.includes(boss.id)) bh.allTimeKills.push(boss.id);
      });
      incrementDailyProgress("boss_hunt_today");
      scheduleSave();
    }

    setResult({ won: r.won, bossId: boss.id });
    setScreen("result");
  }

  const collected = Array.from(new Set(save.collectedHeroIds.map((k) => k.split("|")[1])))
    .map((id) => HERO_MAP[id]).filter(Boolean);

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
            onClick={screen === "list" ? onClose : () => { setScreen("list"); setActiveBoss(null); setTeam([]); }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {screen === "list" ? "Fechar" : "Voltar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">BOSS HUNT</span>
        </div>
        <span className="text-[10px] text-violet/40">Reset semanal</span>
      </div>

      <AnimatePresence mode="wait">
        {/* Boss list */}
        {screen === "list" && (
          <motion.div
            key="list"
            className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-violet/40">Chefões desta semana</p>
            <div className="flex flex-col gap-3">
              {WEEKLY_BOSSES.map((boss) => {
                const kills = getKillCount(boss.id);
                const canFight = kills < boss.weeklyLimit;
                const allTimeKilled = save.bossHunt.allTimeKills.includes(boss.id);
                return (
                  <div
                    key={boss.id}
                    className="rounded-xl border px-4 py-4"
                    style={{
                      borderColor: !canFight ? "rgba(100,220,140,0.2)" : "rgba(255,100,60,0.2)",
                      background: !canFight ? "rgba(100,220,140,0.03)" : "rgba(255,100,60,0.04)",
                    }}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border text-2xl"
                        style={{ borderColor: "rgba(255,100,60,0.3)", background: "rgba(255,100,60,0.08)" }}
                      >
                        {boss.portrait}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-cream/85">{boss.name}</p>
                        <p className="text-[9px] text-violet/45">{boss.description}</p>
                        <p className="mt-0.5 text-[8px] text-violet/35">Nível {boss.level} · {boss.element}</p>
                      </div>
                    </div>

                    <div className="mb-3 flex gap-3 text-[9px] text-violet/50">
                      <span className="font-bold text-amber-400">◆ {boss.ouroReward.toLocaleString("pt-BR")}</span>
                      <span style={{ color: "rgb(170,130,255)" }}>✦ {boss.cristaisReward}</span>
                      <span style={{ color: "rgb(90,150,255)" }}>✦ {boss.selosReward} selos</span>
                    </div>

                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex-1 overflow-hidden rounded-full bg-violet/10" style={{ height: 4 }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(kills / boss.weeklyLimit) * 100}%`,
                            background: !canFight ? "rgb(100,220,140)" : "rgb(255,100,60)",
                          }}
                        />
                      </div>
                      <span className="text-[8px] font-bold" style={{ color: !canFight ? "rgb(100,220,140)" : "rgba(255,255,255,0.5)" }}>
                        {kills}/{boss.weeklyLimit}
                      </span>
                    </div>

                    {allTimeKilled && (
                      <p className="mb-2 text-[8px] font-bold text-green-400">Derrotado ao menos uma vez!</p>
                    )}

                    <motion.button
                      onClick={canFight ? () => { setActiveBoss(boss); setScreen("select"); } : undefined}
                      whileTap={canFight ? { scale: 0.97 } : undefined}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="w-full rounded-xl border py-2.5 text-[10px] font-bold tracking-widest"
                      style={{
                        borderColor: canFight ? "rgba(255,100,60,0.4)" : "rgba(100,220,140,0.2)",
                        background: canFight ? "rgba(255,100,60,0.08)" : "transparent",
                        color: canFight ? "rgb(255,130,80)" : "rgb(100,220,140)",
                      }}
                    >
                      {canFight ? "ATACAR" : "LIMITE SEMANAL ATINGIDO"}
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Team select */}
        {screen === "select" && activeBoss && (
          <motion.div
            key="select"
            className="flex flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease }}
          >
            <div className="flex items-center gap-3 border-b border-violet/10 px-4 py-3">
              <span className="text-2xl">{activeBoss.portrait}</span>
              <div>
                <p className="text-[12px] font-bold text-cream/80">{activeBoss.name}</p>
                <p className="text-[9px] text-violet/40">Nível {activeBoss.level}</p>
              </div>
            </div>
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
                        borderColor: sel ? "rgba(255,100,60,0.5)" : "rgba(122,111,160,0.15)",
                        background: sel ? "rgba(255,100,60,0.1)" : "rgba(122,111,160,0.04)",
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
                onClick={team.length > 0 ? () => startFight(activeBoss) : undefined}
                whileTap={team.length > 0 ? { scale: 0.97 } : undefined}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
                style={{
                  borderColor: team.length > 0 ? "rgba(255,100,60,0.4)" : "rgba(122,111,160,0.1)",
                  background: team.length > 0 ? "rgba(255,100,60,0.1)" : "transparent",
                  color: team.length > 0 ? "rgb(255,130,80)" : "rgba(122,111,160,0.3)",
                }}
              >
                ATACAR
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Result */}
        {screen === "result" && result && activeBoss && (
          <motion.div
            key="result"
            className="flex flex-1 flex-col items-center justify-center gap-5 px-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="text-6xl">{result.won ? activeBoss.portrait : "💔"}</div>
            <div className="text-center">
              <p className="text-2xl font-black tracking-[0.2em] text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
                {result.won ? "DERROTADO!" : "DERROTA"}
              </p>
              {result.won && (
                <div className="mt-3 flex flex-col gap-1 text-[11px] font-bold">
                  <p className="text-amber-400">+{activeBoss.ouroReward.toLocaleString("pt-BR")} Ouro</p>
                  <p style={{ color: "rgb(170,130,255)" }}>+{activeBoss.cristaisReward} Cristais</p>
                  <p style={{ color: "rgb(90,150,255)" }}>+{activeBoss.selosReward} Selos</p>
                </div>
              )}
              {!result.won && (
                <p className="mt-2 text-[11px] text-violet/50">Fortaleça seu time e tente novamente.</p>
              )}
            </div>
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
                style={{ borderColor: "rgba(255,100,60,0.4)", background: "rgba(255,100,60,0.1)", color: "rgb(255,130,80)" }}
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
