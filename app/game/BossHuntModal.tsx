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
  requiredLevel: number;
  hp: number;
  description: string;
  ouroReward: number;
  cristaisReward: number;
  selosReward: number;
  weeklyLimit: number;
};

const TIERED_BOSSES: Boss[] = [
  {
    id: "boss_lv10_goblin",
    name: "Rei Goblin",
    portrait: "👺",
    element: "Earth",
    requiredLevel: 10,
    hp: 12000,
    description: "O líder das hordas goblin do vale de Valdris.",
    ouroReward: 500,
    cristaisReward: 30,
    selosReward: 1,
    weeklyLimit: 5,
  },
  {
    id: "boss_lv20_basilisk",
    name: "Basilisco das Pedras",
    portrait: "🦎",
    element: "Earth",
    requiredLevel: 20,
    hp: 35000,
    description: "Criatura cujo olhar petrifica qualquer ser vivo.",
    ouroReward: 1200,
    cristaisReward: 70,
    selosReward: 1,
    weeklyLimit: 4,
  },
  {
    id: "boss_lv30_necromancer",
    name: "Necromante Erephus",
    portrait: "💀",
    element: "Dark",
    requiredLevel: 30,
    hp: 75000,
    description: "Mago corrompido que comanda legiões de mortos-vivos.",
    ouroReward: 2500,
    cristaisReward: 130,
    selosReward: 2,
    weeklyLimit: 3,
  },
  {
    id: "boss_lv40_specter",
    name: "Espectro das Sombras",
    portrait: "👻",
    element: "Dark",
    requiredLevel: 40,
    hp: 120000,
    description: "Alma condenada de um invocador que cruzou os limites proibidos.",
    ouroReward: 4000,
    cristaisReward: 200,
    selosReward: 2,
    weeklyLimit: 3,
  },
  {
    id: "boss_lv50_wyrm",
    name: "Wyrm do Caos",
    portrait: "🐉",
    element: "Fire",
    requiredLevel: 50,
    hp: 200000,
    description: "Um dragão ancestral que emergiu das profundezas vulcânicas.",
    ouroReward: 6000,
    cristaisReward: 300,
    selosReward: 3,
    weeklyLimit: 2,
  },
  {
    id: "boss_lv60_titan",
    name: "Titã de Pedra",
    portrait: "⛰",
    element: "Earth",
    requiredLevel: 60,
    hp: 320000,
    description: "Guardião do portal dimensional, selado por milênios.",
    ouroReward: 9000,
    cristaisReward: 450,
    selosReward: 3,
    weeklyLimit: 2,
  },
  {
    id: "boss_lv70_hydra",
    name: "Hidra Abissal",
    portrait: "🐍",
    element: "Water",
    requiredLevel: 70,
    hp: 480000,
    description: "Serpente das profundezas com múltiplas cabeças regenerativas.",
    ouroReward: 13000,
    cristaisReward: 650,
    selosReward: 4,
    weeklyLimit: 2,
  },
  {
    id: "boss_lv80_lich",
    name: "Lich Eterno",
    portrait: "🧙",
    element: "Dark",
    requiredLevel: 80,
    hp: 700000,
    description: "Feiticeiro imortal que fez pacto com a morte em troca de poder infinito.",
    ouroReward: 18000,
    cristaisReward: 900,
    selosReward: 5,
    weeklyLimit: 2,
  },
  {
    id: "boss_lv90_demigod",
    name: "Semideus Corrompido",
    portrait: "⚡",
    element: "Lightning",
    requiredLevel: 90,
    hp: 1000000,
    description: "Entidade divina consumida pela escuridão, esquecida pelos deuses.",
    ouroReward: 25000,
    cristaisReward: 1200,
    selosReward: 6,
    weeklyLimit: 1,
  },
  {
    id: "boss_lv100_void",
    name: "O Devorador do Vazio",
    portrait: "🌑",
    element: "Void",
    requiredLevel: 100,
    hp: 2500000,
    description: "A encarnação do nada absoluto. Apenas os mais poderosos ousam enfrentá-lo.",
    ouroReward: 50000,
    cristaisReward: 2500,
    selosReward: 10,
    weeklyLimit: 1,
  },
];

function buildBoss(boss: Boss): CombatantSnapshot {
  const heroId = "morghul_sombrio";
  const hero = HERO_MAP[heroId] ?? HERO_MAP["kaelith_eterno"];
  const bossRank = Math.min(6, Math.floor(boss.requiredLevel / 20)) as 0|1|2|3|4|5|6;
  const base = buildHeroCombatant(hero!, bossRank, 5, boss.requiredLevel);
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

  const playerLevel = save.playerLevel?.level ?? save.invocador?.level ?? 1;
  const weekStart = getWeekStart();
  const bossHunt = save.bossHunt;
  const isCurrentWeek = bossHunt.weekStart === weekStart;
  const weeklyDefeated = isCurrentWeek ? bossHunt.weeklyDefeated : [];

  const availableBosses = TIERED_BOSSES.filter((b) => playerLevel >= b.requiredLevel);
  const lockedBossCount = TIERED_BOSSES.filter((b) => playerLevel < b.requiredLevel).length;
  const nextLockedBoss = TIERED_BOSSES.find((b) => playerLevel < b.requiredLevel);

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
      store.addPlayerXp(boss.requiredLevel * 15);

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
        <span className="text-[10px] text-violet/60">Reset semanal · Nv. {playerLevel}</span>
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
            {availableBosses.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
                <p className="text-3xl">🔒</p>
                <p className="text-[12px] font-bold text-cream/60">Nenhum boss disponível</p>
                <p className="text-[11px] text-violet/50">
                  Alcance o nível 10 para desbloquear seu primeiro boss.
                </p>
              </div>
            )}

            {availableBosses.length > 0 && (
              <>
                <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">
                  Chefões disponíveis ({availableBosses.length}/{TIERED_BOSSES.length})
                </p>
                <div className="flex flex-col gap-3">
                  {availableBosses.map((boss) => {
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
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-bold text-cream/85">{boss.name}</p>
                              <span className="rounded bg-amber/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber/80">
                                NV.{boss.requiredLevel}
                              </span>
                            </div>
                            <p className="text-[11px] text-violet/65">{boss.description}</p>
                            <p className="mt-0.5 text-[10px] text-violet/35">{boss.element}</p>
                          </div>
                        </div>

                        <div className="mb-3 flex gap-3 text-[11px] text-violet/50">
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
                          <span className="text-[10px] font-bold" style={{ color: !canFight ? "rgb(100,220,140)" : "rgba(255,255,255,0.5)" }}>
                            {kills}/{boss.weeklyLimit}x
                          </span>
                        </div>

                        {allTimeKilled && kills < boss.weeklyLimit && (
                          <p className="mb-2 text-[10px] font-bold text-green-400">Derrotado antes!</p>
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
              </>
            )}

            {/* Next locked boss teaser */}
            {nextLockedBoss && (
              <div className="mt-4 rounded-xl border border-violet/10 px-4 py-4" style={{ background: "rgba(122,111,160,0.03)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet/15 text-xl opacity-30">
                    {nextLockedBoss.portrait}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-violet/40">{nextLockedBoss.name}</p>
                    <p className="text-[10px] text-violet/30">
                      Desbloqueado no nível {nextLockedBoss.requiredLevel} — {nextLockedBoss.requiredLevel - playerLevel} níveis restantes
                    </p>
                  </div>
                  {lockedBossCount > 1 && (
                    <span className="ml-auto text-[10px] text-violet/30">+{lockedBossCount - 1} mais</span>
                  )}
                </div>
              </div>
            )}
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
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border text-xl"
                style={{ borderColor: "rgba(255,100,60,0.3)", background: "rgba(255,100,60,0.08)" }}
              >
                {activeBoss.portrait}
              </div>
              <div>
                <p className="text-[12px] font-bold text-cream/80">{activeBoss.name}</p>
                <p className="text-[11px] text-violet/60">Nível {activeBoss.requiredLevel} · {activeBoss.element}</p>
              </div>
            </div>
            <div className="px-4 pt-4">
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">
                Selecione seu time (máx. 3) — {team.length}/3
              </p>
              {collected.length === 0 && (
                <p className="text-[11px] text-violet/40">Nenhum herói coletado ainda.</p>
              )}
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
                      <p className="text-[10px] font-bold text-cream/70">{hero.name.split(",")[0]}</p>
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
            className="flex flex-1 flex-col items-center justify-center gap-0 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease }}
          >
            <motion.div
              className="relative mb-5 flex w-full flex-col items-center overflow-hidden rounded-2xl py-8"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease }}
              style={{
                background: result.won
                  ? "linear-gradient(160deg, rgba(255,100,60,0.12), rgba(255,100,60,0.04))"
                  : "linear-gradient(160deg, rgba(255,100,100,0.08), rgba(255,100,100,0.03))",
                border: `1px solid ${result.won ? "rgba(255,130,80,0.3)" : "rgba(255,100,100,0.2)"}`,
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: result.won ? "rgba(255,130,80,0.7)" : "rgba(255,100,100,0.5)" }} />
              <motion.div
                className="mb-3 text-5xl"
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 26, delay: 0.1 }}
              >
                {result.won ? activeBoss.portrait : "💔"}
              </motion.div>
              <p
                className="text-2xl font-black tracking-[0.25em]"
                style={{
                  fontFamily: "var(--font-cinzel)",
                  color: result.won ? "rgb(255,130,80)" : "rgb(255,100,100)",
                }}
              >
                {result.won ? "DERROTADO!" : "DERROTA"}
              </p>
              {!result.won && (
                <p className="mt-2 text-[10px] text-violet/50">Fortaleça seu time e tente novamente.</p>
              )}
            </motion.div>

            {result.won && (
              <motion.div
                className="mb-5 flex w-full gap-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease, delay: 0.15 }}
              >
                <div className="flex flex-1 flex-col items-center rounded-xl border border-violet/12 py-3" style={{ background: "rgba(122,111,160,0.05)" }}>
                  <span className="text-[10px] uppercase tracking-widest text-violet/60">Ouro</span>
                  <span className="mt-1 text-base font-black text-amber-400">+{activeBoss.ouroReward.toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex flex-1 flex-col items-center rounded-xl border border-violet/12 py-3" style={{ background: "rgba(122,111,160,0.05)" }}>
                  <span className="text-[10px] uppercase tracking-widest text-violet/60">Cristais</span>
                  <span className="mt-1 text-base font-black" style={{ color: "rgb(170,130,255)" }}>+{activeBoss.cristaisReward}</span>
                </div>
                <div className="flex flex-1 flex-col items-center rounded-xl border border-violet/12 py-3" style={{ background: "rgba(122,111,160,0.05)" }}>
                  <span className="text-[10px] uppercase tracking-widest text-violet/60">Selos</span>
                  <span className="mt-1 text-base font-black" style={{ color: "rgb(90,150,255)" }}>+{activeBoss.selosReward}</span>
                </div>
              </motion.div>
            )}

            <motion.div
              className="flex w-full gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease, delay: result.won ? 0.3 : 0.2 }}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
